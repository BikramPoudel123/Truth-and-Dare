# 🚀 Quick Start Guide

## ⚡ 1-Minute Setup

### Windows
```bash
setup.bat
```

### macOS / Linux
```bash
bash setup.sh
```

---

## Manual Setup (If Scripts Don't Work)

### Step 1: Install Dependencies

**Python:**
```bash
pip install -r requirements.txt
```

**Node.js:**
```bash

npm instal
```

### Step 2: Start Backend

Open Terminal 1:
```bash
python server.py
```

Expected output:
```
 * Running on http://0.0.0.0:5000
 * Press CTRL+C to quit
```

### Step 3: Start Frontend

Open Terminal 2:
```bash
npx expo start
```

### Step 4: Launch on Device

**iOS Simulator:** Press `i`
**Android Emulator:** Press `a`
**Web:** Press `w`
**Expo Go App:** Scan QR code

---

## 🎮 Playing the Game

1. **Player 1**: Create a room, share the Room ID
2. **Player 2**: Join using the Room ID and your name
3. **Start playing** once both players are connected
4. Take turns picking Truth or Dare
5. Watch your score go up!

---

## 🔧 Troubleshooting

### Backend won't start
- Ensure Python 3.8+ is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check if port 5000 is available: `netstat -ano | findstr :5000` (Windows)

### Frontend won't connect
- Check backend is running on `http://localhost:5000`
- Update `EXPO_PUBLIC_SERVER_URL` in `.env.local` if using different port
- Clear Expo cache: `expo start --clear`

### Room not found
- Verify Room ID spelling (case-sensitive)
- Ensure both players are on the same server
- Try creating a new room

### Connection timeout
- Check firewall settings
- Verify backend is accessible: `curl http://localhost:5000/api/health`
- Restart both backend and frontend

---

## 📱 Testing on Physical Device

1. Install **Expo Go** on your phone
2. Make sure phone & computer are on **same WiFi network**
3. In terminal, when you see the QR code:
   - **iOS**: Open Camera app → tap notification
   - **Android**: Open Expo Go app → tap QR icon → scan

---

## 🌐 Deploy to Production

### Backend Deployment (Heroku)
```bash
git init
heroku create your-game-name
git push heroku main
```

### Update Frontend
Set `EXPO_PUBLIC_SERVER_URL` to your Heroku URL:
```
EXPO_PUBLIC_SERVER_URL=https://your-game-name.herokuapp.com
```

---

## 💡 Tips

- Keep terminal windows visible to see any errors
- Use different browsers/devices for testing multiplayer
- Check console output if something doesn't work
- Restart both servers if connection drops

---

Enjoy your game! 🎲🎉
