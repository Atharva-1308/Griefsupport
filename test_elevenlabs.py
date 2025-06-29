#!/usr/bin/env python3
"""
Test script to verify ElevenLabs API key is working correctly.
This script can be run from the root directory.
"""

import os
import sys
import requests
from pathlib import Path

def load_env_file():
    """Load environment variables from backend/.env file"""
    env_file = Path("backend/.env")
    if not env_file.exists():
        print("❌ No .env file found in backend directory")
        return False
    
    try:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        return True
    except Exception as e:
        print(f"❌ Error loading .env file: {e}")
        return False

def test_elevenlabs_api():
    """Test the ElevenLabs API connection and key validity"""
    if not load_env_file():
        return False
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    
    if not api_key:
        print("❌ No ElevenLabs API key found in environment")
        print("💡 Please add ELEVENLABS_API_KEY to backend/.env file")
        return False
    
    if api_key == "sk-your-elevenlabs-api-key-here":
        print("❌ ElevenLabs API key is still the placeholder value")
        print("💡 Please replace with your actual ElevenLabs API key")
        return False
    
    print(f"🔑 Testing ElevenLabs API key: {api_key[:20]}...")
    
    try:
        # Test API connection by fetching voices
        url = "https://api.elevenlabs.io/v1/voices"
        headers = {
            "xi-api-key": api_key
        }
        
        print("🌐 Connecting to ElevenLabs API...")
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            voices_data = response.json()
            voices = voices_data.get("voices", [])
            
            print(f"✅ ElevenLabs API test successful!")
            print(f"🎤 Found {len(voices)} available voices")
            
            # Show some voice options
            grief_suitable_voices = []
            print("\n📋 Available voices:")
            for voice in voices[:5]:  # Show first 5 voices
                name = voice.get("name", "Unknown")
                voice_id = voice.get("voice_id", "")
                category = voice.get("category", "Generated")
                
                print(f"   • {name} ({category}) - ID: {voice_id[:8]}...")
                
                # Check if suitable for grief counseling
                if any(keyword in name.lower() for keyword in ["rachel", "sarah", "emily", "anna", "grace"]):
                    grief_suitable_voices.append(name)
            
            if grief_suitable_voices:
                print(f"\n💝 Voices suitable for grief counseling: {', '.join(grief_suitable_voices)}")
            
            # Test voice synthesis with a short message
            print("\n🧪 Testing voice synthesis...")
            test_synthesis(api_key)
            
            return True
            
        elif response.status_code == 401:
            print("❌ ElevenLabs API key is invalid or expired")
            print("💡 Please check your API key at https://elevenlabs.io/app/settings/api-keys")
            return False
        elif response.status_code == 429:
            print("⚠️  ElevenLabs API rate limit exceeded - but key is valid")
            print("💡 You may have reached your monthly character limit")
            return True
        else:
            print(f"❌ ElevenLabs API error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ ElevenLabs API request timed out")
        print("💡 Check your internet connection")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Failed to connect to ElevenLabs API")
        print("💡 Check your internet connection and firewall settings")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_synthesis(api_key):
    """Test voice synthesis with a short message"""
    try:
        # Use Rachel's voice (warm and caring)
        voice_id = "21m00Tcm4TlvDq8ikWAM"
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": api_key
        }
        
        data = {
            "text": "Hello, this is a test of the voice synthesis feature for grief support.",
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        print("🎵 Synthesizing test audio...")
        response = requests.post(url, json=data, headers=headers, timeout=15)
        
        if response.status_code == 200:
            # Create uploads directory if it doesn't exist
            uploads_dir = Path("backend/uploads/speech")
            uploads_dir.mkdir(parents=True, exist_ok=True)
            
            test_file = uploads_dir / "test_synthesis.mp3"
            
            with open(test_file, "wb") as f:
                f.write(response.content)
            
            print(f"✅ Voice synthesis test successful!")
            print(f"🎵 Test audio saved to: {test_file}")
            print(f"📊 Audio file size: {len(response.content)} bytes")
            
        else:
            print(f"⚠️  Voice synthesis test failed: {response.status_code}")
            if response.status_code == 401:
                print("💡 API key may be invalid")
            elif response.status_code == 429:
                print("💡 Rate limit exceeded or quota reached")
            
    except Exception as e:
        print(f"⚠️  Voice synthesis test error: {e}")

def main():
    """Main test function"""
    print("🧪 Testing ElevenLabs API Configuration...")
    print("=" * 50)
    
    # Check if backend directory exists
    if not Path("backend").exists():
        print("❌ Backend directory not found")
        print("💡 Please run this script from the project root directory")
        return False
    
    success = test_elevenlabs_api()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 ElevenLabs API is configured correctly!")
        print("\n🎤 Voice features now available:")
        print("   • Voice message recording")
        print("   • AI voice responses")
        print("   • Voice synthesis")
        print("   • Voice cloning (premium feature)")
        print("\n💡 You can now use voice features in the grief support chat!")
    else:
        print("❌ ElevenLabs API test failed")
        print("\n💡 Voice features will be limited to recording only")
        print("🔧 To fix this:")
        print("   1. Get your API key from https://elevenlabs.io/app/settings/api-keys")
        print("   2. Add it to backend/.env as ELEVENLABS_API_KEY=your-key-here")
        print("   3. Run this test again")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)