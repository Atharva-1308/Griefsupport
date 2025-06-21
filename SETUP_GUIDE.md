# Complete Setup Guide for Grief AI Application

## 🎯 Quick Start

1. **Install Dependencies:**
   ```bash
   npm run setup
   ```

2. **Start the Application:**
   ```bash
   npm run start
   ```

## 🎤 ElevenLabs Voice Service Setup

### Step 1: Get Your ElevenLabs API Key

1. **Create Account:**
   - Go to [ElevenLabs.io](https://elevenlabs.io)
   - Sign up for a free account
   - Free tier includes 10,000 characters per month

2. **Get API Key:**
   - Login to your ElevenLabs dashboard
   - Go to Profile Settings (click your avatar)
   - Navigate to "API Keys" section
   - Click "Create API Key"
   - Copy the generated key (starts with `sk-...`)

### Step 2: Configure API Key

1. **Create Environment File:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Add Your API Key to `.env`:**
   ```env
   # ElevenLabs API
   ELEVENLABS_API_KEY=sk-your-actual-api-key-here
   
   # OpenAI API (optional - for enhanced AI responses)
   OPENAI_API_KEY=sk-your-openai-key-here
   
   # Database
   DATABASE_URL=sqlite:///./grief_ai.db
   
   # JWT Secret
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # File Upload
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=./uploads
   ```

### Step 3: Test Voice Features

1. **Start the application:**
   ```bash
   npm run start
   ```

2. **Test voice features:**
   - Go to Anonymous Chat or regular Chat
   - Click the voice toggle button
   - Send a message and listen for AI voice response
   - Try recording voice messages

## 🔧 Additional API Setup (Optional)

### OpenAI API Setup (Enhanced AI Responses)

1. **Get OpenAI API Key:**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create account and get API key
   - Add to `.env` file: `OPENAI_API_KEY=sk-your-key`

2. **Benefits:**
   - More sophisticated grief counseling responses
   - Better conversation context
   - Personalized support

**Note:** The app works without OpenAI - it uses intelligent fallback responses.

## 🚀 Deployment Options

### Option 1: HTTP (Recommended for Development)
```bash
npm run start
```

### Option 2: HTTPS (Advanced)
```bash
npm run start-https
```

## 📱 Features Available

### ✅ Working Features:
- **Anonymous Chat** - No signup required
- **Voice Messages** - Record and send voice messages
- **AI Voice Responses** - Hear AI responses (with ElevenLabs)
- **Mood Tracking** - Daily emotional check-ins
- **Journal** - Text and voice entries
- **Peer Support** - Community chat rooms
- **Resources** - Helpful books, articles, videos
- **Analytics** - Mood trends and insights
- **Reminders** - Scheduled encouragement
- **Dark/Light Mode** - Theme switching

### 🔧 Advanced Features (Require API Keys):
- Enhanced AI responses (OpenAI)
- Voice synthesis (ElevenLabs)
- Voice cloning (ElevenLabs)

## 🛠️ Troubleshooting

### Voice Features Not Working?
1. Check ElevenLabs API key in `.env`
2. Restart the backend: `cd backend && python main.py`
3. Check browser console for errors
4. Ensure microphone permissions are granted

### Database Issues?
1. Delete `backend/grief_ai.db`
2. Restart application - database will recreate

### HTTPS Certificate Issues?
1. Use HTTP mode: `npm run start`
2. For HTTPS: Install OpenSSL and restart

### API Connection Issues?
1. Check if backend is running on port 8000
2. Try HTTP instead of HTTPS
3. Check firewall settings

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify API keys are correct
3. Ensure all dependencies are installed
4. Try restarting the application

The application is designed to work gracefully even without API keys - core features will still function with intelligent fallbacks.