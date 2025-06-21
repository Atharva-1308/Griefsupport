"""
Main FastAPI application entry point.
This file initializes the FastAPI app and includes all routers.
Enhanced with HTTPS support for secure communication.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import ssl
import uvicorn

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

# CORS middleware - Updated to support HTTPS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000", 
        "https://localhost:5173",
        "https://localhost:3000"
    ],
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
    return {"message": "Grief AI Chatbot API is running securely"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "API is operational", "secure": True}

def create_self_signed_cert():
    """Create self-signed certificate for development HTTPS"""
    import subprocess
    import os
    
    cert_dir = "certs"
    cert_file = os.path.join(cert_dir, "cert.pem")
    key_file = os.path.join(cert_dir, "key.pem")
    
    # Create certs directory if it doesn't exist
    os.makedirs(cert_dir, exist_ok=True)
    
    # Check if certificates already exist
    if os.path.exists(cert_file) and os.path.exists(key_file):
        return cert_file, key_file
    
    try:
        # Generate self-signed certificate using OpenSSL
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:4096", 
            "-keyout", key_file, "-out", cert_file, "-days", "365", "-nodes",
            "-subj", "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        ], check=True, capture_output=True)
        
        print(f"✅ Self-signed certificate created: {cert_file}")
        return cert_file, key_file
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create certificate with OpenSSL: {e}")
        return None, None
    except FileNotFoundError:
        print("❌ OpenSSL not found. Please install OpenSSL or use HTTP mode.")
        return None, None

if __name__ == "__main__":
    # Try to create HTTPS certificates
    cert_file, key_file = create_self_signed_cert()
    
    if cert_file and key_file:
        # Run with HTTPS
        print("🚀 Starting server with HTTPS support...")
        print("📋 Certificate files created for secure communication")
        print("⚠️  You may see browser warnings about self-signed certificates - this is normal for development")
        
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(cert_file, key_file)
        
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000,
            ssl_keyfile=key_file,
            ssl_certfile=cert_file,
            ssl_version=ssl.PROTOCOL_TLS_SERVER
        )
    else:
        # Fallback to HTTP
        print("⚠️  HTTPS setup failed, falling back to HTTP")
        print("🚀 Starting server with HTTP...")
        uvicorn.run(app, host="0.0.0.0", port=8000)