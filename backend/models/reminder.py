"""
Reminder model for scheduled encouragement messages.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.database import Base

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    is_sent = Column(Boolean, default=False)
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String, nullable=True)  # daily, weekly, monthly
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")