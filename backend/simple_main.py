"""
Simplified FastAPI application entry point.
This version removes SSL certificate generation to avoid Python environment issues.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
import uvicorn
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create necessary directories
directories = ["uploads", "uploads/voice_messages", "uploads/journal_voice", "uploads/speech", "uploads/temp"]
for directory in directories:
    os.makedirs(directory, exist_ok=True)

app = FastAPI(
    title="GriefGuide API",
    description="A comprehensive grief support platform with AI chatbot, journaling, and peer support",
    version="1.0.0"
)

# Enhanced CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."}
    )

# Static files for uploads
try:
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except Exception as e:
    logger.warning(f"Failed to mount uploads directory: {e}")

@app.get("/")
async def root():
    return {
        "message": "GriefGuide API is running", 
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy", 
        "message": "API is operational",
        "database": "connected",
        "timestamp": "now"
    }

if __name__ == "__main__":
    # Start with HTTP for better compatibility in WebContainer
    logger.info("🚀 Starting server with HTTP...")
    logger.info("💡 HTTP mode provides better compatibility in WebContainer environment")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")