#!/usr/bin/env python3
"""
Startup script to ensure all dependencies are installed and configured properly.
This script handles the complete setup process for the GriefCare AI backend.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        logger.error("❌ Python 3.8 or higher is required")
        return False
    logger.info(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def install_dependencies():
    """Install all required Python dependencies"""
    logger.info("📦 Installing Python dependencies...")
    
    requirements = [
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0",
        "sqlalchemy==2.0.23",
        "alembic==1.12.1",
        "python-multipart==0.0.6",
        "python-jose[cryptography]==3.3.0",
        "passlib[bcrypt]==1.7.4",
        "python-dotenv==1.0.0",
        "requests==2.31.0",
        "websockets==12.0",
        "aiofiles==23.2.1",
        "apscheduler==3.10.4",
        "elevenlabs==0.2.26",
        "pydantic==2.5.0",
        "pyopenssl==23.3.0",
        "cryptography==41.0.7",
        "openai==1.3.0"
    ]
    
    try:
        for package in requirements:
            logger.info(f"Installing {package}...")
            subprocess.run([
                sys.executable, "-m", "pip", "install", package
            ], check=True, capture_output=True)
        
        logger.info("✅ All dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to install dependencies: {e}")
        return False

def create_directories():
    """Create necessary directories for the application"""
    directories = [
        "uploads",
        "uploads/voice_messages", 
        "uploads/journal_voice",
        "uploads/speech",
        "uploads/temp",
        "uploads/audio",
        "uploads/document",
        "uploads/image"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        logger.info(f"✅ Created directory: {directory}")

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_file = Path(".env")
    if not env_file.exists():
        logger.warning("⚠️  .env file not found - using default configuration")
        return False
    
    required_vars = ["SECRET_KEY", "DATABASE_URL"]
    missing_vars = []
    
    with open(env_file, 'r') as f:
        content = f.read()
        for var in required_vars:
            if f"{var}=" not in content:
                missing_vars.append(var)
    
    if missing_vars:
        logger.warning(f"⚠️  Missing environment variables: {', '.join(missing_vars)}")
    else:
        logger.info("✅ Environment configuration looks good")
    
    return len(missing_vars) == 0

def test_imports():
    """Test if all required modules can be imported"""
    logger.info("🧪 Testing module imports...")
    
    modules = [
        "fastapi",
        "uvicorn", 
        "sqlalchemy",
        "jose",
        "passlib",
        "requests",
        "aiofiles",
        "apscheduler"
    ]
    
    failed_imports = []
    for module in modules:
        try:
            __import__(module)
            logger.info(f"✅ {module}")
        except ImportError:
            failed_imports.append(module)
            logger.error(f"❌ {module}")
    
    if failed_imports:
        logger.error(f"Failed to import: {', '.join(failed_imports)}")
        return False
    
    logger.info("✅ All modules imported successfully")
    return True

def initialize_database():
    """Initialize the database"""
    logger.info("🗄️  Initializing database...")
    try:
        # Import here to avoid circular imports
        from database.database import engine, Base
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database initialized successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return False

def main():
    """Main startup function"""
    logger.info("🚀 Starting GriefCare AI Backend Setup...")
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        logger.error("❌ Dependency installation failed")
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Check environment
    check_env_file()
    
    # Test imports
    if not test_imports():
        logger.error("❌ Module import test failed")
        sys.exit(1)
    
    # Initialize database
    if not initialize_database():
        logger.error("❌ Database initialization failed")
        sys.exit(1)
    
    logger.info("🎉 Backend setup completed successfully!")
    logger.info("💡 You can now start the server with: python main.py")
    
    return True

if __name__ == "__main__":
    main()