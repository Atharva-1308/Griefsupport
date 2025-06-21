"""
Reminder service for scheduling and managing reminders.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from typing import Dict
import logging

from models.reminder import Reminder

class ReminderService:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        self.active_reminders: Dict[int, str] = {}  # reminder_id -> job_id mapping

    def schedule_reminder(self, reminder: Reminder):
        """Schedule a reminder"""
        try:
            if reminder.is_recurring:
                # Schedule recurring reminder
                trigger = self._create_recurring_trigger(reminder.scheduled_time, reminder.recurrence_pattern)
                job_id = f"reminder_{reminder.id}_recurring"
            else:
                # Schedule one-time reminder
                trigger = DateTrigger(run_date=reminder.scheduled_time)
                job_id = f"reminder_{reminder.id}_once"
            
            job = self.scheduler.add_job(
                func=self._send_reminder,
                trigger=trigger,
                args=[reminder.id, reminder.title, reminder.message, reminder.user_id],
                id=job_id,
                replace_existing=True
            )
            
            self.active_reminders[reminder.id] = job_id
            logging.info(f"Scheduled reminder {reminder.id} with job_id {job_id}")
            
        except Exception as e:
            logging.error(f"Failed to schedule reminder {reminder.id}: {str(e)}")

    def cancel_reminder(self, reminder_id: int):
        """Cancel a scheduled reminder"""
        try:
            if reminder_id in self.active_reminders:
                job_id = self.active_reminders[reminder_id]
                self.scheduler.remove_job(job_id)
                del self.active_reminders[reminder_id]
                logging.info(f"Cancelled reminder {reminder_id}")
        except Exception as e:
            logging.error(f"Failed to cancel reminder {reminder_id}: {str(e)}")

    def _create_recurring_trigger(self, start_time: datetime, pattern: str):
        """Create a recurring trigger based on pattern"""
        if pattern == "daily":
            return CronTrigger(
                hour=start_time.hour,
                minute=start_time.minute,
                start_date=start_time
            )
        elif pattern == "weekly":
            return CronTrigger(
                day_of_week=start_time.weekday(),
                hour=start_time.hour,
                minute=start_time.minute,
                start_date=start_time
            )
        elif pattern == "monthly":
            return CronTrigger(
                day=start_time.day,
                hour=start_time.hour,
                minute=start_time.minute,
                start_date=start_time
            )
        else:
            raise ValueError(f"Invalid recurrence pattern: {pattern}")

    def _send_reminder(self, reminder_id: int, title: str, message: str, user_id: int):
        """Send a reminder (placeholder implementation)"""
        # In a real application, this would send notifications via:
        # - Push notifications
        # - Email
        # - SMS
        # - In-app notifications
        
        logging.info(f"Sending reminder {reminder_id} to user {user_id}: {title} - {message}")
        
        # Here you would implement the actual notification sending logic
        # For example:
        # - Send push notification
        # - Send email
        # - Store in-app notification
        # - Update reminder status in database
        
        # Mark reminder as sent in database
        from database.database import SessionLocal
        db = SessionLocal()
        try:
            reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
            if reminder and not reminder.is_recurring:
                reminder.is_sent = True
                db.commit()
        except Exception as e:
            logging.error(f"Failed to update reminder status: {str(e)}")
        finally:
            db.close()

    def get_pending_reminders(self, user_id: int) -> list:
        """Get pending reminders for a user"""
        # This would query the database for pending reminders
        # and return them in a format suitable for the frontend
        return []

    def shutdown(self):
        """Shutdown the scheduler"""
        self.scheduler.shutdown()