"""
Pydantic schemas for user-related operations.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserCreateAnonymous(BaseModel):
    username: str

class User(UserBase):
    id: int
    is_active: bool
    is_anonymous: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None