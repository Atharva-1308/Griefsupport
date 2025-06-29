#!/usr/bin/env python3
"""
Test script to verify ElevenLabs API key is working correctly.
"""

import os
import sys
import requests
from dotenv import load_dotenv

def test_elevenlabs_api():
    """Test the ElevenLabs API connection and key validity"""
    load_dotenv()
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    
    if not api_key:
        print("❌ No ElevenLabs API key found in environment")
        return False
    
    if api_key == "sk-your-elevenlabs-api-key-here":
        print("❌ ElevenLabs API key is still the placeholder value")
        return False
    
    print(f"🔑 Testing ElevenLabs API key: {api_key[:20]}...")
    
    try:
        # Test API connection by fetching voices
        url = "https://api.elevenlabs.io/v1/voices"
        headers = {
            "xi-api-key": api_key
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            voices_data = response.json()
            voices = voices_data.get("voices", [])
            
            print(f"✅ ElevenLabs API test successful!")
            print(f"🎤 Found {len(voices)} available voices")
            
            # Show some voice options
            grief_suitable_voices = []
            for voice in voices[:5]:  # Show first 5 voices
                name = voice.get("name", "Unknown")
                voice_id = voice.get("voice_id", "")
                category = voice.get("category", "Generated")
                
                print(f"   • {name} ({category}) - ID: {voice_id[:8]}...")
                
                # Check if suitable for grief counseling
                if any(keyword in name.lower() for keyword in ["rachel", "sarah", "emily", "anna", "grace"]):
                    grief_suitable_voices.append(name)
            
            if grief_suitable_voices:
                print(f"💝 Voices suitable for grief counseling: {', '.join(grief_suitable_voices)}")
            
            # Test voice synthesis with a short message
            print("\n🧪 Testing voice synthesis...")
            test_synthesis(api_key)
            
            return True
            
        elif response.status_code == 401:
            print("❌ ElevenLabs API key is invalid or expired")
            return False
        elif response.status_code == 429:
            print("⚠️  ElevenLabs API rate limit exceeded - but key is valid")
            return True
        else:
            print(f"❌ ElevenLabs API error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ ElevenLabs API request timed out")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Failed to connect to ElevenLabs API")
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
        
        response = requests.post(url, json=data, headers=headers, timeout=15)
        
        if response.status_code == 200:
            # Save test audio file
            os.makedirs("uploads/speech", exist_ok=True)
            test_file = "uploads/speech/test_synthesis.mp3"
            
            with open(test_file, "wb") as f:
                f.write(response.content)
            
            print(f"✅ Voice synthesis test successful!")
            print(f"🎵 Test audio saved to: {test_file}")
            print(f"📊 Audio file size: {len(response.content)} bytes")
            
        else:
            print(f"⚠️  Voice synthesis test failed: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Voice synthesis test error: {e}")

if __name__ == "__main__":
    print("🧪 Testing ElevenLabs API Configuration...")
    success = test_elevenlabs_api()
    
    if success:
        print("\n🎉 ElevenLabs API is configured correctly!")
        print("🎤 Voice features are now available:")
        print("   • Voice message recording")
        print("   • AI voice responses")
        print("   • Voice synthesis")
        print("   • Voice cloning (premium feature)")
    else:
        print("\n❌ ElevenLabs API test failed")
        print("💡 Voice features will be limited to recording only")
    
    sys.exit(0 if success else 1)