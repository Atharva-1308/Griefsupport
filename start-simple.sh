#!/bin/bash
# Simple startup script that avoids Python environment issues

echo "🚀 Starting GriefGuide in simple mode..."

# Install Node.js dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Create certificates using Node.js (safer than Python in WebContainer)
echo "🔧 Setting up certificates..."
node setup-certificates.js

# Start the simplified backend
echo "🔧 Starting simplified backend..."
cd backend
python3 simple_main.py &
BACKEND_PID=$!

# Go back to root directory
cd ..

# Start frontend
echo "🔧 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ GriefGuide is starting up..."
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait