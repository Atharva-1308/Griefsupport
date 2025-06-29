# 🚀 Complete Setup Instructions for GriefCare AI

## 📋 Prerequisites

1. **Python 3.8+** installed on your system
2. **Node.js 16+** and npm installed
3. **API Keys** (optional but recommended for full functionality)

## 🔧 Quick Setup (Automated)

### Step 1: Install Frontend Dependencies
```bash
npm install
```

### Step 2: Setup Backend (Automated)
```bash
npm run full-setup
```

This command will:
- Install all Python dependencies
- Create necessary directories
- Initialize the database
- Test all connections

### Step 3: Configure API Keys (Optional)

Edit `backend/.env` and replace the placeholder API keys:

```env
# OpenAI API for Enhanced AI Responses
OPENAI_API_KEY=sk-your-actual-openai-key-here

# ElevenLabs API for Voice Features  
ELEVENLABS_API_KEY=sk-your-actual-elevenlabs-key-here
```

### Step 4: Start the Application
```bash
npm run start
```

## 🔑 API Keys Setup

### OpenAI API Key (For Enhanced AI Responses)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)
6. Replace `sk-your-openai-api-key-here` in `backend/.env`

### ElevenLabs API Key (For Voice Features)
1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Create an account or sign in
3. Go to Profile Settings → API Keys
4. Create a new API key
5. Copy the key (starts with `sk-`)
6. Replace `sk-your-elevenlabs-api-key-here` in `backend/.env`

## 🛠️ Manual Setup (If Automated Fails)

### Backend Setup
```bash
cd backend

# Install Python dependencies
python3 -m pip install fastapi uvicorn sqlalchemy alembic python-multipart python-jose passlib python-dotenv requests websockets aiofiles apscheduler pydantic openai elevenlabs

# Run setup script
python3 startup.py

# Start backend server
python3 main.py
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🧪 Testing the Setup

### 1. Check Backend Health
```bash
npm run health-check
```

### 2. Test Frontend Connection
- Open http://localhost:5173
- Try the Anonymous Chat feature
- Check connection status indicator

### 3. Test API Features
- **Without API Keys**: Fallback responses work
- **With OpenAI Key**: Enhanced AI responses
- **With ElevenLabs Key**: Voice synthesis works

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python3 --version

# Reinstall dependencies
npm run fix-backend

# Run setup again
npm run setup-backend
```

### Frontend Can't Connect
1. Ensure backend is running on port 8000
2. Check firewall settings
3. Try HTTP instead of HTTPS

### Voice Features Not Working
1. Verify ElevenLabs API key in `.env`
2. Check browser microphone permissions
3. Ensure backend is connected

### Database Issues
1. Delete `backend/grief_ai.db`
2. Restart the application
3. Database will recreate automatically

## 📱 Features Available

### ✅ Always Working (No API Keys Required)
- Anonymous chat with intelligent fallback responses
- Beautiful UI with dark/light mode
- Resource hub with books, articles, videos
- Crisis support information
- Responsive design for all devices

### 🔑 Enhanced Features (With API Keys)
- **OpenAI API**: Advanced AI grief counseling responses
- **ElevenLabs API**: Voice synthesis and voice message processing

### 🔐 Full Features (With Backend + API Keys)
- User accounts and authentication
- Persistent chat history
- Mood tracking and analytics
- Journal entries (text and voice)
- Peer support chat rooms
- Reminder system
- Progress tracking

## 🌐 Deployment Ready

The application is production-ready and can be deployed to:
- **Frontend**: Netlify, Vercel, GitHub Pages
- **Backend**: Railway, Heroku, DigitalOcean, AWS

## 💡 Usage Tips

1. **Start with Anonymous Chat** - No setup required
2. **Add API Keys Gradually** - App works without them
3. **Monitor Connection Status** - Check the indicator in chat
4. **Use Fallback Mode** - App provides support even offline

## 🆘 Support

If you encounter issues:
1. Check the connection status indicator
2. Verify API keys are correct
3. Ensure backend server is running
4. Try restarting the application

The application is designed to work gracefully even without API keys - core grief support features will still function with intelligent fallbacks.