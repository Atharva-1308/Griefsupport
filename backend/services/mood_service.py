"""
Mood tracking service for daily mood check-ins and analytics.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional, Dict

from models.mood import MoodEntry
from schemas.mood import MoodEntryCreate

class MoodService:
    def create_mood_entry(self, db: Session, mood_entry: MoodEntryCreate, user_id: int) -> MoodEntry:
        """Create a new mood entry"""
        db_entry = MoodEntry(
            user_id=user_id,
            mood_value=mood_entry.mood_value,
            mood_emoji=mood_entry.mood_emoji,
            notes=mood_entry.notes
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry

    def get_user_mood_entries(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[MoodEntry]:
        """Get user's mood entries"""
        return db.query(MoodEntry).filter(
            MoodEntry.user_id == user_id
        ).order_by(MoodEntry.created_at.desc()).offset(skip).limit(limit).all()

    def get_today_mood_entry(self, db: Session, user_id: int) -> Optional[MoodEntry]:
        """Get today's mood entry for a user"""
        today = datetime.now().date()
        return db.query(MoodEntry).filter(
            MoodEntry.user_id == user_id,
            func.date(MoodEntry.created_at) == today
        ).first()

    def get_weekly_analytics(self, db: Session, user_id: int) -> Dict:
        """Get weekly mood analytics"""
        week_ago = datetime.now() - timedelta(days=7)
        
        entries = db.query(MoodEntry).filter(
            MoodEntry.user_id == user_id,
            MoodEntry.created_at >= week_ago
        ).all()

        if not entries:
            return {"average": 0, "entries_count": 0, "trend": "no_data"}

        average = sum(entry.mood_value for entry in entries) / len(entries)
        
        # Calculate trend (comparing first half vs second half of week)
        mid_week = week_ago + timedelta(days=3.5)
        first_half = [e for e in entries if e.created_at < mid_week]
        second_half = [e for e in entries if e.created_at >= mid_week]
        
        trend = "stable"
        if first_half and second_half:
            first_avg = sum(e.mood_value for e in first_half) / len(first_half)
            second_avg = sum(e.mood_value for e in second_half) / len(second_half)
            
            if second_avg > first_avg + 0.5:
                trend = "improving"
            elif second_avg < first_avg - 0.5:
                trend = "declining"

        return {
            "average": round(average, 2),
            "entries_count": len(entries),
            "trend": trend,
            "daily_breakdown": self._get_daily_breakdown(entries)
        }

    def get_monthly_analytics(self, db: Session, user_id: int) -> Dict:
        """Get monthly mood analytics"""
        month_ago = datetime.now() - timedelta(days=30)
        
        entries = db.query(MoodEntry).filter(
            MoodEntry.user_id == user_id,
            MoodEntry.created_at >= month_ago
        ).all()

        if not entries:
            return {"average": 0, "entries_count": 0, "weekly_averages": []}

        average = sum(entry.mood_value for entry in entries) / len(entries)
        
        # Calculate weekly averages
        weekly_averages = []
        for week in range(4):
            week_start = month_ago + timedelta(days=week*7)
            week_end = week_start + timedelta(days=7)
            
            week_entries = [
                e for e in entries 
                if week_start <= e.created_at < week_end
            ]
            
            if week_entries:
                week_avg = sum(e.mood_value for e in week_entries) / len(week_entries)
                weekly_averages.append({
                    "week": week + 1,
                    "average": round(week_avg, 2),
                    "entries_count": len(week_entries)
                })

        return {
            "average": round(average, 2),
            "entries_count": len(entries),
            "weekly_averages": weekly_averages,
            "best_day": max(entries, key=lambda x: x.mood_value) if entries else None,
            "challenging_day": min(entries, key=lambda x: x.mood_value) if entries else None
        }

    def _get_daily_breakdown(self, entries: List[MoodEntry]) -> List[Dict]:
        """Get daily breakdown of mood entries"""
        daily_data = {}
        
        for entry in entries:
            date_key = entry.created_at.date()
            if date_key not in daily_data:
                daily_data[date_key] = []
            daily_data[date_key].append(entry.mood_value)
        
        breakdown = []
        for date, moods in daily_data.items():
            breakdown.append({
                "date": date.isoformat(),
                "average": round(sum(moods) / len(moods), 2),
                "entries_count": len(moods)
            })
        
        return sorted(breakdown, key=lambda x: x["date"])