#!/usr/bin/env python3
"""
Script to create self-signed SSL certificates for both frontend and backend development HTTPS.
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
    # Create certificates for both root and backend directories
    cert_dirs = [Path("certs"), Path("backend/certs")]
    
    for cert_dir in cert_dirs:
        cert_file = cert_dir / "cert.pem"
        key_file = cert_dir / "key.pem"
        
        # Create certs directory if it doesn't exist
        cert_dir.mkdir(parents=True, exist_ok=True)
        
        # Check if certificates already exist
        if cert_file.exists() and key_file.exists():
            print(f"✅ SSL certificates already exist in {cert_dir}")
            continue
        
        if not check_openssl():
            print("❌ OpenSSL not found. Please install OpenSSL:")
            print("   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html")
            print("   - macOS: brew install openssl")
            print("   - Ubuntu/Debian: sudo apt-get install openssl")
            print("   - CentOS/RHEL: sudo yum install openssl")
            return False
        
        try:
            print(f"🔧 Creating SSL certificates in {cert_dir}...")
            
            # Generate self-signed certificate using OpenSSL
            subprocess.run([
                "openssl", "req", "-x509", "-newkey", "rsa:2048", 
                "-keyout", str(key_file), "-out", str(cert_file), "-days", "365", "-nodes",
                "-subj", "/C=US/ST=Development/L=Local/O=GriefGuide/CN=localhost"
            ], check=True, capture_output=True)
            
            print(f"✅ SSL certificates created successfully in {cert_dir}!")
            print(f"   Certificate: {cert_file}")
            print(f"   Private Key: {key_file}")
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to create certificates in {cert_dir}: {e}")
            return False
    
    return True

if __name__ == "__main__":
    print("🔧 Setting up SSL certificates for HTTPS development...")
    success = create_certificates()
    if success:
        print("\n🎉 SSL certificates setup complete!")
        print("💡 You can now run: npm run start-https")
    sys.exit(0 if success else 1)