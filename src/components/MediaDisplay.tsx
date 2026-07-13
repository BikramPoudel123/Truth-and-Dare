import { createAudioPlayer } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Play, Search, X } from "lucide-react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

const SCREEN = Dimensions.get("window");

interface MediaDisplayProps {
  media: {
    type: "photo" | "video" | "audio";
    data: string;
    playerName?: string;
  };
  size?: "small" | "medium" | "large";
}

const sizeDimensions = {
  small: { width: 80, height: 80 },
  medium: { width: 192, height: 192 },
  large: { width: "100%" as const, height: 256 },
};

// On web, create a Blob URL from base64. On native, try a temp file first.
// If either path fails, fall back to a data URI so the UI stays usable.
async function base64ToFileUri(data: string, ext: string): Promise<string> {
  const base64 = data.includes(",") ? data.split(",")[1] : data;
  if (!base64) return "";

  const mime = ext === "mp4" ? "video/mp4" : ext === "m4a" ? "audio/mp4" : "image/jpeg";

  try {
    if (typeof window !== "undefined" && typeof Blob !== "undefined") {
      const byteChars = atob(base64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++)
        bytes[i] = byteChars.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: mime }));
    }

    const path = `${FileSystem.cacheDirectory}media_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    await FileSystem.writeAsStringAsync(path, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return path;
  } catch {
    return `data:${mime};base64,${base64}`;
  }
}

function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedX.value + e.translationX;
        translateY.value = savedY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedX.value = 0;
        savedY.value = 0;
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.zoomContainer}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.zoomContainer, animStyle]}>
          <Image
            source={{ uri }}
            style={{ width: SCREEN.width, height: SCREEN.height * 0.8 }}
            contentFit="contain"
          />
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

// Writes base64 video to disk once, then plays from file:// URI.
// Seeking on a file:// URI is handled natively — no JS thread involvement.
function VideoPlayer({ data, style }: { data: string; style: any }) {
  const [fileUri, setFileUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFileUri(null);

    base64ToFileUri(data, "mp4")
      .then((uri) => {
        if (!cancelled) setFileUri(uri || null);
      })
      .catch(() => {
        if (!cancelled) setFileUri(null);
      });

    return () => {
      cancelled = true;
    };
  }, [data]);

  const player = useVideoPlayer(fileUri ?? "", (p) => {
    p.loop = false;
  });

  if (!fileUri) {
    return (
      <View style={[style, styles.videoLoading]}>
        <Text style={styles.videoLoadingText}>Loading video...</Text>
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="contain"
      nativeControls
    />
  );
}

function AudioPlayer({ data, dims }: { data: string; dims: { width: number; height: number } }) {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  useEffect(() => {
    let cancelled = false;
    base64ToFileUri(data, "m4a")
      .then((uri) => { if (!cancelled) setFileUri(uri || null); })
      .catch(() => { if (!cancelled) setFileUri(null); });
    return () => { cancelled = true; playerRef.current?.remove(); };
  }, [data]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playing) return;
    const id = setInterval(() => {
      if (!player.playing) setPlaying(false);
    }, 200);
    return () => clearInterval(id);
  }, [playing]);

  const togglePlay = () => {
    if (!fileUri) return;
    const player = playerRef.current;
    if (player) {
      if (player.playing) {
        player.pause();
        setPlaying(false);
        return;
      }
      player.play();
      setPlaying(true);
      return;
    }
    const newPlayer = createAudioPlayer({ uri: fileUri });
    playerRef.current = newPlayer;
    newPlayer.play();
    setPlaying(true);
  };

  return (
    <TouchableOpacity onPress={togglePlay} activeOpacity={0.7} style={[dims, { alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", borderRadius: 8 }]}>
      <Play size={24} color={playing ? "#a855f7" : "#fff"} />
    </TouchableOpacity>
  );
}

export function MediaDisplay({ media, size = "medium" }: MediaDisplayProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const dims = sizeDimensions[size];

  if (media.type === "photo") {
    return (
      <>
        <TouchableOpacity
          onPress={() => setFullscreen(true)}
          activeOpacity={0.9}
          style={[styles.container, dims]}
        >
          <Image
            source={{ uri: media.data }}
            style={styles.fill}
            contentFit="cover"
          />
          {media.playerName && (
            <View style={styles.nameOverlay}>
              <Text style={styles.nameText}>{media.playerName}</Text>
            </View>
          )}
          <View style={styles.tapHint}>
            <Search size={12} color="white" />
          </View>
        </TouchableOpacity>

        <Modal
          visible={fullscreen}
          transparent
          animationType="fade"
          onRequestClose={() => setFullscreen(false)}
        >
          <View style={styles.modalBg}>
            <ZoomableImage uri={media.data} />
            {media.playerName && (
              <Text style={styles.fullscreenName}>{media.playerName}</Text>
            )}
            <Text style={styles.closeHint}>
              Pinch or double-tap to zoom · Tap X to close
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setFullscreen(false)}
            >
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>
      </>
    );
  }

  if (media.type === "video") {
    return (
      <View style={[styles.container, dims]}>
        <VideoPlayer data={media.data} style={styles.fill} />
        {media.playerName && (
          <View style={styles.nameOverlay}>
            <Text style={styles.nameText}>{media.playerName}</Text>
          </View>
        )}
      </View>
    );
  }

  if (media.type === "audio") {
    return <AudioPlayer data={media.data} dims={{ width: dims.width as number, height: dims.height as number }} />;
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    overflow: "hidden",
  },
  fill: { width: "100%", height: "100%" },
  nameOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
  },
  nameText: { color: "white", fontSize: 12, fontWeight: "600" },
  tapHint: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  videoLoading: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  videoLoadingText: { color: "#6b7280", fontSize: 12 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.97)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomContainer: {
    width: SCREEN.width,
    height: SCREEN.height * 0.8,
    overflow: "hidden",
  },
  fullscreenName: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
  },
  closeHint: { color: "#6b7280", fontSize: 12, marginTop: 6 },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
