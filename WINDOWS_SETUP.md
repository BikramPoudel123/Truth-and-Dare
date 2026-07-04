# 🚀 SETUP GUIDE FOR WINDOWS

Follow these steps in order. Open **2 PowerShell/CMD windows** side-by-side.

---

## ✅ STEP 1: Install Python Dependencies

**In Window 1, run:**

```powershell
cd "c:\Users\Acer\OneDrive\Desktop\Sanjay Dai Lab\APPPPPPPPPPPPPPPPPPPPPPPPPPPPP\my-app"
pip install -r requirements.txt
```

**Wait for completion.** You should see:
```
Successfully installed flask-2.3.3 flask-cors-4.0.0 flask-socketio-5.3.4 ...
```

---

## ✅ STEP 2: Start Backend Server

**Keep Window 1 open, run:**

```powershell
python server.py
```

**You should see:**
```
 * Running on http://0.0.0.0:5000
 * WARNING in app.factory...
(Press CTRL+C to quit)
```

✅ **Backend is running!** Keep this window open.

---

## ✅ STEP 3: Start Frontend

**In Window 2, run:**

```powershell
cd "c:\Users\Acer\OneDrive\Desktop\Sanjay Dai Lab\APPPPPPPPPPPPPPPPPPPPPPPPPPPPP\my-app"
npm install
npx expo start
```

**You should see:**
```
Starting Metro Bundler
...
To open the app press:
  i - open iOS simulator
  a - open Android emulator
  w - open web
  j - open debugger
  r - reload the app
  m - toggle menu
  o - open in Expo Go
```

✅ **Frontend is running!**

---

## ✅ STEP 4: Open the Game

**Choose ONE option:**

### Option A: Web Browser (Easiest)
- In Window 2, press `w`
- Browser opens automatically

### Option B: iOS Simulator
- In Window 2, press `i`
- iOS Simulator opens

### Option C: Android Emulator
- In Window 2, press `a`
- Android Emulator opens

### Option D: Expo Go App (Physical Phone)
- In Window 2, press `o`
- Scan QR code with your phone's camera
- Tap notification to open Expo Go

---

## ✅ STEP 5: Play the Game

### Player 1 (You)
1. Enter your name
2. Click "Create Room"
3. Copy the Room ID shown

### Player 2 (Friend)
1. Open another browser tab / simulator
2. Enter their name
3. Click "Join Room"
4. Paste the Room ID
5. Click "Join Game"

### Start Playing 🎲
1. Player 1 clicks "Truth" or "Dare"
2. Question appears
3. Player 1 types answer
4. Both see the answer
5. Score updates
6. Player 2's turn
7. Keep playing!

---

## 🐛 If Something Goes Wrong

### Backend won't start
```
Error: ModuleNotFoundError: No module named 'flask_socketio'

Solution: Run again:
pip install -r requirements.txt
```

### Frontend won't connect
```
Error: Cannot connect to server

Solution: 
1. Make sure backend is running (check Window 1)
2. Close Expo (Ctrl+C in Window 2)
3. Clear cache: npx expo start --clear
```

### Port 5000 already in use
```
Error: Address already in use

Solution: 
1. Close Window 1
2. Run: netstat -ano | findstr :5000
3. Kill process: taskkill /PID [PID] /F
4. Try again
```

### Room not found
```
Make sure:
1. Backend is running (Window 1)
2. Room ID is spelled correctly
3. Both on same server (localhost:5000)
```

---

## 🎯 Window Layout

```
┌─────────────────────────────────────┐
│   WINDOW 1 - Backend                │
│   python server.py                  │
│   Running on http://0.0.0.0:5000   │
│   ✅ Keep this open always         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   WINDOW 2 - Frontend               │
│   npx expo start                    │
│   Press w/i/a/o to run             │
│   ✅ Keep this open while playing  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   BROWSER / SIMULATOR / APP         │
│   http://localhost:19000            │
│   🎮 Play the game here!            │
└─────────────────────────────────────┘
```

---

## ✨ Verify Everything Works

### Checklist
- [ ] Window 1: Backend running on port 5000
- [ ] Window 2: Frontend running on port 19000
- [ ] Browser/Simulator: Shows "Truth or Dare" title
- [ ] Connection status: Shows "● Connected to server"
- [ ] Can create a room
- [ ] Got a Room ID
- [ ] Can join room with Room ID
- [ ] Game screen shows (with Truth/Dare buttons)
- [ ] Can pick Truth or Dare
- [ ] Question appears
- [ ] Can type answer
- [ ] Score updates

If all ✅ → **You're ready to play!** 🎲

---

## 🎮 Ready?

1. Open 2 PowerShell windows
2. Follow Steps 1-4 above
3. Have fun! 🚀

---

## 📱 Want to Play on Your Phone?

1. Make sure phone & computer on same WiFi
2. In Window 2, press `o` (Expo Go)
3. Scan QR code with phone
4. Game opens in Expo Go app
5. Play on phone! 📱

---

## 🛑 To Stop

Press `Ctrl+C` in either window to stop.

Restart anytime with:
```
Window 1: python server.py
Window 2: npx expo start
```

---

## 💡 Tips

1. **Keep both windows open** - Backend and frontend need to run together
2. **Don't close Window 1** - Backend must stay running
3. **Check terminal for errors** - If something breaks, error is in terminal
4. **Refresh browser** if stuck - Press F5 in browser
5. **Use web (press w)** for easiest testing

---

## 🎉 You're All Set!

Follow the steps above and you'll be playing in **5 minutes**!

Questions? Check the documentation in the project folder.

**Let's play! 🎲**
