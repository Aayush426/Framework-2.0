from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str  # user, photographer, admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class PhotographerProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    bio: str
    specialties: List[str]
    experience_years: int
    phone: str
    location: str
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    approval_status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PhotographerProfileCreate(BaseModel):
    bio: str
    specialties: List[str]
    experience_years: int
    phone: str
    location: str
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None

class PhotographerProfileUpdate(BaseModel):
    bio: Optional[str] = None
    specialties: Optional[List[str]] = None
    experience_years: Optional[int] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None

class PortfolioItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    photographer_id: str
    category: str  # Wedding, Portrait, Event, Commercial, Nature, Fashion, etc.
    title: str
    description: str
    image_url: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PortfolioItemCreate(BaseModel):
    category: str
    title: str
    description: str
    image_url: str

class Package(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    photographer_id: str
    name: str
    type: str  # predefined or custom
    category: str  # Wedding, Portrait, Event, Commercial
    description: str
    price: float
    duration: str  # e.g., "2 hours", "Full day"
    deliverables: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PackageCreate(BaseModel):
    name: str
    type: str = "custom"
    category: str
    description: str
    price: float
    duration: str
    deliverables: List[str]

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    photographer_id: str
    package_id: str
    booking_date: str
    booking_time: str
    location: str
    message: str
    status: str = "pending"  # pending, approved, rejected, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    photographer_id: str
    package_id: str
    booking_date: str
    booking_time: str
    location: str
    message: str

class BookingStatusUpdate(BaseModel):
    status: str

class ApprovalUpdate(BaseModel):
    approval_status: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
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
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# Auth routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_input: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_input.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_input.password)
    
    # Create user
    user_dict = user_input.model_dump(exclude={"password"})
    user_obj = User(**user_dict)
    
    # Store user with hashed password
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password'] = hashed_password
    
    await db.users.insert_one(doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user_obj.id, "role": user_obj.role})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_obj = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    access_token = create_access_token(data={"sub": user_obj.id, "role": user_obj.role})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Photographer Profile routes
@api_router.post("/photographer/profile", response_model=PhotographerProfile)
async def create_photographer_profile(profile_input: PhotographerProfileCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "photographer":
        raise HTTPException(status_code=403, detail="Only photographers can create profiles")
    
    # Check if profile exists
    existing_profile = await db.photographer_profiles.find_one({"user_id": current_user.id})
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile_dict = profile_input.model_dump()
    profile_dict['user_id'] = current_user.id
    profile_obj = PhotographerProfile(**profile_dict)
    
    doc = profile_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.photographer_profiles.insert_one(doc)
    return profile_obj

@api_router.get("/photographer/profile/me", response_model=PhotographerProfile)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    profile_doc = await db.photographer_profiles.find_one({"user_id": current_user.id}, {"_id": 0})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if isinstance(profile_doc.get('created_at'), str):
        profile_doc['created_at'] = datetime.fromisoformat(profile_doc['created_at'])
    
    return PhotographerProfile(**profile_doc)

@api_router.put("/photographer/profile", response_model=PhotographerProfile)
async def update_photographer_profile(profile_input: PhotographerProfileUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != "photographer":
        raise HTTPException(status_code=403, detail="Only photographers can update profiles")
    
    update_data = {k: v for k, v in profile_input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.photographer_profiles.find_one_and_update(
        {"user_id": current_user.id},
        {"$set": update_data},
        return_document=True,
        projection={"_id": 0}
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    
    return PhotographerProfile(**result)

@api_router.get("/photographer/profile/{photographer_id}", response_model=PhotographerProfile)
async def get_photographer_profile(photographer_id: str):
    profile_doc = await db.photographer_profiles.find_one({"user_id": photographer_id}, {"_id": 0})
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if isinstance(profile_doc.get('created_at'), str):
        profile_doc['created_at'] = datetime.fromisoformat(profile_doc['created_at'])
    
    return PhotographerProfile(**profile_doc)

@api_router.get("/photographers", response_model=List[dict])
async def get_all_photographers():
    # Get approved photographers with their user info
    profiles = await db.photographer_profiles.find({"approval_status": "approved"}, {"_id": 0}).to_list(1000)
    
    result = []
    for profile in profiles:
        user_doc = await db.users.find_one({"id": profile['user_id']}, {"_id": 0, "password": 0})
        if user_doc:
            if isinstance(profile.get('created_at'), str):
                profile['created_at'] = datetime.fromisoformat(profile['created_at'])
            if isinstance(user_doc.get('created_at'), str):
                user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
            
            result.append({
                "profile": PhotographerProfile(**profile).model_dump(),
                "user": User(**user_doc).model_dump()
            })
    
    return result

# Portfolio routes
@api_router.post("/portfolio", response_model=PortfolioItem)
async def create_portfolio_item(item_input: PortfolioItemCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "photographer":
        raise HTTPException(status_code=403, detail="Only photographers can create portfolio items")
    
    # Check if photographer profile is approved
    profile = await db.photographer_profiles.find_one({"user_id": current_user.id})
    if not profile or profile['approval_status'] != "approved":
        raise HTTPException(status_code=403, detail="Photographer profile not approved")
    
    item_dict = item_input.model_dump()
    item_dict['photographer_id'] = current_user.id
    item_obj = PortfolioItem(**item_dict)
    
    doc = item_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.portfolio_items.insert_one(doc)
    return item_obj

@api_router.get("/portfolio/my", response_model=List[PortfolioItem])
async def get_my_portfolio(current_user: User = Depends(get_current_user)):
    items = await db.portfolio_items.find({"photographer_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    
    return [PortfolioItem(**item) for item in items]

@api_router.get("/portfolio/photographer/{photographer_id}", response_model=List[PortfolioItem])
async def get_photographer_portfolio(photographer_id: str):
    items = await db.portfolio_items.find({"photographer_id": photographer_id}, {"_id": 0}).to_list(1000)
    
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    
    return [PortfolioItem(**item) for item in items]

@api_router.delete("/portfolio/{item_id}")
async def delete_portfolio_item(item_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "photographer":
        raise HTTPException(status_code=403, detail="Only photographers can delete portfolio items")
    
    result = await db.portfolio_items.delete_one({"id": item_id, "photographer_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    return {"message": "Portfolio item deleted"}

# Package routes
@api_router.post("/packages", response_model=Package)
async def create_package(package_input: PackageCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "photographer":
        raise HTTPException(status_code=403, detail="Only photographers can create packages")
    
    package_dict = package_input.model_dump()
    package_dict['photographer_id'] = current_user.id
    package_obj = Package(**package_dict)
    
    doc = package_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.packages.insert_one(doc)
    return package_obj

@api_router.get("/packages/my", response_model=List[Package])
async def get_my_packages(current_user: User = Depends(get_current_user)):
    packages = await db.packages.find({"photographer_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for package in packages:
        if isinstance(package.get('created_at'), str):
            package['created_at'] = datetime.fromisoformat(package['created_at'])
    
    return [Package(**package) for package in packages]

@api_router.get("/packages/photographer/{photographer_id}", response_model=List[Package])
async def get_photographer_packages(photographer_id: str):
    packages = await db.packages.find({"photographer_id": photographer_id}, {"_id": 0}).to_list(1000)
    
    for package in packages:
        if isinstance(package.get('created_at'), str):
            package['created_at'] = datetime.fromisoformat(package['created_at'])
    
    return [Package(**package) for package in packages]

@api_router.delete("/packages/{package_id}")
async def delete_package(package_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "photographer":
        raise HTTPException(status_code=403, detail="Only photographers can delete packages")
    
    result = await db.packages.delete_one({"id": package_id, "photographer_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    
    return {"message": "Package deleted"}

# Booking routes
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_input: BookingCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "user":
        raise HTTPException(status_code=403, detail="Only users can create bookings")
    
    booking_dict = booking_input.model_dump()
    booking_dict['user_id'] = current_user.id
    booking_obj = Booking(**booking_dict)
    
    doc = booking_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.bookings.insert_one(doc)
    return booking_obj

@api_router.get("/bookings/my", response_model=List[dict])
async def get_my_bookings(current_user: User = Depends(get_current_user)):
    if current_user.role == "user":
        bookings = await db.bookings.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    elif current_user.role == "photographer":
        bookings = await db.bookings.find({"photographer_id": current_user.id}, {"_id": 0}).to_list(1000)
    else:
        raise HTTPException(status_code=403, detail="Invalid role for this endpoint")
    
    result = []
    for booking in bookings:
        if isinstance(booking.get('created_at'), str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
        
        # Get photographer info
        photographer = await db.users.find_one({"id": booking['photographer_id']}, {"_id": 0, "password": 0})
        photographer_profile = await db.photographer_profiles.find_one({"user_id": booking['photographer_id']}, {"_id": 0})
        
        # Get user info
        user = await db.users.find_one({"id": booking['user_id']}, {"_id": 0, "password": 0})
        
        # Get package info
        package = await db.packages.find_one({"id": booking['package_id']}, {"_id": 0})
        
        result.append({
            "booking": booking,
            "photographer": photographer,
            "photographer_profile": photographer_profile,
            "user": user,
            "package": package
        })
    
    return result

@api_router.put("/bookings/{booking_id}/status", response_model=Booking)
async def update_booking_status(booking_id: str, status_update: BookingStatusUpdate, current_user: User = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Photographers can approve/reject, users can cancel
    if current_user.role == "photographer" and booking['photographer_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == "user" and booking['user_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.bookings.find_one_and_update(
        {"id": booking_id},
        {"$set": {"status": status_update.status}},
        return_document=True,
        projection={"_id": 0}
    )
    
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    
    return Booking(**result)

# Admin routes
@api_router.get("/admin/photographers/pending", response_model=List[dict])
async def get_pending_photographers(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    profiles = await db.photographer_profiles.find({"approval_status": "pending"}, {"_id": 0}).to_list(1000)
    
    result = []
    for profile in profiles:
        user_doc = await db.users.find_one({"id": profile['user_id']}, {"_id": 0, "password": 0})
        if user_doc:
            if isinstance(profile.get('created_at'), str):
                profile['created_at'] = datetime.fromisoformat(profile['created_at'])
            if isinstance(user_doc.get('created_at'), str):
                user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
            
            result.append({
                "profile": profile,
                "user": user_doc
            })
    
    return result

@api_router.put("/admin/photographers/{photographer_id}/approval", response_model=PhotographerProfile)
async def update_photographer_approval(photographer_id: str, approval: ApprovalUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.photographer_profiles.find_one_and_update(
        {"user_id": photographer_id},
        {"$set": {"approval_status": approval.approval_status}},
        return_document=True,
        projection={"_id": 0}
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Photographer not found")
    
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    
    return PhotographerProfile(**result)

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = await db.users.count_documents({"role": "user"})
    total_photographers = await db.users.count_documents({"role": "photographer"})
    pending_photographers = await db.photographer_profiles.count_documents({"approval_status": "pending"})
    approved_photographers = await db.photographer_profiles.count_documents({"approval_status": "approved"})
    total_bookings = await db.bookings.count_documents({})
    pending_bookings = await db.bookings.count_documents({"status": "pending"})
    
    return {
        "total_users": total_users,
        "total_photographers": total_photographers,
        "pending_photographers": pending_photographers,
        "approved_photographers": approved_photographers,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings
    }

@api_router.get("/admin/bookings", response_model=List[dict])
async def get_all_bookings(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    
    result = []
    for booking in bookings:
        if isinstance(booking.get('created_at'), str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
        
        photographer = await db.users.find_one({"id": booking['photographer_id']}, {"_id": 0, "password": 0})
        user = await db.users.find_one({"id": booking['user_id']}, {"_id": 0, "password": 0})
        package = await db.packages.find_one({"id": booking['package_id']}, {"_id": 0})
        
        result.append({
            "booking": booking,
            "photographer": photographer,
            "user": user,
            "package": package
        })
    
    return result

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return [User(**user) for user in users]

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()