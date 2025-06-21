"""
Pydantic schemas for journal operations.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class JournalEntryBase(BaseModel):
    title: str
    content: Optional[str] = None
    is_voice_entry: bool = False

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntry(JournalEntryBase):
    id: int
    user_id: int
    voice_recording_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True