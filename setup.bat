@echo off
echo.
echo ============================================
echo   Truth or Dare - Multiplayer Game Setup
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo ✓ Python found: 
python --version
echo.
echo ✓ Node.js found:
node --version
echo.

REM Install Python dependencies
echo Installing Python dependencies...
pip install -q -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo ✓ Python dependencies installed
echo.

REM Install Node dependencies
echo Installing Node.js dependencies...
call npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node dependencies
    pause
    exit /b 1
)
echo ✓ Node dependencies installed
echo.

echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo To start the game:
echo.
echo 1. START BACKEND (in one terminal):
echo    python server.py
echo.
echo 2. START FRONTEND (in another terminal):
echo    npx expo start
echo.
echo Then press:
echo   - 'i' for iOS Simulator
echo   - 'a' for Android Emulator
echo   - 'w' for Web
echo   - Scan QR code for Expo Go on your phone
echo.
echo Server URL: http://localhost:5000
echo.
pause
