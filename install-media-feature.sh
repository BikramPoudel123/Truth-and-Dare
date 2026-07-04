#!/bin/bash
# Install Media Feature Dependencies

echo "🎬 Installing Media Feature Dependencies..."

cd my-expo-app

# Install required packages
echo "📦 Installing packages..."
npm install expo-image-picker expo-file-system expo-av

echo "✅ Dependencies installed!"
echo ""
echo "🔧 Configuration Steps:"
echo "1. Media picker and display components are ready"
echo "2. GameContext supports media messages"
echo "3. Game screen updated with media UI"
echo "4. Server updated with media handlers"
echo ""
echo "📱 To use the feature:"
echo "1. Run 'npm start' to start Expo"
echo "2. Open Expo Go app"
echo "3. During answer phase, click media buttons"
echo "4. Select/capture your photo or video"
echo "5. Submit answer with media"
echo ""
echo "⚠️  Important:"
echo "- Grant camera and photo permissions when prompted"
echo "- Media is transmitted as Base64 over WebSocket"
echo "- Keep media files under 5MB for best performance"
echo "- Media is cleared when game ends"
echo ""
echo "✨ Media Feature is Ready!"
