"""
Authentication router handling user registration, login, and anonymous access.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from database.database import get_db
from models.user import User
from schemas.user import UserCreate, UserCreateAnonymous, User as UserSchema, Token
from services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()

@router.post("/register", response_model=UserSchema)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with email and password"""
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    return auth_service.create_user(db, user)

@router.post("/register-anonymous", response_model=UserSchema)
async def register_anonymous(user: UserCreateAnonymous, db: Session = Depends(get_db)):
    """Register an anonymous user with just a username"""
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    return auth_service.create_anonymous_user(db, user)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with email/username and password"""
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_service.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login-anonymous", response_model=Token)
async def login_anonymous(username: str, db: Session = Depends(get_db)):
    """Login as anonymous user with just username"""
    user = db.query(User).filter(User.username == username, User.is_anonymous == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Anonymous user not found"
        )
    
    access_token = auth_service.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(auth_service.get_current_user)):
    """Get current user information"""
    return current_user