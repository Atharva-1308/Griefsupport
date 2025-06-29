#!/usr/bin/env python3
"""
Test script to verify OpenAI API key is working correctly.
This script can be run from the root directory.
"""

import os
import sys
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

def test_openai_api():
    """Test the OpenAI API connection and key validity"""
    if not load_env_file():
        return False
    
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ No OpenAI API key found in environment")
        print("💡 Please add OPENAI_API_KEY to backend/.env file")
        return False
    
    if api_key == "sk-your-openai-api-key-here":
        print("❌ OpenAI API key is still the placeholder value")
        print("💡 Please replace with your actual OpenAI API key")
        return False
    
    print(f"🔑 Testing OpenAI API key: {api_key[:20]}...")
    
    try:
        # Try to import openai
        try:
            import openai
        except ImportError:
            print("❌ OpenAI package not installed")
            print("💡 Run: pip install openai")
            return False
        
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=api_key)
        
        print("🌐 Connecting to OpenAI API...")
        
        # Test with a simple completion
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Hello, API test successful!'"}
            ],
            max_tokens=20
        )
        
        result = response.choices[0].message.content
        print(f"✅ OpenAI API test successful!")
        print(f"📝 Response: {result}")
        
        # Test with grief counseling prompt
        print("\n🧪 Testing grief counseling capabilities...")
        grief_response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Hope, a compassionate AI grief counselor."},
                {"role": "user", "content": "I'm feeling overwhelmed with grief today."}
            ],
            max_tokens=100
        )
        
        grief_result = grief_response.choices[0].message.content
        print(f"✅ Grief counseling test successful!")
        print(f"💝 Grief response preview: {grief_result[:100]}...")
        
        return True
        
    except openai.AuthenticationError:
        print("❌ OpenAI API key is invalid or expired")
        print("💡 Please check your API key at https://platform.openai.com/api-keys")
        return False
    except openai.RateLimitError:
        print("⚠️  OpenAI API rate limit exceeded - but key is valid")
        print("💡 You may have reached your usage limit")
        return True
    except openai.APIError as e:
        print(f"❌ OpenAI API error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing OpenAI API Configuration...")
    print("=" * 50)
    
    # Check if backend directory exists
    if not Path("backend").exists():
        print("❌ Backend directory not found")
        print("💡 Please run this script from the project root directory")
        return False
    
    success = test_openai_api()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 OpenAI API is configured correctly!")
        print("\n🤖 Enhanced AI features now available:")
        print("   • Advanced grief counseling responses")
        print("   • Contextual conversation memory")
        print("   • Personalized support strategies")
        print("   • Crisis detection and response")
        print("\n💡 Your grief counseling AI will now provide enhanced responses!")
    else:
        print("❌ OpenAI API test failed")
        print("\n💡 The app will still work with intelligent fallback responses")
        print("🔧 To fix this:")
        print("   1. Get your API key from https://platform.openai.com/api-keys")
        print("   2. Add it to backend/.env as OPENAI_API_KEY=your-key-here")
        print("   3. Run this test again")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)