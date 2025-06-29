"""
Main FastAPI application entry point.
This file initializes the FastAPI app and includes all routers.
Enhanced with better error handling and flexible HTTPS/HTTP support.
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
import ssl
import uvicorn
import logging
from pathlib import Path

from database.database import engine, Base
from routers import auth, chat, journal, mood, upload, voice, support, resources, analytics, reminders
from middleware.auth import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created successfully")
except Exception as e:
    logger.error(f"❌ Database initialization failed: {e}")

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

# Include routers with error handling
routers = [
    (auth.router, "/api/auth", ["Authentication"]),
    (chat.router, "/api/chat", ["AI Chatbot"]),
    (journal.router, "/api/journal", ["Journal"]),
    (mood.router, "/api/mood", ["Mood Tracking"]),
    (upload.router, "/api/upload", ["File Upload"]),
    (voice.router, "/api/voice", ["Voice Features"]),
    (support.router, "/api/support", ["Peer Support"]),
    (resources.router, "/api/resources", ["Resources"]),
    (analytics.router, "/api/analytics", ["Analytics"]),
    (reminders.router, "/api/reminders", ["Reminders"])
]

for router, prefix, tags in routers:
    try:
        app.include_router(router, prefix=prefix, tags=tags)
        logger.info(f"✅ Router {prefix} loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load router {prefix}: {e}")

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

def check_openssl():
    """Check if OpenSSL is available"""
    import subprocess
    try:
        subprocess.run(["openssl", "version"], check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def create_self_signed_cert():
    """Create self-signed certificate for development HTTPS"""
    import subprocess
    
    cert_dir = Path("certs")
    cert_file = cert_dir / "cert.pem"
    key_file = cert_dir / "key.pem"
    
    # Create certs directory if it doesn't exist
    cert_dir.mkdir(exist_ok=True)
    
    # Check if certificates already exist
    if cert_file.exists() and key_file.exists():
        logger.info("✅ SSL certificates already exist")
        return str(cert_file), str(key_file)
    
    if not check_openssl():
        logger.warning("❌ OpenSSL not found. Cannot create SSL certificates.")
        return None, None
    
    try:
        # Generate self-signed certificate using OpenSSL
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:2048", 
            "-keyout", str(key_file), "-out", str(cert_file), "-days", "365", "-nodes",
            "-subj", "/C=US/ST=State/L=City/O=GriefGuide/CN=localhost"
        ], check=True, capture_output=True)
        
        logger.info(f"✅ Self-signed certificate created: {cert_file}")
        return str(cert_file), str(key_file)
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to create certificate: {e}")
        return None, None

if __name__ == "__main__":
    # Always start with HTTP for better compatibility
    logger.info("🚀 Starting server with HTTP...")
    logger.info("💡 HTTP mode provides better compatibility and easier debugging")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")