import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_mongo():
    try:
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client["photographers_db"]
        collection = db["about_me"]

        # Insert test document
        result = await collection.insert_one({"photographer_id": "p123", "about": "Test"})
        print("Inserted ID:", result.inserted_id)

        # Fetch test document
        doc = await collection.find_one({"photographer_id": "p123"})
        print("Fetched doc:", doc)
    except Exception as e:
        print("MongoDB connection failed:", e)

asyncio.run(test_mongo())
