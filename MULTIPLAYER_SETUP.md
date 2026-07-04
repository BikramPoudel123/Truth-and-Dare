# Truth or Dare - Multiplayer Game

A real-time multiplayer Truth or Dare game built with React Native (Expo) and WebSocket.

## Project Structure

```
my-app/
├── server.js                 # WebSocket server (Node.js)
├── server-package.json       # Server dependencies
├── package.json              # App dependencies (Expo)
└── src/
    ├── app/
    │   ├── index.tsx         # Main app entry
    │   ├── menu.tsx          # Menu and room creation/joining
    │   ├── game.tsx          # Main game interface
    │   └── error.tsx         # Error screen
    ├── components/
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── Badge.tsx
    │   └── ...
    └── contexts/
        └── GameContext.tsx   # WebSocket communication logic
```

## Setup Instructions

### 1. Install Server Dependencies

```bash
# Copy server-package.json to package.json for server
cd my-app
npm install express ws uuid
```

Or create a separate folder for server:
```bash
mkdir server
cd server
npm install express ws uuid
# Copy server.js here
```

### 2. Start the WebSocket Server

```bash
# From my-app folder
node server.js

# You should see:
# Server running on ws://localhost:5000
```

### 3. Install App Dependencies

In a new terminal:
```bash
cd my-app
npm install
```

### 4. Start the Expo App

```bash
npx expo start
```

Then choose:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web (browser)

## How to Play

1. **First Player**: Creates a room and waits for opponent
2. **Second Player**: Joins the room using the Room ID
3. **Game Flow**:
   - First player chooses **Truth** or **Dare**
   - Second player writes a truth question or dare challenge
   - First player answers
   - Roles swap and continue
4. **Quit**: Click "Quit Game" button anytime

## Features

- ✅ Real-time WebSocket communication
- ✅ Create and join game rooms
- ✅ Turn-based gameplay
- ✅ Two-player multiplayer
- ✅ Simple and clean UI
- ✅ Support for Truth or Dare
- ✅ Player disconnect handling

## WebSocket Events

### Client → Server
- `create_room` - Create new game room
- `join_room` - Join existing room
- `choose_mode` - Choose truth or dare
- `submit_question` - Ask question/dare
- `submit_answer` - Answer the question
- `next_round` - Move to next turn
- `quit_game` - Leave the game

### Server → Client
- `room_created` - Room created successfully
- `player_joined` - Player joined the room
- `game_started` - Game started with 2 players
- `mode_chosen` - Player chose truth/dare
- `question_ready` - Question is ready for answering
- `both_answered` - Both players answered
- `round_started` - Next round started
- `player_quit` - Player disconnected
- `error` - Error occurred

## Troubleshooting

**Problem**: "Connection error" or "Cannot connect to server"
- **Solution**: Make sure `node server.js` is running on port 5000

**Problem**: "Room not found"
- **Solution**: Make sure the Room ID is correct. Room IDs are case-insensitive but must match exactly.

**Problem**: Server crashes on WebSocket message
- **Solution**: Check the console output for error details. Common issues are missing fields in the message payload.

## Technology Stack

- **Frontend**: React Native, Expo (v56.0.12)
- **Backend**: Node.js, Express, WebSocket (ws)
- **Real-time Communication**: WebSocket protocol
- **UI Components**: React Native components, custom Card/Button/Badge

## Future Enhancements

- [ ] Difficulty levels (Easy, Medium, Hard questions)
- [ ] Score tracking
- [ ] Multiple rooms support
- [ ] Chat messages between players
- [ ] Spectator mode
- [ ] Customizable truths/dares
- [ ] Mobile notifications

## Notes

- The game requires both players to be connected at the same time
- If a player disconnects, the other player will see an error message
- Room IDs are generated randomly and valid until the room is closed
- All communication is sent via WebSocket (no REST API calls)
