#!/bin/bash

# Frontend Development Startup Script
echo "🚀 Starting React Development Server..."
echo "📡 Backend should be running on http://localhost:8000"
echo "🌐 Frontend will be available on http://localhost:3000"
echo ""

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start the backend first:"
    echo "   cd CMS-Backend && python run_dev.py"
    echo ""
fi

# Start the React development server
npm start