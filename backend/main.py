"""
Main FastAPI application entry point.
This file initializes the FastAPI app and includes all routers.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database.database import engine, Base
from routers import auth, chat, journal, mood, upload, voice, support, resources, analytics, reminders
from middleware.auth import get_current_user

# Create database tables
Base.metadata.create_all(bind=engine)

# Create uploads directory
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="Grief AI Chatbot API",
    description="A comprehensive grief support platform with AI chatbot, journaling, and peer support",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chatbot"])
app.include_router(journal.router, prefix="/api/journal", tags=["Journal"])
app.include_router(mood.router, prefix="/api/mood", tags=["Mood Tracking"])
app.include_router(upload.router, prefix="/api/upload", tags=["File Upload"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice Features"])
app.include_router(support.router, prefix="/api/support", tags=["Peer Support"])
app.include_router(resources.router, prefix="/api/resources", tags=["Resources"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["Reminders"])

@app.get("/")
async def root():
    return {"message": "Grief AI Chatbot API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "API is operational"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)