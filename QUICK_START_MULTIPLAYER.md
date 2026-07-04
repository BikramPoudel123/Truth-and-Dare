# Quick Start - Multiplayer Truth or Dare

## Before You Start
Make sure you have:
- Node.js installed
- npm installed
- Expo CLI installed (`npm install -g expo-cli`)

## Step 1: Install Dependencies (One Time Only)

```bash
cd my-app
npm install
```

## Step 2: Start the Server

Open a terminal and run:
```bash
node server.js
```

You should see: `Server running on ws://localhost:5000`

## Step 3: Start the App

Open another terminal and run:
```bash
npx expo start
```

## Step 4: Choose Your Platform

Press one of these keys:
- `a` - Android Emulator
- `i` - iOS Simulator
- `w` - Web Browser
- `j` - Expo Go (scan QR code with Expo Go app)

## Step 5: Play the Game

**Player 1:**
1. Enter your name
2. Click "Create Room"
3. Share the Room ID with Player 2
4. Wait for Player 2 to join

**Player 2:**
1. Enter your name
2. Click "Join Room"
3. Enter the Room ID from Player 1
4. Click "Join Game"

**Start Playing:**
1. Player 1 chooses **Truth** or **Dare**
2. Player 2 types a question or dare
3. Player 1 answers
4. Click "Next Round" to switch turns
5. Player 2 now chooses, and Player 1 asks!

## Testing with Two Devices

If testing locally on two emulators:
- Start Android Emulator 1 and Emulator 2
- Run `npx expo start` and open in both emulators
- Player 1 creates room in Emulator 1
- Player 2 joins room in Emulator 2

## Stop the Game

- Click "Quit Game" button anytime to leave
- Press `Ctrl+C` in terminal to stop server/app

## Common Issues

**"Server connection failed"**
- Make sure `node server.js` is running

**"Room not found"**
- Check Room ID is typed correctly
- Make sure Player 1 still has the app open

**App won't start**
- Try `npx expo start --tunnel` for better connectivity
- Or `npx expo start --localhost` if using local device

## Need Help?

Check `MULTIPLAYER_SETUP.md` for detailed setup and troubleshooting.
