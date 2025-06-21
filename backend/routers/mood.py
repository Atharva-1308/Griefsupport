"""
Mood tracking router for daily mood check-ins.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date

from database.database import get_db
from models.user import User
from schemas.mood import MoodEntryCreate, MoodEntry as MoodEntrySchema
from services.auth_service import AuthService
from services.mood_service import MoodService

router = APIRouter()
auth_service = AuthService()
mood_service = MoodService()

@router.post("/entries", response_model=MoodEntrySchema)
async def create_mood_entry(
    mood_entry: MoodEntryCreate,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new mood entry"""
    if mood_entry.mood_value < 1 or mood_entry.mood_value > 10:
        raise HTTPException(status_code=400, detail="Mood value must be between 1 and 10")
    
    return mood_service.create_mood_entry(db, mood_entry, current_user.id)

@router.get("/entries", response_model=List[MoodEntrySchema])
async def get_mood_entries(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's mood entries"""
    return mood_service.get_user_mood_entries(db, current_user.id, skip, limit)

@router.get("/entries/today", response_model=MoodEntrySchema)
async def get_today_mood_entry(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's mood entry"""
    entry = mood_service.get_today_mood_entry(db, current_user.id)
    if not entry:
        raise HTTPException(status_code=404, detail="No mood entry found for today")
    return entry

@router.get("/analytics/weekly")
async def get_weekly_mood_analytics(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get weekly mood analytics"""
    return mood_service.get_weekly_analytics(db, current_user.id)

@router.get("/analytics/monthly")
async def get_monthly_mood_analytics(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly mood analytics"""
    return mood_service.get_monthly_analytics(db, current_user.id)