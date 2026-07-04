# 🎉 Truth or Dare - Online Multiplayer Game

Your professional multiplayer Truth or Dare game is ready! Here's everything you need to know.

## 📋 What Was Built

A complete online multiplayer game featuring:

### ✨ Features
- **Real-time Multiplayer**: Two players connect and play together
- **Professional UI**: Built with NativeWind (Tailwind CSS for React Native)
- **Type-Safe**: Full TypeScript implementation
- **Scalable Backend**: Python Flask with Socket.io WebSockets
- **Room System**: Create/join rooms with shareable IDs
- **Turn-based Gameplay**: Alternating Truth or Dare challenges
- **Live Score Tracking**: Real-time scoreboard for both players
- **20+ Questions**: Extensive question library (expandable)

### 🛠️ Technology Stack

**Frontend**
- React Native with Expo
- NativeWind for Tailwind CSS styling
- Socket.io client for real-time communication
- TypeScript for type safety

**Backend**
- Python 3.8+ with Flask
- Flask-SocketIO for WebSocket support
- Flask-CORS for cross-origin requests

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
pip install -r requirements.txt
python server.py
```

**Terminal 2 - Frontend:**
```bash
npm install
npx expo start
```

Then press:
- `i` → iOS Simulator
- `a` → Android Emulator
- `w` → Web Browser
- Scan QR → Expo Go App

---

## 🎮 How to Play

1. **Start Backend** - `python server.py` (Terminal 1)
2. **Start Frontend** - `npx expo start` (Terminal 2)
3. **Player 1**: Open app → Enter name → Click "Create Room"
4. **Share Room ID**: Give the displayed ID to Player 2
5. **Player 2**: Open app → Enter name → Enter Room ID → "Join Game"
6. **Start Playing**: Take turns picking Truth or Dare!

---

## 📁 Project Structure

```
my-app/
├── src/app/                 # Screens
│   ├── index.tsx           # Root navigation
│   ├── home.tsx            # Room creation/joining
│   └── game.tsx            # Gameplay
├── src/components/          # Reusable UI components
│   ├── Card.tsx
│   ├── Button.tsx
│   └── Badge.tsx
├── src/contexts/           # Global state management
│   └── GameContext.tsx     # Game state + Socket.io
├── server.py               # Python backend
├── requirements.txt        # Python dependencies
├── package.json            # Node dependencies
├── tailwind.config.js      # Tailwind setup
└── [Docs]
    ├── QUICKSTART.md       # Quick start guide
    ├── SETUP.md           # Detailed setup
    └── PROJECT.md         # Full documentation
```

---

## 🔧 Configuration

### Change Server URL
Edit `.env.local`:
```
EXPO_PUBLIC_SERVER_URL=http://localhost:5000
```

### Add New Questions
In `server.py`, add to `TRUTHS` or `DARES` lists:
```python
TRUTHS = [
    "Existing questions...",
    "Your new truth question here?",
]

DARES = [
    "Existing dares...",
    "Your new dare here.",
]
```

### Customize Colors
In `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#4f46e5',
      danger: '#dc2626',
      // Add your colors here
    }
  }
}
```

---

## 🎯 Key Files to Know

| File | Purpose |
|------|---------|
| `src/contexts/GameContext.tsx` | Global game state + WebSocket |
| `src/app/game.tsx` | Main gameplay screen |
| `src/app/home.tsx` | Room creation screen |
| `server.py` | Backend game logic |
| `tailwind.config.js` | UI theme configuration |

---

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.8+

# Install dependencies
pip install -r requirements.txt

# Try again
python server.py
```

### Frontend Can't Connect
```bash
# Check backend URL in .env.local
# Make sure backend is running on http://localhost:5000
# Clear Expo cache
npx expo start --clear
```

### Room Not Found
- Verify Room ID spelling (case-sensitive)
- Ensure both players connecting to same backend
- Try creating a fresh room

### Port Already in Use
```bash
# Change port in server.py (line at bottom)
socketio.run(app, host="0.0.0.0", port=5001)  # Use 5001 instead

# Update frontend URL
EXPO_PUBLIC_SERVER_URL=http://localhost:5001
```

---

## 📱 Testing Multiplayer

### On Same Computer
1. Run backend once
2. Run frontend in Simulator/Emulator
3. Run web browser version
4. Create room in one, join in other

### On Different Computers
1. Get your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Use that IP in `EXPO_PUBLIC_SERVER_URL`: `http://YOUR_IP:5000`
3. Make sure both computers on same WiFi
4. One creates room, other joins with room ID

---

## 🚀 Deployment

### Deploy Backend to Heroku

```bash
git init
git add .
git commit -m "Initial commit"
heroku create your-game-name
git push heroku main
```

### Update Frontend for Production

In `.env.local`:
```
EXPO_PUBLIC_SERVER_URL=https://your-game-name.herokuapp.com
```

Then rebuild and deploy.

---

## 💡 Tips & Tricks

1. **Better Testing**: Use different browsers/devices for multiplayer
2. **Keep Terminals Open**: You'll see error messages there
3. **Hot Reload**: Changes auto-reload in dev (just save)
4. **Sharing**: Use ngrok to expose localhost to internet
5. **Mobile Testing**: Ensure phone and computer on same WiFi

---

## 📊 Architecture Highlights

### Real-time Communication
- WebSocket for instant updates
- Event-driven architecture
- Automatic reconnection

### State Management
- React Context for global state
- Minimal re-renders
- Efficient update propagation

### Responsive Design
- Mobile-first approach
- Works on iOS, Android, Web
- NativeWind for consistency

---

## 🎓 Learning Resources

### If You Want to Modify

1. **Socket.io Events**: See `src/contexts/GameContext.tsx`
2. **Game Logic**: Check `server.py` game state management
3. **UI Components**: Check `src/components/` for reusable components
4. **Styling**: Review `tailwind.config.js` for theme

### Documentation Files

- `QUICKSTART.md` - Fast setup
- `SETUP.md` - Detailed instructions
- `PROJECT.md` - Full architecture

---

## 🔒 What's Secure

✅ WebSocket connection for real-time data  
✅ CORS enabled for safe cross-origin requests  
✅ Room-based isolation (players can't access other rooms)  
✅ Session management via Socket.io  

**Note**: For production, add authentication (JWT/OAuth)

---

## 📈 Performance

- **Connection**: WebSocket (much faster than polling)
- **State**: Only relevant data sent to clients
- **Rendering**: Optimized with React hooks
- **Styling**: Pre-compiled Tailwind CSS

---

## 🎯 Next Steps

1. ✅ Run `setup.bat` or `bash setup.sh`
2. ✅ Start backend: `python server.py`
3. ✅ Start frontend: `npx expo start`
4. ✅ Open in Simulator/Emulator
5. ✅ Create room and share with friend
6. ✅ Play!

---

## 🎉 You're All Set!

Your professional Truth or Dare game is ready to play. Everything is:

✅ Type-safe (TypeScript)  
✅ Professionally styled (NativeWind)  
✅ Real-time multiplayer (WebSockets)  
✅ Scalable backend (Flask)  
✅ Well-documented  
✅ Easy to extend  

**Have fun playing! 🎲**

---

## 📞 Need Help?

Check the troubleshooting section in QUICKSTART.md or PROJECT.md for common issues.

**Enjoy your game! 🚀🎉**
