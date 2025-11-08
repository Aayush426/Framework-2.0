from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from fastapi import Depends
from api.admin_insights import get_current_user   # or from wherever get_current_user is defined



# Load environment variables
load_dotenv()

# Router
router = APIRouter(prefix="/api/about-me", tags=["About Me"])

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("PHOTOGRAPHER_DB", "photographer_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
collection = db["about_me"]

# --------- Pydantic Models ---------
class AboutMeCreate(BaseModel):
    user_id: str
    country: Optional[str] = None
    languages: Optional[List[str]] = []
    about: Optional[str] = None
    social_links: Optional[List[str]] = []

class AboutMeUpdate(BaseModel):
    country: Optional[str] = None
    languages: Optional[List[str]] = None
    about: Optional[str] = None
    social_links: Optional[List[str]] = None

class AboutMe(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    country: Optional[str] = None
    languages: Optional[List[str]] = []
    about: Optional[str] = None
    social_links: Optional[List[str]] = []

# --------- CREATE ---------
@router.post("/", response_model=AboutMe)
async def create_about_me(data: AboutMeCreate,):
    
    try:
        print(f"🔍 Checking for existing profile for user: {data.user_id}")
        # Check if profile already exists
        existing = await collection.find_one({"user_id": data.user_id})
        if existing:
            print(f"❌ Profile already exists for user: {data.user_id}")
            raise HTTPException(status_code=400, detail="About Me profile already exists for this user")
        
        # Create new document
        doc = data.dict()
        doc["id"] = str(uuid.uuid4())
        print(f"➕ Creating new profile with data: {doc}")
        
        result = await collection.insert_one(doc)
        print(f"✅ Insert result: {result.inserted_id}")
        
        # Fetch the created document to return
        created_doc = await collection.find_one({"_id": result.inserted_id})
        if not created_doc:
            raise HTTPException(status_code=500, detail="Failed to create profile")
            
        print(f"✅ Successfully created profile: {created_doc}")
        return AboutMe(**created_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating About Me: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# --------- UPDATE ---------
@router.put("/{user_id}", response_model=AboutMe)
async def update_about_me(user_id: str, data: AboutMeUpdate):
    try:
        print(f"🔍 Checking existing profile for update - user: {user_id}")
        # Check if profile exists
        existing = await collection.find_one({"user_id": user_id})
        if not existing:
            print(f"❌ Profile not found for user: {user_id}")
            raise HTTPException(status_code=404, detail="About Me profile not found")
        
        # Prepare update data - remove None values and empty lists
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        
        # Handle empty lists - allow clearing arrays
        if data.languages is not None:
            update_data["languages"] = data.languages
        if data.social_links is not None:
            update_data["social_links"] = data.social_links
        
        if not update_data:
            print("⚠️ No valid fields to update")
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        print(f"🔄 Updating profile with data: {update_data}")
        # Perform update
        result = await collection.update_one(
            {"user_id": user_id}, 
            {"$set": update_data}
        )
        
        print(f"✅ Update result - matched: {result.matched_count}, modified: {result.modified_count}")
        
        # Return updated document
        updated_doc = await collection.find_one({"user_id": user_id})
        if not updated_doc:
            raise HTTPException(status_code=500, detail="Failed to fetch updated profile")
            
        print(f"✅ Successfully updated profile: {updated_doc}")
        return AboutMe(**updated_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating About Me: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# --------- GET (Fetch by user_id) ---------
@router.get("/{user_id}", response_model=AboutMe)
async def get_about_me(user_id: str):
    try:
        print(f"🔍 Fetching profile for user: {user_id}")
        doc = await collection.find_one({"user_id": user_id})
        if not doc:
            print(f"❌ Profile not found for user: {user_id}")
            raise HTTPException(status_code=404, detail="About Me profile not found")
        print(f"✅ Found profile: {doc}")
        return AboutMe(**doc)
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching About Me: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# --------- DELETE ---------
@router.delete("/{user_id}")
async def delete_about_me(user_id: str):
    try:
        print(f"🗑️ Deleting profile for user: {user_id}")
        result = await collection.delete_one({"user_id": user_id})
        if result.deleted_count == 0:
            print(f"❌ Profile not found for deletion - user: {user_id}")
            raise HTTPException(status_code=404, detail="About Me profile not found")
        print(f"✅ Successfully deleted profile for user: {user_id}")
        return {"message": "About Me profile deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting About Me: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")