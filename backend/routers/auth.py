"""
Authentication router handling user registration, login, and anonymous access.
Enhanced with better error handling and username generation.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import re

from database.database import get_db
from models.user import User
from schemas.user import UserCreate, UserCreateAnonymous, User as UserSchema, Token
from services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()

def is_valid_email(email: str) -> bool:
    """Check if email format is valid"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def is_valid_username(username: str) -> bool:
    """Check if username is valid (alphanumeric, 3-50 chars)"""
    if not username or len(username) < 3 or len(username) > 50:
        return False
    return re.match(r'^[a-zA-Z0-9_]+$', username) is not None

@router.post("/register", response_model=UserSchema)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with email and password"""
    try:
        # Validate email format
        if not is_valid_email(user.email):
            raise HTTPException(
                status_code=400,
                detail="Invalid email format"
            )
        
        # Validate username
        if not is_valid_username(user.username):
            raise HTTPException(
                status_code=400,
                detail="Username must be 3-50 characters and contain only letters, numbers, and underscores"
            )
        
        # Validate password
        if not user.password or len(user.password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters long"
            )
        
        # Check if email already exists
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Check if username already exists
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )
        
        return auth_service.create_user(db, user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/register-anonymous", response_model=UserSchema)
async def register_anonymous(user: UserCreateAnonymous, db: Session = Depends(get_db)):
    """Register an anonymous user with just a username"""
    try:
        # Validate username
        if not is_valid_username(user.username):
            raise HTTPException(
                status_code=400,
                detail="Username must be 3-50 characters and contain only letters, numbers, and underscores"
            )
        
        # Check if username already exists
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )
        
        return auth_service.create_anonymous_user(db, user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Anonymous registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with email/username and password"""
    try:
        if not form_data.username or not form_data.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username/email and password are required"
            )
        
        user = auth_service.authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username/email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = auth_service.create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/login-anonymous", response_model=Token)
async def login_anonymous(username: str, db: Session = Depends(get_db)):
    """Login as anonymous user with just username"""
    try:
        if not username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is required"
            )
        
        user = db.query(User).filter(User.username == username, User.is_anonymous == True).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Anonymous user not found"
            )
        
        access_token = auth_service.create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Anonymous login failed: {str(e)}"
        )

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(auth_service.get_current_user)):
    """Get current user information"""
    return current_user