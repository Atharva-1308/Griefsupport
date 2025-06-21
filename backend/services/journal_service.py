"""
Journal service for managing grief journal entries.
"""

from sqlalchemy.orm import Session
from typing import List, Optional

from models.journal import JournalEntry
from schemas.journal import JournalEntryCreate

class JournalService:
    def create_entry(self, db: Session, entry: JournalEntryCreate, user_id: int) -> JournalEntry:
        """Create a new text journal entry"""
        db_entry = JournalEntry(
            user_id=user_id,
            title=entry.title,
            content=entry.content,
            is_voice_entry=False
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry

    def create_voice_entry(self, db: Session, title: str, voice_path: str, user_id: int) -> JournalEntry:
        """Create a new voice journal entry"""
        db_entry = JournalEntry(
            user_id=user_id,
            title=title,
            voice_recording_path=voice_path,
            is_voice_entry=True
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry

    def get_user_entries(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[JournalEntry]:
        """Get user's journal entries"""
        return db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id
        ).order_by(JournalEntry.created_at.desc()).offset(skip).limit(limit).all()

    def get_entry(self, db: Session, entry_id: int, user_id: int) -> Optional[JournalEntry]:
        """Get a specific journal entry"""
        return db.query(JournalEntry).filter(
            JournalEntry.id == entry_id,
            JournalEntry.user_id == user_id
        ).first()

    def delete_entry(self, db: Session, entry_id: int, user_id: int) -> bool:
        """Delete a journal entry"""
        entry = db.query(JournalEntry).filter(
            JournalEntry.id == entry_id,
            JournalEntry.user_id == user_id
        ).first()
        
        if entry:
            db.delete(entry)
            db.commit()
            return True
        return False

    def get_entry_count(self, db: Session, user_id: int) -> int:
        """Get total number of entries for a user"""
        return db.query(JournalEntry).filter(JournalEntry.user_id == user_id).count()