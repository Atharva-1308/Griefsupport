#!/usr/bin/env python3
"""
Script to create self-signed SSL certificates for development HTTPS.
This provides better security and resolves mixed-content issues.
"""

import os
import subprocess
import sys
from pathlib import Path

def check_openssl():
    """Check if OpenSSL is available"""
    try:
        subprocess.run(["openssl", "version"], check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def create_certificates():
    """Create self-signed certificates for development"""
    cert_dir = Path("certs")
    cert_file = cert_dir / "cert.pem"
    key_file = cert_dir / "key.pem"
    
    # Create certs directory if it doesn't exist
    cert_dir.mkdir(exist_ok=True)
    
    # Check if certificates already exist
    if cert_file.exists() and key_file.exists():
        print("✅ SSL certificates already exist")
        return True
    
    if not check_openssl():
        print("❌ OpenSSL not found. Please install OpenSSL:")
        print("   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html")
        print("   - macOS: brew install openssl")
        print("   - Ubuntu/Debian: sudo apt-get install openssl")
        print("   - CentOS/RHEL: sudo yum install openssl")
        return False
    
    try:
        print("🔧 Creating self-signed SSL certificates...")
        
        # Generate self-signed certificate using OpenSSL
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:2048", 
            "-keyout", str(key_file), "-out", str(cert_file), "-days", "365", "-nodes",
            "-subj", "/C=US/ST=Development/L=Local/O=GriefGuide/CN=localhost"
        ], check=True, capture_output=True)
        
        print(f"✅ SSL certificates created successfully!")
        print(f"   Certificate: {cert_file}")
        print(f"   Private Key: {key_file}")
        print("⚠️  Note: Browsers will show warnings about self-signed certificates - this is normal for development")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create certificates: {e}")
        return False

if __name__ == "__main__":
    success = create_certificates()
    sys.exit(0 if success else 1)