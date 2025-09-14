#!/bin/bash

echo "🚀 Starting Simple Arduino Fire Detection System"
echo "================================================"

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

# Check if Node.js is available
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js/npm not found. Please install Node.js"
    exit 1
fi

echo "🔥 Starting Arduino Fire Detection Backend..."
python simple-arduino-fire.py &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 3

echo "🌐 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Simple Arduino Fire Detection System Started!"
echo "================================================"
echo "🔥 Backend: 25 Arduino sensors monitoring forest"
echo "🌐 Frontend: http://localhost:3000/simple"
echo "📡 WebSocket: ws://localhost:8766"
echo ""
echo "🎮 HOW TO USE:"
echo "1. Open http://localhost:3000/simple"
echo "2. Click anywhere on the map to start a fire"
echo "3. Watch Arduino sensors detect the fire as it spreads"
echo "4. See real-time alerts in the sidebar"
echo ""
echo "Press Ctrl+C to stop both services"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping Arduino Fire Detection System..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "👋 Goodbye!"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
