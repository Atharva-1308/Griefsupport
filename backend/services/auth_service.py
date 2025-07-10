"""
Authentication service for user management and JWT tokens.
Enhanced with better error handling and validation.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from database.database import get_db
from models.user import User
from schemas.user import UserCreate, UserCreateAnonymous

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class AuthService:
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False

    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def create_user(self, db: Session, user: UserCreate) -> User:
        """Create a new regular user"""
        try:
            hashed_password = self.get_password_hash(user.password)
            db_user = User(
                email=user.email,
                username=user.username,
                hashed_password=hashed_password,
                is_anonymous=False
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
        except Exception as e:
            db.rollback()
            raise e

    def create_anonymous_user(self, db: Session, user: UserCreateAnonymous) -> User:
        """Create a new anonymous user"""
        try:
            db_user = User(
                email=f"{user.username}@anonymous.local",
                username=user.username,
                hashed_password="",  # No password for anonymous users
                is_anonymous=True
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
        except Exception as e:
            db.rollback()
            raise e

    def authenticate_user(self, db: Session, username_or_email: str, password: str) -> Optional[User]:
        """Authenticate a user with username/email and password"""
        try:
            # Try to find user by username or email
            user = db.query(User).filter(
                (User.username == username_or_email) | (User.email == username_or_email)
            ).first()
            
            if not user or user.is_anonymous:
                return None
            
            if not self.verify_password(password, user.hashed_password):
                return None
            
            return user
        except Exception:
            return None

    async def get_current_user(self, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
        """Get current user from JWT token"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
        
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise credentials_exception
        
        return user