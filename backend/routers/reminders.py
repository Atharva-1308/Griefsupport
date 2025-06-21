"""
Reminders router for scheduled encouragement and check-ins.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from database.database import get_db
from models.user import User
from models.reminder import Reminder
from services.auth_service import AuthService
from services.reminder_service import ReminderService

router = APIRouter()
auth_service = AuthService()
reminder_service = ReminderService()

@router.post("/create")
async def create_reminder(
    title: str,
    message: str,
    scheduled_time: datetime,
    is_recurring: bool = False,
    recurrence_pattern: str = None,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new reminder"""
    
    if is_recurring and not recurrence_pattern:
        raise HTTPException(status_code=400, detail="Recurrence pattern required for recurring reminders")
    
    if recurrence_pattern and recurrence_pattern not in ["daily", "weekly", "monthly"]:
        raise HTTPException(status_code=400, detail="Invalid recurrence pattern")
    
    reminder = Reminder(
        user_id=current_user.id,
        title=title,
        message=message,
        scheduled_time=scheduled_time,
        is_recurring=is_recurring,
        recurrence_pattern=recurrence_pattern
    )
    
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    
    # Schedule the reminder
    reminder_service.schedule_reminder(reminder)
    
    return {
        "id": reminder.id,
        "title": reminder.title,
        "message": reminder.message,
        "scheduled_time": reminder.scheduled_time,
        "is_recurring": reminder.is_recurring,
        "recurrence_pattern": reminder.recurrence_pattern
    }

@router.get("/list")
async def list_reminders(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """List user's reminders"""
    
    reminders = db.query(Reminder).filter(
        Reminder.user_id == current_user.id
    ).order_by(Reminder.scheduled_time).all()
    
    return [
        {
            "id": reminder.id,
            "title": reminder.title,
            "message": reminder.message,
            "scheduled_time": reminder.scheduled_time,
            "is_recurring": reminder.is_recurring,
            "recurrence_pattern": reminder.recurrence_pattern,
            "is_sent": reminder.is_sent
        }
        for reminder in reminders
    ]

@router.delete("/{reminder_id}")
async def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a reminder"""
    
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    # Remove from scheduler
    reminder_service.cancel_reminder(reminder_id)
    
    db.delete(reminder)
    db.commit()
    
    return {"message": "Reminder deleted successfully"}

@router.get("/templates")
async def get_reminder_templates():
    """Get predefined reminder templates"""
    
    templates = [
        {
            "title": "Daily Check-in",
            "message": "How are you feeling today? Remember to take a moment for yourself.",
            "suggested_time": "09:00",
            "recurrence": "daily"
        },
        {
            "title": "Evening Reflection",
            "message": "Take a few minutes to reflect on your day and write in your journal.",
            "suggested_time": "20:00",
            "recurrence": "daily"
        },
        {
            "title": "Weekly Progress",
            "message": "You've made it through another week. That's something to be proud of.",
            "suggested_time": "18:00",
            "recurrence": "weekly"
        },
        {
            "title": "Self-Care Reminder",
            "message": "Remember to practice self-care today. You deserve kindness and compassion.",
            "suggested_time": "12:00",
            "recurrence": "daily"
        },
        {
            "title": "Gratitude Moment",
            "message": "What's one thing you're grateful for today, no matter how small?",
            "suggested_time": "19:00",
            "recurrence": "daily"
        }
    ]
    
    return templates