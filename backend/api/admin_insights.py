# api/admin_insights.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import jwt

load_dotenv()

# ---- DB setup (same pattern as your other routers) ----
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["test_database"]

# Access the full-named collections
reports_collection = db["photographer_db.reports"]
reviews_collection = db["photographer_db.reviews"]


# ---- Auth helpers (read-only; we just verify admin) ----
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

class User(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: datetime

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")

    # normalize created_at
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])

    return User(**user_doc)

def require_admin(u: User):
    if u.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

router = APIRouter(prefix="/api/admin", tags=["Admin Insights"])

# ---------- Models for responses (lightweight) ----------
class EnrichedReport(BaseModel):
    id: str
    reporter: Optional[Dict[str, Any]] = None
    photographer_user: Optional[Dict[str, Any]] = None
    photographer_profile: Optional[Dict[str, Any]] = None
    about_me: Optional[Dict[str, Any]] = None
    reason: str
    description: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

class PhotographerFullView(BaseModel):
    user: Optional[Dict[str, Any]] = None
    profile: Optional[Dict[str, Any]] = None
    about_me: Optional[Dict[str, Any]] = None
    portfolio: List[Dict[str, Any]] = []
    packages: List[Dict[str, Any]] = []
    reviews: List[Dict[str, Any]] = []
    reports: List[Dict[str, Any]] = []

# ---------- 1) Pending Reports (ENRICHED) ----------
@router.get("/reports/pending", response_model=List[EnrichedReport])
async def admin_pending_reports(current_user: User = Depends(get_current_user)):
    require_admin(current_user)

    pending = await db["reports"].find({"status": "pending"}, {"_id": 0}).to_list(1000)
    enriched: List[EnrichedReport] = []

    for rep in pending:
        # normalize created_at if string
        if isinstance(rep.get("created_at"), str):
            try:
                rep["created_at"] = datetime.fromisoformat(rep["created_at"])
            except Exception:
                rep["created_at"] = None

        # fetch reporter
        reporter = await db["users"].find_one({"id": rep.get("reporter_id")}, {"_id": 0, "password": 0})

        # fetch photographer user + profile + about_me
        phot_user = await db["users"].find_one({"id": rep.get("photographer_id")}, {"_id": 0, "password": 0})
        phot_profile = await db["photographer_profiles"].find_one({"user_id": rep.get("photographer_id")}, {"_id": 0})
        about = await db["about_me"].find_one({"user_id": rep.get("photographer_id")}, {"_id": 0})

        enriched.append(EnrichedReport(
            id=rep.get("id"),
            reporter=reporter,
            photographer_user=phot_user,
            photographer_profile=phot_profile,
            about_me=about,
            reason=rep.get("reason"),
            description=rep.get("description"),
            status=rep.get("status"),
            created_at=rep.get("created_at"),
        ))

    return enriched

# ---------- 2) Full View of a Photographer (for verification) ----------
@router.get("/photographers/{photographer_id}/full", response_model=PhotographerFullView)
async def admin_photographer_full(photographer_id: str, current_user: User = Depends(get_current_user)):
    require_admin(current_user)

    # basic user & profile
    phot_user = await db["users"].find_one({"id": photographer_id}, {"_id": 0, "password": 0})
    phot_profile = await db["photographer_profiles"].find_one({"user_id": photographer_id}, {"_id": 0})
    about = await db["about_me"].find_one({"user_id": photographer_id}, {"_id": 0})

    # portfolio
    portfolio = await db["portfolio_items"].find({"photographer_id": photographer_id}, {"_id": 0}).to_list(1000)
    for item in portfolio:
        if isinstance(item.get("created_at"), str):
            try:
                item["created_at"] = datetime.fromisoformat(item["created_at"])
            except Exception:
                pass

    # packages
    packages = await db["packages"].find({"photographer_id": photographer_id}, {"_id": 0}).to_list(1000)
    for pkg in packages:
        if isinstance(pkg.get("created_at"), str):
            try:
                pkg["created_at"] = datetime.fromisoformat(pkg["created_at"])
            except Exception:
                pass

    # reviews
    reviews = await db["reviews"].find({"photographer_id": photographer_id}, {"_id": 0}).to_list(1000)
    for r in reviews:
        # expand reviewer minimal info
        reviewer = await db["users"].find_one({"id": r.get("user_id")}, {"_id": 0, "password": 0, "email": 1, "full_name": 1, "id": 1})
        if reviewer:
            r["reviewer"] = reviewer
        if isinstance(r.get("created_at"), str):
            try:
                r["created_at"] = datetime.fromisoformat(r["created_at"])
            except Exception:
                pass

    # reports (all, including reviewed) for this photographer
    reports = await db["reports"].find({"photographer_id": photographer_id}, {"_id": 0}).to_list(1000)
    for rep in reports:
        if isinstance(rep.get("created_at"), str):
            try:
                rep["created_at"] = datetime.fromisoformat(rep["created_at"])
            except Exception:
                pass
        # include reporter minimal info
        reporter = await db["users"].find_one({"id": rep.get("reporter_id")}, {"_id": 0, "password": 0, "email": 1, "full_name": 1, "id": 1})
        if reporter:
            rep["reporter"] = reporter

    return PhotographerFullView(
        user=phot_user,
        profile=phot_profile,
        about_me=about,
        portfolio=portfolio,
        packages=packages,
        reviews=reviews,
        reports=reports,
    )
@router.get("/admin/reviews", response_model=List[dict])
async def get_all_reviews():
    """Admin: Fetch all reviews for all photographers"""
    reviews = await db["reviews"].find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reviews
