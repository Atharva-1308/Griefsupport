"""
Pydantic schemas for mood tracking.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MoodEntryBase(BaseModel):
    mood_value: float
    mood_emoji: Optional[str] = None
    notes: Optional[str] = None

class MoodEntryCreate(MoodEntryBase):
    pass

class MoodEntry(MoodEntryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True