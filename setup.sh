#!/bin/bash

echo ""
echo "============================================"
echo "   Truth or Dare - Multiplayer Game Setup"
echo "============================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi

echo "✓ Python found: $(python3 --version)"
echo "✓ Node.js found: $(node --version)"
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Python dependencies"
    exit 1
fi
echo "✓ Python dependencies installed"
echo ""

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install --silent
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Node dependencies"
    exit 1
fi
echo "✓ Node dependencies installed"
echo ""

echo "============================================"
echo "   Setup Complete!"
echo "============================================"
echo ""
echo "To start the game:"
echo ""
echo "1. START BACKEND (in one terminal):"
echo "   python3 server.py"
echo ""
echo "2. START FRONTEND (in another terminal):"
echo "   npx expo start"
echo ""
echo "Then press:"
echo "   - 'i' for iOS Simulator"
echo "   - 'a' for Android Emulator"
echo "   - 'w' for Web"
echo "   - Scan QR code for Expo Go on your phone"
echo ""
echo "Server URL: http://localhost:5000"
echo ""
