# 🎲 Truth or Dare - Online Multiplayer Game

A professional React Native + Python Flask multiplayer Truth or Dare game with real-time WebSocket communication.

## 🚀 Features

- **Real-time Multiplayer**: Connect two players online via WebSocket
- **Dynamic Gameplay**: Alternating turns with Truth and Dare modes
- **Responsive UI**: Built with NativeWind (Tailwind CSS for React Native)
- **Score Tracking**: Live scoreboard for both players
- **Room-based System**: Create rooms and share room IDs to invite friends
- **Smooth Animations**: Professional transitions and UI flows
- **Question Library**: 20+ Truth questions and Dares

## 📋 Tech Stack

### Frontend
- React Native with Expo
- NativeWind (Tailwind CSS)
- Socket.io-client for real-time communication
- TypeScript

### Backend
- Python Flask
- Flask-SocketIO for WebSocket support
- Flask-CORS for cross-origin requests

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Expo CLI: `npm install -g expo-cli`

### Backend Setup

1. **Navigate to project root and install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Flask server:**
   ```bash
   python server.py
   ```
   
   The server will run on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

2. **Configure Server URL:**
   
   In `.env` or in `src/contexts/GameContext.tsx`, set:
   ```
   EXPO_PUBLIC_SERVER_URL=http://localhost:5000
   ```
   
   For production, use your deployed server URL.

3. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

4. **Run on your device:**
   - **iOS Simulator**: Press `i`
   - **Android Emulator**: Press `a`
   - **Expo Go**: Scan the QR code with your phone

## 🎮 How to Play

### Creating a Game
1. Enter your name
2. Click "Create Room"
3. Share the displayed Room ID with a friend

### Joining a Game
1. Enter your name
2. Click "Join Room"
3. Enter the Room ID from your friend
4. Click "Join Game"

### Gameplay
1. Once both players join, the game starts
2. **Current player picks**: Truth or Dare
3. **Question is asked**: Player receives the question
4. **Player answers**: Type and submit the answer
5. **Both answers visible**: Both players see each other's answers
6. **Next round**: Turns alternate between players
7. **Score tracked**: Points awarded for each completed round

## 📁 Project Structure

```
my-app/
├── src/
│   ├── app/
│   │   ├── index.tsx          # Root app with navigation
│   │   ├── home.tsx           # Room creation/joining screen
│   │   └── game.tsx           # Main game screen
│   ├── contexts/
│   │   └── GameContext.tsx    # Game state & Socket.io
│   ├── hooks/
│   │   └── use-tw.ts          # Tailwind utilities
│   └── global.css
├── server.py                   # Flask backend
├── requirements.txt            # Python dependencies
├── tailwind.config.js         # Tailwind configuration
└── package.json
```

## 🔌 WebSocket Events

### Client → Server
- `join_game`: Join a game room
- `pick_mode`: Choose Truth or Dare
- `submit_answer`: Submit player's answer
- `next_round`: Proceed to next round

### Server → Client
- `player_joined`: New player joined
- `game_started`: Game begins
- `question_asked`: Question displayed to current player
- `answer_submitted`: Other player submitted answer
- `both_answered`: Both players' answers ready
- `round_started`: Next round begins
- `player_left`: Player disconnected
- `error`: Error message

## 🎨 UI/UX Highlights

- **Dark theme** with professional color scheme
- **NativeWind classes** for consistent styling
- **Real-time updates** with smooth transitions
- **Score display** at the top
- **Turn indicator** showing whose turn it is
- **Question card** with clear typography
- **Answer input** with placeholder hints
- **Connection status** indicator

## 🚀 Deployment

### Backend (Python)

Deploy on Heroku, Railway, or any Python hosting:

```bash
# Heroku example
git init
heroku create your-app-name
git push heroku main
```

### Frontend (React Native)

Build for iOS/Android using Expo:

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

Or use Expo Go for easy testing on physical devices.

## 🔧 Environment Variables

Create a `.env` file in the root:

```
EXPO_PUBLIC_SERVER_URL=http://your-server.com
```

## 📝 Configuration

### Questions Library

Edit `server.py` to modify the questions:
- `TRUTHS` list: Add/remove truth questions
- `DARES` list: Add/remove dare challenges

### Styling

Edit `tailwind.config.js` to customize colors and theme.

## 🐛 Troubleshooting

### Connection Issues
- Ensure backend is running: `python server.py`
- Check `EXPO_PUBLIC_SERVER_URL` matches backend URL
- Verify firewall allows WebSocket connections

### Build Issues
- Clear cache: `npm cache clean --force`
- Reinstall: `npm install`
- Clear Expo cache: `expo start --clear`

### Room Not Found
- Verify room ID is correct
- Check both players are connecting to same server
- Ensure server hasn't been restarted (clears room data)

## 📊 Performance

- Optimized WebSocket communication
- Minimal re-renders with React Context
- Efficient state management
- NativeWind compiled CSS

## 🎯 Future Enhancements

- [ ] User authentication & profiles
- [ ] Persistent game history
- [ ] Custom question creation
- [ ] Chat system during gameplay
- [ ] Game statistics & leaderboards
- [ ] Multiple game modes
- [ ] Sound effects & notifications
- [ ] AI-powered questions

## 📄 License

MIT

## 🤝 Support

For issues or questions, check the troubleshooting section or create an issue in the repository.

---

**Enjoy playing Truth or Dare online! 🎉**
