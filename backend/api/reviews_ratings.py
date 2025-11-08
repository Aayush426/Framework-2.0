from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import uuid

# ---------- Setup ----------
load_dotenv()
router = APIRouter(prefix="/api", tags=["Reviews & Reports"])

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["test_database"]

# ---------- Collections (Standardized) ----------
reports_collection = db["reports"]
reviews_collection = db["reviews"]
notifications_collection = db["notifications"]
users_collection = db["users"]
profiles_collection = db["photographer_profiles"]
portfolio_collection = db["portfolio_items"]
packages_collection = db["packages"]

# ---------- Predefined Report Reasons ----------
REPORT_REASONS = [
    "Hate Speech",
    "Nudity or Pornographic Content",
    "Spam or Scam",
    "Fake Profile",
    "Abusive Language",
    "Copyright Violation",
    "Harassment or Bullying",
    "Violence or Threats",
    "Discrimination",
    "Misleading Information",
    "Inappropriate Behavior",
    "Illegal Content",
    "Self-harm or Suicide Content",
    "Animal Cruelty",
    "Other",
]


# ---------- Models ----------
class ReviewSchema(BaseModel):
    photographer_id: str
    user_id: str
    rating: int = Field(ge=1, le=5)
    review_text: Optional[str] = None


class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    photographer_id: str
    user_id: str
    rating: int
    review_text: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReportSchema(BaseModel):
    photographer_id: str
    user_id: str
    reason: str = Field(..., description="Select from predefined reasons")
    description: Optional[str] = Field(None, description="Optional comment for clarification")


class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reporter_id: str
    photographer_id: str
    reason: str
    description: Optional[str] = None
    status: str = "pending"  # pending / reviewed
    admin_action: Optional[str] = None  # restrict / delete / dismiss
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    report_id: Optional[str] = None
    photographer_id: Optional[str] = None
    reporter_id: Optional[str] = None
    admin_action: Optional[str] = None
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------- Helper: Restriction Check ----------
async def ensure_not_restricted(user_id: str):
    """Reusable guard to block restricted photographers from performing actions."""
    user = await users_collection.find_one({"id": user_id}, {"_id": 0, "restricted": 1, "restriction_reason": 1})
    if user and user.get("restricted"):
        raise HTTPException(
            status_code=403,
            detail=f"Account restricted by admin: {user.get('restriction_reason', 'Policy violation')}",
        )


# ---------- Review Routes ----------
@router.post("/reviews", response_model=dict)
async def add_or_update_review(review: ReviewSchema):
    """Submit or update a review for a photographer"""
    existing = await reviews_collection.find_one(
        {"photographer_id": review.photographer_id, "user_id": review.user_id}
    )

    if existing:
        await reviews_collection.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "rating": review.rating,
                    "review_text": review.review_text,
                    "created_at": datetime.now(timezone.utc),
                }
            },
        )
        message = "Review updated successfully"
    else:
        new_review = Review(**review.dict())
        await reviews_collection.insert_one(new_review.model_dump())
        message = "Review added successfully"

    # Recalculate average rating
    all_reviews = await reviews_collection.find({"photographer_id": review.photographer_id}).to_list(1000)
    avg_rating = (
        round(sum(r.get("rating", 0) for r in all_reviews) / len(all_reviews), 2) if all_reviews else 0
    )

    await profiles_collection.update_one(
        {"user_id": review.photographer_id}, {"$set": {"average_rating": avg_rating}}
    )

    return {"message": message, "average_rating": avg_rating}


@router.get("/reviews/{photographer_id}", response_model=List[dict])
async def get_reviews(photographer_id: str):
    """Fetch all reviews for a photographer"""
    reviews = await reviews_collection.find({"photographer_id": photographer_id}).to_list(1000)
    for r in reviews:
        reviewer = await users_collection.find_one(
            {"id": r["user_id"]}, {"_id": 0, "full_name": 1, "email": 1}
        )
        r["reviewer"] = reviewer or {}
    return reviews


# ---------- Report Routes ----------
@router.post("/reports", response_model=dict)
async def submit_report(report: ReportSchema):
    """Report a photographer (dropdown reason + optional comment)"""
    if report.reason not in REPORT_REASONS:
        raise HTTPException(status_code=400, detail="Invalid report reason")

    new_report = Report(
        reporter_id=report.user_id,
        photographer_id=report.photographer_id,
        reason=report.reason,
        description=report.description,
    )
    await reports_collection.insert_one(new_report.model_dump())
    return {"message": "Report submitted successfully"}


@router.get("/reports/reasons", response_model=List[str])
async def get_report_reasons():
    """Get predefined report reasons for dropdown"""
    return REPORT_REASONS


@router.get("/reports/pending", response_model=List[dict])
async def get_pending_reports():
    """Admin: Fetch all pending reports"""
    pending = await reports_collection.find({"status": "pending"}).to_list(1000)
    return pending


# ---------- Admin Moderation ----------
@router.put("/reports/{report_id}/moderate", response_model=dict)
async def moderate_report(
    report_id: str,
    action: str = Query(..., description="restrict / delete / dismiss"),
    admin_id: str = Query(..., description="Admin ID performing the action"),
):
    """Admin reviews and takes action on a report"""

    valid_actions = ["restrict", "delete", "dismiss"]
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of {valid_actions}")

    report = await reports_collection.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    photographer_id = report["photographer_id"]

    # 1️⃣ Admin deletes photographer
    if action == "delete":
        await users_collection.delete_one({"id": photographer_id})
        await profiles_collection.delete_one({"user_id": photographer_id})
        await portfolio_collection.delete_many({"photographer_id": photographer_id})
        action_message = "Photographer permanently deleted from the platform."

    # 2️⃣ Admin restricts photographer
    elif action == "restrict":
        reason_text = report.get("reason", "Policy violation")
        await users_collection.update_one(
            {"id": photographer_id},
            {
                "$set": {
                    "restricted": True,
                    "restriction_reason": reason_text,
                    "restricted_at": datetime.now(timezone.utc),
                }
            },
        )
        action_message = f"Photographer temporarily restricted due to: {reason_text}"

    # 3️⃣ Admin dismisses report
    else:
        action_message = "Report dismissed with no action taken."

    # Update report document
    await reports_collection.update_one(
        {"id": report_id},
        {
            "$set": {
                "status": "reviewed",
                "admin_action": action,
                "reviewed_by": admin_id,
                "reviewed_at": datetime.now(timezone.utc),
            }
        },
    )

    # Create notification for both photographer and reporter
    notification = Notification(
        report_id=report_id,
        photographer_id=photographer_id,
        reporter_id=report["reporter_id"],
        admin_action=action,
        message=action_message,
    )
    await notifications_collection.insert_one(notification.model_dump())

    return {"message": f"Report reviewed successfully: {action_message}", "notification_sent": True}


# ---------- Notification Routes ----------
@router.get("/notifications/user/{user_id}")
async def get_user_notifications(user_id: str):
    """Fetch notifications for a reporting user"""
    return await notifications_collection.find({"reporter_id": user_id}).to_list(1000)


@router.get("/notifications/photographer/{photographer_id}")
async def get_photographer_notifications(photographer_id: str):
    """Fetch notifications for a photographer"""
    return await notifications_collection.find({"photographer_id": photographer_id}).to_list(1000)


# ---------- Photographer Full Data (Safe Access) ----------
@router.get("/photographer/full/{photographer_id}", response_model=dict)
async def get_photographer_full_view(photographer_id: str):
    """Fetch full photographer data (profile, portfolio, packages, reviews, and reports)."""
    try:
        user = await users_collection.find_one(
            {"id": photographer_id}, {"_id": 0, "full_name": 1, "email": 1, "role": 1}
        )
        profile = await profiles_collection.find_one({"user_id": photographer_id}, {"_id": 0})
        portfolio = await portfolio_collection.find(
            {"photographer_id": photographer_id}, {"_id": 0}
        ).to_list(1000)
        packages = await packages_collection.find(
            {"photographer_id": photographer_id}, {"_id": 0}
        ).to_list(1000)

        # Reviews
        reviews = await reviews_collection.find({"photographer_id": photographer_id}, {"_id": 0}).to_list(1000)
        for r in reviews:
            reviewer = await users_collection.find_one(
                {"id": r["user_id"]}, {"_id": 0, "full_name": 1, "email": 1}
            )
            r["reviewer"] = reviewer or {}

        # Reports
        reports = await reports_collection.find({"photographer_id": photographer_id}, {"_id": 0}).to_list(1000)
        for rp in reports:
            reporter = await users_collection.find_one(
                {"id": rp["reporter_id"]}, {"_id": 0, "full_name": 1, "email": 1}
            )
            rp["reporter"] = reporter or {}

        return {
            "user": user,
            "profile": profile,
            "portfolio": portfolio,
            "packages": packages,
            "reviews": reviews,
            "reports": reports,
        }

    except Exception as e:
        print("Error fetching photographer full data:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch photographer data")


# ---------- Photographer Reports ----------
@router.get("/reports/photographer/{photographer_id}", response_model=List[dict])
async def get_photographer_reports(photographer_id: str):
    """Fetch reports related only to this photographer"""
    try:
        reports = await reports_collection.find({"photographer_id": photographer_id}).to_list(1000)
        for r in reports:
            reporter = await users_collection.find_one(
                {"id": r["reporter_id"]}, {"_id": 0, "full_name": 1, "email": 1}
            )
            r["reporter"] = reporter or {}
        return reports
    except Exception as e:
        print("Error fetching photographer reports:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch reports")
