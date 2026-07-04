# 🎲 Truth or Dare - Complete Project Documentation

## 📖 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Running the Application](#running-the-application)
5. [API Documentation](#api-documentation)
6. [Component Documentation](#component-documentation)
7. [Extending the Application](#extending-the-application)

---

## 🎯 Project Overview

**Truth or Dare** is a professional-grade online multiplayer game built with:
- **Frontend**: React Native + Expo + NativeWind (Tailwind CSS)
- **Backend**: Python Flask + Socket.io
- **Real-time Communication**: WebSocket via Socket.io

### Key Features
✅ Real-time two-player gameplay  
✅ Room-based architecture  
✅ Turn-based mechanics  
✅ Live score tracking  
✅ Responsive mobile UI  
✅ Professional styling with Tailwind  
✅ Type-safe with TypeScript  

---

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                    User Devices                          │
│  ┌──────────────┐              ┌──────────────┐         │
│  │   Player 1   │              │   Player 2   │         │
│  │ (React Native)              │ (React Native)        │
│  └──────┬───────┘              └──────┬───────┘         │
└─────────┼────────────────────────────────┼──────────────┘
          │                                │
          │        WebSocket (Socket.io)   │
          │         ─────────────────      │
          └────────────┬────────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │   Flask Backend Server     │
         │  (Python + Socket.io)      │
         │                             │
         │  ┌────────────────────────┐ │
         │  │  Game State Manager    │ │
         │  │  (Room Management)     │ │
         │  └────────────────────────┘ │
         │                             │
         │  ┌────────────────────────┐ │
         │  │  Question Database     │ │
         │  │  (Truths & Dares)      │ │
         │  └────────────────────────┘ │
         └─────────────────────────────┘
```

### Communication Flow

1. **Player Creation Phase**
   - Player 1 creates room → Backend generates Room ID
   - Player 1 receives Room ID for sharing
   - Player 2 joins with Room ID
   - Both players connected via WebSocket

2. **Gameplay Phase**
   - Player picks Truth/Dare
   - Server sends question to both players
   - Current player submits answer
   - Other player sees answer
   - Score updates
   - Turn switches

---

## 📁 File Structure

```
my-app/
├── src/
│   ├── app/
│   │   ├── index.tsx           # Root app wrapper with navigation logic
│   │   ├── home.tsx            # Room creation/joining screen
│   │   └── game.tsx            # Main gameplay screen
│   │
│   ├── components/
│   │   ├── Card.tsx            # Reusable card component
│   │   ├── Button.tsx          # Reusable button component
│   │   └── Badge.tsx           # Reusable badge component
│   │
│   ├── contexts/
│   │   └── GameContext.tsx     # Global game state + Socket.io
│   │
│   ├── hooks/
│   │   └── use-tw.ts           # Tailwind utilities hook
│   │
│   └── global.css              # Tailwind directives
│
├── server.py                   # Flask backend with Socket.io
├── requirements.txt            # Python dependencies
├── package.json                # NPM dependencies
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── app.json                    # Expo configuration
│
├── SETUP.md                    # Comprehensive setup guide
├── QUICKSTART.md               # Quick start guide
├── setup.bat                   # Windows setup script
└── setup.sh                    # macOS/Linux setup script
```

---

## 🚀 Running the Application

### Quick Start (One Command)

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

### Manual Setup

#### Step 1: Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start Flask server
python server.py
```

#### Step 2: Frontend Setup (New Terminal)
```bash
# Install Node dependencies
npm install

# Start Expo development server
npx expo start
```

#### Step 3: Launch on Device
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for Web
- Scan QR code for Expo Go app

---

## 🔌 API Documentation

### Backend Endpoints

#### REST Endpoints

**POST /api/create-room**
- Creates a new game room
- Response: `{ room_id: "abc123" }`
- Used by: HomeScreen

**GET /api/validate-room/<room_id>**
- Validates room exists and has space
- Response: `{ valid: true, players: 1 }`
- Used by: Room joining validation

**GET /api/health**
- Server health check
- Response: `{ status: "ok" }`

### WebSocket Events

#### Client → Server

**join_game**
```typescript
emit('join_game', {
  room_id: string,
  name: string
})
```

**pick_mode**
```typescript
emit('pick_mode', {
  room_id: string,
  mode: 'truth' | 'dare'
})
```

**submit_answer**
```typescript
emit('submit_answer', {
  room_id: string,
  answer: string
})
```

**next_round**
```typescript
emit('next_round', {
  room_id: string
})
```

#### Server → Client

**player_joined**
```typescript
{
  game: GameState,
  message: string
}
```

**game_started**
```typescript
{
  game: GameState,
  current_player: string
}
```

**question_asked**
```typescript
{
  mode: 'truth' | 'dare',
  question: string,
  asker: string
}
```

**both_answered**
```typescript
{
  player1: string,
  answer1: string,
  player2: string,
  answer2: string
}
```

---

## 📦 Component Documentation

### Card Component
```typescript
<Card variant="default" | "subtle" | "bordered">
  Content here
</Card>
```

### Button Component
```typescript
<Button
  variant="primary" | "secondary" | "danger" | "success"
  size="sm" | "md" | "lg"
  fullWidth={boolean}
  disabled={boolean}
  onPress={handler}
>
  Button Text
</Button>
```

### Badge Component
```typescript
<Badge variant="truth" | "dare" | "info">
  Badge Text
</Badge>
```

---

## 🎮 Game State Management

### GameContext Type

```typescript
interface GameState {
  room_id: string;
  players: Player[];
  current_turn: number;
  phase: 'waiting' | 'picking' | 'playing' | 'answering';
  scores: { [key: number]: number };
}

interface Player {
  sid: string;
  name: string;
  index: number;
}
```

### Using Game Context

```typescript
import { useGame } from '@/contexts/GameContext';

export function MyComponent() {
  const {
    gameState,
    currentQuestion,
    pickMode,
    submitAnswer,
    nextRound,
    isConnected
  } = useGame();

  return <View>...</View>;
}
```

---

## 🎯 Question Management

### Adding New Questions

**In `server.py`:**

```python
# Add to TRUTHS list
TRUTHS = [
  # ... existing questions ...
  "Your new truth question here?",
]

# Add to DARES list
DARES = [
  # ... existing dares ...
  "Your new dare challenge here.",
]
```

Questions are:
- Randomly selected from the list
- Marked as used to prevent repeats in a session
- Automatically reset if all questions used

---

## 🎨 Styling with NativeWind

### Using Tailwind Classes

```typescript
// Dark background
<View className="bg-dark" />

// Primary color button
<View className="bg-primary text-white" />

// Responsive spacing
<View className="px-6 py-4" />

// Color variables from tailwind.config.js
// - bg-dark: #09090b
// - bg-card: #18181b
// - bg-primary: #4f46e5
// - bg-danger: #dc2626
```

---

## 🔐 Error Handling

### Connection Errors
- Automatically retries with exponential backoff
- Shows connection status indicator
- Validates server URL before connecting

### Game Errors
- Invalid room ID → Alert user
- Room full → Alert user
- Player disconnect → End game gracefully
- Answer submission failure → Retry logic

---

## 📊 Performance Optimization

- **Minimal Re-renders**: React Context + memoization
- **Efficient Networking**: Event-based communication
- **Optimized Styling**: Compiled NativeWind CSS
- **Question Cache**: Questions loaded in memory
- **Connection Pooling**: Single WebSocket per session

---

## 🚀 Deployment Guide

### Backend Deployment (Heroku Example)

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-game-name

# Set Python version
echo "python-3.9.0" > runtime.txt

# Push to Heroku
git push heroku main

# Get deployed URL
heroku domains
```

### Frontend Build

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Update server URL
EXPO_PUBLIC_SERVER_URL=https://your-game-name.herokuapp.com
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Create room as Player 1
- [ ] Join room as Player 2
- [ ] Both players see each other's names
- [ ] Player 1 picks Truth/Dare
- [ ] Question appears for both
- [ ] Player 1 submits answer
- [ ] Player 2 sees answer
- [ ] Score updates correctly
- [ ] Turns alternate properly
- [ ] Disconnect handling works
- [ ] Reconnection is smooth

---

## 🔄 Future Enhancements

- [ ] User authentication (OAuth)
- [ ] Persistent player profiles
- [ ] Game history & statistics
- [ ] Custom question creation
- [ ] In-game chat
- [ ] Achievements/badges
- [ ] Leaderboard
- [ ] Voice chat support
- [ ] Game replays
- [ ] Difficulty levels

---

## 🐛 Troubleshooting

### Common Issues

**"Connection refused" error**
- Backend not running
- Wrong server URL
- Firewall blocking port 5000

**"Room not found"**
- Room ID has typo
- Server restarted (clears rooms)
- Different server instances

**"Players not seeing answers"**
- WebSocket connection dropped
- Check network connectivity
- Restart both players

**"Score not updating"**
- Check game phase state
- Verify Socket.io events firing
- Check browser console for errors

---

## 📄 License

MIT - Feel free to modify and distribute

---

## 🤝 Support

For issues:
1. Check QUICKSTART.md
2. Review troubleshooting section
3. Check console/terminal output
4. Verify backend is running
5. Verify frontend can reach backend

---

**Built with ❤️ for multiplayer fun! 🎲**
