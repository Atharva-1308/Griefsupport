"""
Analytics router for tracking mood patterns and progress.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database.database import get_db
from models.user import User
from models.mood import MoodEntry
from models.journal import JournalEntry
from services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()

@router.get("/dashboard")
async def get_dashboard_analytics(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard analytics"""
    
    # Mood analytics
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    mood_entries = db.query(MoodEntry).filter(
        MoodEntry.user_id == current_user.id,
        MoodEntry.created_at >= thirty_days_ago
    ).all()
    
    # Journal analytics
    journal_entries = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id,
        JournalEntry.created_at >= thirty_days_ago
    ).all()
    
    # Calculate averages and trends
    avg_mood = sum(entry.mood_value for entry in mood_entries) / len(mood_entries) if mood_entries else 0
    
    # Weekly mood trend
    weekly_moods = []
    for i in range(4):
        week_start = datetime.now() - timedelta(days=(i+1)*7)
        week_end = datetime.now() - timedelta(days=i*7)
        
        week_entries = [
            entry for entry in mood_entries 
            if week_start <= entry.created_at <= week_end
        ]
        
        week_avg = sum(entry.mood_value for entry in week_entries) / len(week_entries) if week_entries else 0
        weekly_moods.append({
            "week": f"Week {4-i}",
            "average_mood": round(week_avg, 2),
            "entries_count": len(week_entries)
        })
    
    return {
        "mood_analytics": {
            "average_mood_30_days": round(avg_mood, 2),
            "total_mood_entries": len(mood_entries),
            "weekly_trends": weekly_moods
        },
        "journal_analytics": {
            "total_entries_30_days": len(journal_entries),
            "voice_entries": len([e for e in journal_entries if e.is_voice_entry]),
            "text_entries": len([e for e in journal_entries if not e.is_voice_entry])
        },
        "engagement": {
            "days_active": len(set(entry.created_at.date() for entry in mood_entries + journal_entries)),
            "streak_days": calculate_streak(mood_entries + journal_entries)
        }
    }

@router.get("/mood-trends")
async def get_mood_trends(
    days: int = 30,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed mood trends over specified period"""
    
    start_date = datetime.now() - timedelta(days=days)
    
    mood_entries = db.query(MoodEntry).filter(
        MoodEntry.user_id == current_user.id,
        MoodEntry.created_at >= start_date
    ).order_by(MoodEntry.created_at).all()
    
    daily_moods = {}
    for entry in mood_entries:
        date_key = entry.created_at.date().isoformat()
        if date_key not in daily_moods:
            daily_moods[date_key] = []
        daily_moods[date_key].append(entry.mood_value)
    
    # Calculate daily averages
    trend_data = []
    for date_str, moods in daily_moods.items():
        trend_data.append({
            "date": date_str,
            "average_mood": round(sum(moods) / len(moods), 2),
            "entries_count": len(moods),
            "min_mood": min(moods),
            "max_mood": max(moods)
        })
    
    return {
        "period_days": days,
        "trend_data": sorted(trend_data, key=lambda x: x["date"]),
        "summary": {
            "total_entries": len(mood_entries),
            "overall_average": round(sum(entry.mood_value for entry in mood_entries) / len(mood_entries), 2) if mood_entries else 0,
            "best_day": max(trend_data, key=lambda x: x["average_mood"]) if trend_data else None,
            "challenging_day": min(trend_data, key=lambda x: x["average_mood"]) if trend_data else None
        }
    }

def calculate_streak(entries):
    """Calculate current streak of consecutive days with entries"""
    if not entries:
        return 0
    
    # Get unique dates
    dates = sorted(set(entry.created_at.date() for entry in entries), reverse=True)
    
    if not dates or dates[0] != datetime.now().date():
        return 0
    
    streak = 1
    for i in range(1, len(dates)):
        if dates[i-1] - dates[i] == timedelta(days=1):
            streak += 1
        else:
            break
    
    return streak