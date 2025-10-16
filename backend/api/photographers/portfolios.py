from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId

from database import get_database

router = APIRouter()


# --- Pydantic Model ---
class Portfolio(BaseModel):
    id: str = Field(..., alias="_id")
    photographer_id: str
    title: Optional[str] = None
    image_urls: Optional[List[str]] = None

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "_id": "6348b4b1a7b3b448f338a2c1",
                "photographer_id": "photographer123",
                "title": "Autumn Wedding",
                "image_urls": ["url1.jpg", "url2.jpg"],
            }
        }


# --- API Endpoint ---
@router.get("/portfolios", response_model=List[Portfolio])
async def get_portfolios(
    photographer_id: str = Query(..., description="ID of the photographer"),
    db=Depends(get_database),  # ✅ Inject MongoDB client
):
    """
    Retrieves all portfolios for a given photographer ID.
    """
    portfolio_collection = db["portfolios"]  # ✅ Access collection from the database
    portfolios = []

    async for p in portfolio_collection.find({"photographer_id": photographer_id}):
        # Convert ObjectId to string for JSON serialization
        p["_id"] = str(p["_id"])
        portfolios.append(p)

    if not portfolios:
        # Returning an empty list if no portfolios found
        return []

    return portfolios
