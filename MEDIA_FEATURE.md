# Media Sharing Feature - Truth or Dare App

## Overview

The Truth or Dare app now supports photo and video sharing! Players can capture, upload, and share media as part of their answers and during gameplay.

## Features Added

### 1. **Media Capture & Selection**

- **Take Photos**: Capture photos directly from device camera
- **Pick Photos**: Select from device photo gallery
- **Record Videos**: Record videos directly from camera
- **Pick Videos**: Select videos from device gallery

### 2. **Answer with Media**

Players can attach photos or videos when submitting answers to truth/dare challenges.

### 3. **Media Display**

- Photos and videos are displayed in the reveal phase
- Media player with controls for videos
- Player attribution on media
- Thumbnail and full-size viewing options

### 4. **Media Streaming**

- Base64 encoded media transmission over WebSocket
- Real-time delivery to both players
- Automatic media cleanup

## File Structure

### Frontend (Expo App)

```
src/components/
├── MediaPicker.tsx       # Component for capturing/selecting media
├── MediaDisplay.tsx      # Component for displaying media
└── ...

src/contexts/
├── GameContext.tsx       # Updated with media state & handlers
└── ...

src/app/
├── game.tsx              # Updated game screen with media UI
└── ...
```

### Backend (Node.js Server)

```
server.js                 # Updated with media message handlers
  ├── send_media          # Handle standalone media messages
  ├── submit_answer_with_media  # Handle answers with media
  └── media_received      # Broadcast media to room
```

## How to Use

### Capturing Media

1. **During Answer Phase**:
   - Answer the question in the text field
   - Click "📸 Take Photo", "🎥 Take Video", etc.
   - Confirm the media selection
   - Click "Submit Answer"

2. **General Media Sharing** (optional):
   - Players can send media anytime during the game
   - Click media buttons in the media picker

### Viewing Media

1. **In Reveal Phase**:
   - Answer text is displayed
   - Media proof (if any) appears below
   - Any shared media shown in a scrollable gallery

## Technical Details

### WebSocket Messages

#### New Message Types:

```javascript
// Send media
{
  type: "send_media",
  room_id: "ABC",
  player_id: "uuid",
  player_name: "John",
  media_type: "photo" | "video",
  media_data: "base64_encoded_data"
}

// Submit answer with media
{
  type: "submit_answer_with_media",
  room_id: "ABC",
  player_id: "uuid",
  answer: "My truth answer",
  media_type: "photo" | "video",
  media_data: "base64_encoded_data"
}

// Receive media (broadcast)
{
  type: "media_received",
  player_id: "uuid",
  player_name: "John",
  media_type: "photo" | "video",
  media_data: "base64_encoded_data"
}

// Answer with media (broadcast)
{
  type: "answer_with_media",
  answer: "My truth answer",
  media_type: "photo" | "video",
  media_data: "base64_encoded_data",
  player_name: "John",
  player_id: "uuid"
}
```

### Media Storage

- Media is transmitted as **Base64-encoded strings** over WebSocket
- Stored in memory (cleared when game ends)
- **Note**: For production, consider external storage (S3, Firebase, etc.)

### Performance Considerations

- **Base64 encoding** increases data size by ~33%
- **Recommended**: Compress images to 1-2 MB before upload
- **Video quality**: Medium quality recommended for faster transmission
- **Timeout**: May need to increase WebSocket timeout for large videos

## Installation Requirements

### Dependencies Needed

```bash
cd my-expo-app
npm install expo-image-picker expo-file-system expo-av
```

### Permissions (iOS/Android)

Add these to `app.json`:

```json
{
  "plugins": [
    [
      "expo-image-picker",
      {
        "photosPermission": "Allow $(PRODUCT_NAME) to access your photos",
        "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera"
      }
    ]
  ]
}
```

## Usage Example

### From Frontend

```typescript
const { submitAnswer, submitMedia } = useGame();

// Submit answer with media
const media = { type: "photo", base64: "data:image/jpeg;base64,..." };
submitAnswer("My truth answer", media);

// Send standalone media
submitMedia("photo", "data:image/jpeg;base64,...");
```

### Backend Handling

```javascript
case "submit_answer_with_media": {
  const { room_id, player_id, answer, media_type, media_data } = message;
  // Broadcast to room
  broadcastToRoom(room, {
    type: "answer_with_media",
    answer,
    media_type,
    media_data,
    player_name,
    player_id
  });
}
```

## Best Practices

1. **Optimize Media**:
   - Compress images before sending
   - Use medium quality for videos
   - Consider resizing large images

2. **Error Handling**:
   - Handle failed uploads gracefully
   - Show loading indicators while uploading
   - Allow retry for failed transfers

3. **Privacy**:
   - Media is only visible to room participants
   - Cleared when game ends
   - Not stored permanently on server

4. **User Experience**:
   - Preview media before sending
   - Show upload progress
   - Disable submit button while uploading

## Future Enhancements

- [ ] Persistent media storage (Database/S3)
- [ ] Media compression optimization
- [ ] Live photo/video playback
- [ ] Photo filters and effects
- [ ] Media expiration/auto-delete
- [ ] Thumbnail generation
- [ ] Media reaction system
- [ ] GIF support

## Troubleshooting

### Media Not Sending

- Check WebSocket connection status
- Verify media permissions are granted
- Check file size (should be < 5MB)
- Increase WebSocket timeout if needed

### Slow Media Upload

- Compress media first
- Reduce video quality
- Check network connection
- Consider splitting large videos

### Permission Denied

- Grant camera/photo permissions in app settings
- Rebuild app after permission changes
- Check `app.json` plugin configuration

## Support

For issues or questions about the media feature, check:

- Backend logs for WebSocket message handling
- Frontend console for media picker errors
- Permissions in device settings
