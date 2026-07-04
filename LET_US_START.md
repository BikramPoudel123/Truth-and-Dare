# 🎲 TRUTH OR DARE - LET'S GET STARTED!

**Read this first. Everything you need is here.**

---

## 🎯 WHAT YOU HAVE

A **complete online multiplayer Truth or Dare game** that works on:
- 💻 Web Browser
- 📱 iOS Simulator
- 🤖 Android Emulator
- 📲 Expo Go App
- 🎮 Physical Devices

---

## ⚡ 5 MINUTE QUICK START

### Step 1: Open 2 Command Windows

- **Window 1** - For backend
- **Window 2** - For frontend

### Step 2: Backend (Window 1)

```powershell
cd "c:\Users\Acer\OneDrive\Desktop\Sanjay Dai Lab\APPPPPPPPPPPPPPPPPPPPPPPPPPPPP\my-app"
pip install -r requirements.txt
python server.py
```

**Wait for message:**
```
Running on http://0.0.0.0:5000
```

✅ **Done! Keep this window open.**

### Step 3: Frontend (Window 2)

```powershell
cd "c:\Users\Acer\OneDrive\Desktop\Sanjay Dai Lab\APPPPPPPPPPPPPPPPPPPPPPPPPPPPP\my-app"
npm install
npx expo start
```

**Wait for menu:**
```
Press w to open web
Press i for iOS
Press a for Android
```

### Step 4: Play!

- **Press `w`** to open in browser
- Or press **`i`** for iOS Simulator
- Or press **`a`** for Android Emulator

### Step 5: Create & Join

**Player 1:**
1. Enter your name
2. Click "Create Room"
3. Copy the Room ID

**Player 2:**
1. Enter their name
2. Click "Join Room"
3. Paste Room ID
4. Click "Join Game"

**Start Playing 🎲**

---

## 📋 FULL STEP-BY-STEP GUIDE

See: **WINDOWS_SETUP.md** in the project folder

---

## ✅ VERIFY SETUP

Run this to check everything is ready:

```powershell
.\verify.bat
```

Should show all green checkmarks ✓

---

## 🎮 HOW TO PLAY

1. Player 1 picks **Truth** or **Dare**
2. Question appears to both players
3. Player 1 types their answer
4. Both see the answer
5. Score updates
6. **Switch to Player 2**
7. Keep playing!

---

## 📂 KEY FILES

| File | What It Does |
|------|-------------|
| `server.py` | Backend server (keep running) |
| `src/app/index.tsx` | Main game app |
| `src/app/home.tsx` | Room creation screen |
| `src/app/game.tsx` | Gameplay screen |

---

## 🛠️ COMMON COMMANDS

### Install Python dependencies
```powershell
pip install -r requirements.txt
```

### Start backend
```powershell
python server.py
```

### Start frontend
```powershell
npx expo start
```

### Clear cache if stuck
```powershell
npx expo start --clear
```

### Stop any server
Press `Ctrl+C` in the terminal

---

## 🐛 TROUBLESHOOTING

### "python: command not found"
- Python not installed
- Download from python.org
- Make sure to check "Add Python to PATH" during install

### "npm: command not found"
- Node.js not installed
- Download from nodejs.org

### "flask_socketio module not found"
```powershell
pip install -r requirements.txt
```

### "Cannot connect to server"
- Make sure backend is running (Window 1)
- Check it says "Running on http://0.0.0.0:5000"

### "Room not found"
- Check Room ID spelling
- Make sure backend is running
- Try creating a new room

### Port 5000 already in use
```powershell
netstat -ano | findstr :5000
taskkill /PID [number] /F
python server.py
```

---

## 📱 PLAY ON YOUR PHONE

1. Phone & computer on same WiFi
2. In Window 2, press **`o`**
3. Scan QR code with phone
4. Tap notification to open Expo Go
5. Play on phone!

---

## 📚 MORE DOCUMENTATION

Other helpful files:
- **WINDOWS_SETUP.md** - Detailed Windows guide
- **START_HERE_MAIN.md** - Project overview
- **QUICK_REFERENCE.md** - Quick reference
- **PROJECT.md** - Full architecture
- **FILES.md** - All files explained

---

## ✨ WHAT'S INCLUDED

✅ Complete multiplayer game  
✅ Professional UI  
✅ 40+ questions and dares  
✅ Real-time score tracking  
✅ Works on all platforms  
✅ Full source code  
✅ Complete documentation  
✅ Setup scripts  

---

## 🎯 WINDOWS SETUP CHECKLIST

- [ ] Python installed
- [ ] Node.js installed
- [ ] Repository downloaded
- [ ] In correct directory
- [ ] Run `verify.bat` - all green
- [ ] Open 2 PowerShell windows
- [ ] Window 1: Run backend
- [ ] Window 2: Run frontend
- [ ] Press `w` to open browser
- [ ] Create room
- [ ] Join room
- [ ] Play! 🎲

---

## 💡 TIPS & TRICKS

1. **Use Web (press w)** - Easiest way to test
2. **Keep both windows open** - Backend & frontend must run
3. **Check terminal for errors** - They appear in PowerShell
4. **Refresh browser** if stuck - Press F5
5. **Use same browser tab** - For testing multiplayer, open 2 tabs

---

## 🎊 YOU'RE READY!

Everything is set up and ready to go.

### Next Step:

Open **PowerShell** (or Command Prompt) and follow the **5 Minute Quick Start** above.

---

## 🚀 LET'S GO!

```
Window 1:
cd "c:\Users\Acer\OneDrive\Desktop\Sanjay Dai Lab\APPPPPPPPPPPPPPPPPPPPPPPPPPPPP\my-app"
pip install -r requirements.txt
python server.py

Window 2:
cd "c:\Users\Acer\OneDrive\Desktop\Sanjay Dai Lab\APPPPPPPPPPPPPPPPPPPPPPPPPPPPP\my-app"
npx expo start

Press: w
Play! 🎲
```

---

**Questions?** Check WINDOWS_SETUP.md or other docs.

**Ready?** Let's play! 🎉

---

*Built with ❤️ for multiplayer fun!*
