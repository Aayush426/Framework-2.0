import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

async def test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    about_me_collection = db["about_me"]
    
    doc = {
        "id": str(uuid.uuid4()),
        "photographer_id": "p123",
        "country": "India",
        "languages": ["English", "Hindi"],
        "about": "Test async insert",
        "social_links": ["https://example.com"]
    }
    
    result = await about_me_collection.insert_one(doc)
    print("Inserted ID:", result.inserted_id)
    
asyncio.run(test())
