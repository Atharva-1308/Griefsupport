#!/usr/bin/env python3
"""
Test script to verify OpenAI API key is working correctly.
"""

import os
import sys
from dotenv import load_dotenv
import openai

def test_openai_api():
    """Test the OpenAI API connection and key validity"""
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ No OpenAI API key found in environment")
        return False
    
    if api_key == "sk-your-openai-api-key-here":
        print("❌ OpenAI API key is still the placeholder value")
        return False
    
    print(f"🔑 Testing OpenAI API key: {api_key[:20]}...")
    
    try:
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=api_key)
        
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
        return False
    except openai.RateLimitError:
        print("⚠️  OpenAI API rate limit exceeded - but key is valid")
        return True
    except openai.APIError as e:
        print(f"❌ OpenAI API error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing OpenAI API Configuration...")
    success = test_openai_api()
    
    if success:
        print("\n🎉 OpenAI API is configured correctly!")
        print("💡 Your grief counseling AI will now provide enhanced responses")
    else:
        print("\n❌ OpenAI API test failed")
        print("💡 The app will still work with fallback responses")
    
    sys.exit(0 if success else 1)