@echo off
echo.
echo ============================================
echo   TRUTH OR DARE - SETUP VERIFICATION
echo ============================================
echo.

REM Check Python
echo Checking Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Python found: 
    python --version
) else (
    echo ✗ Python NOT found
    echo Please install Python 3.8+
    pause
    exit /b 1
)
echo.

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js found:
    node --version
) else (
    echo ✗ Node.js NOT found
    echo Please install Node.js 18+
    pause
    exit /b 1
)
echo.

REM Check Flask
echo Checking Flask...
pip show flask >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Flask installed
) else (
    echo ✗ Flask NOT installed
    echo Run: pip install -r requirements.txt
    pause
    exit /b 1
)
echo.

REM Check Flask-SocketIO
echo Checking Flask-SocketIO...
pip show flask-socketio >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Flask-SocketIO installed
) else (
    echo ✗ Flask-SocketIO NOT installed
    echo Run: pip install -r requirements.txt
    pause
    exit /b 1
)
echo.

REM Check npm dependencies
echo Checking npm dependencies...
if exist node_modules (
    echo ✓ npm dependencies installed
) else (
    echo ✗ npm dependencies NOT installed
    echo Run: npm install
    pause
    exit /b 1
)
echo.

REM Check files
echo Checking key files...
if exist server.py (
    echo ✓ server.py found
) else (
    echo ✗ server.py NOT found
    pause
    exit /b 1
)

if exist src\app\index.tsx (
    echo ✓ Frontend files found
) else (
    echo ✗ Frontend files NOT found
    pause
    exit /b 1
)

if exist package.json (
    echo ✓ package.json found
) else (
    echo ✗ package.json NOT found
    pause
    exit /b 1
)

echo.
echo ============================================
echo   ✅ ALL CHECKS PASSED!
echo ============================================
echo.
echo Ready to run:
echo.
echo 1. Terminal 1: python server.py
echo 2. Terminal 2: npx expo start
echo 3. Press w/i/a/o in Terminal 2
echo 4. Play! 🎲
echo.
pause
