import { createAudioPlayer } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Pause, Play, Search, X } from "lucide-react-native";
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
import { useTheme } from "@/contexts/ThemeContext";

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
  if (!data) return "";

  if (data.startsWith("http://") || data.startsWith("https://") || data.startsWith("file://") || data.startsWith("data:")) {
    return data;
  }

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

const WAVEFORM_BARS = 28;

function seededRandom(index: number): number {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function formatAudioTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function AudioPlayer({ data }: { data: string }) {
  const { colors } = useTheme();
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  const barHeights = useMemo(
    () => Array.from({ length: WAVEFORM_BARS }, (_, i) => 0.25 + seededRandom(i) * 0.75),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    base64ToFileUri(data, "m4a")
      .then((uri) => {
        if (!cancelled) setFileUri(uri || null);
      })
      .catch(() => {
        if (!cancelled) setFileUri(null);
      });
    return () => {
      cancelled = true;
      playerRef.current?.remove();
    };
  }, [data]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playing) return;
    const id = setInterval(() => {
      if (player.playing) {
        setCurrentTime(player.currentTime);
      } else {
        setPlaying(false);
        setCurrentTime(0);
      }
    }, 100);
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
    setDuration(newPlayer.duration || 0);
    setTimeout(() => {
      if (newPlayer.duration > 0) setDuration(newPlayer.duration);
    }, 300);
    newPlayer.play();
    setPlaying(true);
  };

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const activeBarIndex = Math.floor(progress * WAVEFORM_BARS);

  return (
    <View style={[audioStyles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity onPress={togglePlay} style={audioStyles.playBtn} activeOpacity={0.7}>
        {playing ? (
          <Pause size={16} color="#fff" fill="#fff" />
        ) : (
          <Play size={16} color="#fff" fill="#fff" />
        )}
      </TouchableOpacity>

      <View style={audioStyles.waveform}>
        {barHeights.map((h, i) => (
          <View
            key={i}
            style={[
              audioStyles.bar,
              {
                height: `${h * 100}%`,
                backgroundColor: i <= activeBarIndex ? colors.purple : colors.sub,
                opacity: i <= activeBarIndex ? 1 : 0.3,
              },
            ]}
          />
        ))}
      </View>

      <Text style={[audioStyles.time, { color: colors.sub }]}>
        {formatAudioTime(duration > 0 ? duration - currentTime : 0)}
      </Text>
    </View>
  );
}

export function MediaDisplay({ media, size = "medium" }: MediaDisplayProps) {
  const { colors } = useTheme();
  const [fullscreen, setFullscreen] = useState(false);
  const dims = sizeDimensions[size];

  if (media.type === "photo") {
    return (
      <>
        <TouchableOpacity
          onPress={() => setFullscreen(true)}
          activeOpacity={0.9}
          style={[styles.container, { backgroundColor: colors.card }, dims]}
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
      <View style={[styles.container, { backgroundColor: colors.card }, dims]}>
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
    return <AudioPlayer data={media.data} />;
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

const audioStyles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(23, 19, 50, 0.85)",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  waveform: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 32,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
  time: {
    color: "#a19bb3",
    fontSize: 12,
    fontWeight: "600",
    minWidth: 32,
    textAlign: "right",
  },
});
