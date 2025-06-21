"""
Journal router for grief journaling with text and voice entries.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from database.database import get_db
from models.user import User
from models.journal import JournalEntry
from schemas.journal import JournalEntryCreate, JournalEntry as JournalEntrySchema
from services.auth_service import AuthService
from services.journal_service import JournalService

router = APIRouter()
auth_service = AuthService()
journal_service = JournalService()

@router.post("/entries", response_model=JournalEntrySchema)
async def create_journal_entry(
    entry: JournalEntryCreate,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new text journal entry"""
    return journal_service.create_entry(db, entry, current_user.id)

@router.post("/entries/voice", response_model=JournalEntrySchema)
async def create_voice_journal_entry(
    title: str = Form(...),
    voice_file: UploadFile = File(...),
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new voice journal entry"""
    if not voice_file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    # Save voice file
    file_extension = voice_file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/journal_voice/{filename}"
    
    os.makedirs("uploads/journal_voice", exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        content = await voice_file.read()
        buffer.write(content)
    
    return journal_service.create_voice_entry(db, title, file_path, current_user.id)

@router.get("/entries", response_model=List[JournalEntrySchema])
async def get_journal_entries(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's journal entries"""
    return journal_service.get_user_entries(db, current_user.id, skip, limit)

@router.get("/entries/{entry_id}", response_model=JournalEntrySchema)
async def get_journal_entry(
    entry_id: int,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific journal entry"""
    entry = journal_service.get_entry(db, entry_id, current_user.id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry

@router.delete("/entries/{entry_id}")
async def delete_journal_entry(
    entry_id: int,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a journal entry"""
    success = journal_service.delete_entry(db, entry_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return {"message": "Journal entry deleted successfully"}