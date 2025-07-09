#!/bin/bash

echo "🎵 Installing Spotify Widget Dependencies for 0-KM"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing backend dependencies..."

# Install backend dependencies (if needed)
cd backend
if [ -f "package.json" ]; then
    echo "Installing backend packages..."
    npm install
else
    echo "⚠️  Backend package.json not found, skipping backend dependencies"
fi

cd ..

echo "📱 Installing frontend dependencies..."

# Install frontend dependencies
cd frontend
if [ -f "package.json" ]; then
    echo "Installing frontend packages..."
    npm install
    
    # Check if specific packages are already installed
    if ! npm list react-native-youtube-iframe > /dev/null 2>&1; then
        echo "Installing react-native-youtube-iframe..."
        npm install react-native-youtube-iframe
    fi
    
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Frontend package.json not found"
    exit 1
fi

cd ..

echo ""
echo "🎉 Spotify Widget Dependencies Installation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Set up your database schema in Supabase directly"
echo "2. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start the frontend app:"
echo "   cd frontend && npm start"
echo ""
echo "4. Test the Spotify widget functionality" 