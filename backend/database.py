from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")  # fallback URL
DB_NAME = os.getenv("DB_NAME", "mydb")  # fallback DB name

class DataBase:
    client: AsyncIOMotorClient = None # type: ignore

db = DataBase()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown for MongoDB connection."""
    try:
        print("Connecting to MongoDB...")
        db.client = AsyncIOMotorClient(MONGO_URL)
        # Test connection
        await db.client.server_info()
        print("✅ Successfully connected to MongoDB!")
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        db.client = None
    yield
    if db.client:
        print("Closing MongoDB connection...")
        db.client.close()
        print("MongoDB connection closed.")

async def get_database():
    if not db.client:
        raise HTTPException(status_code=500, detail="Database client is not initialized")
    return db.client[DB_NAME]
