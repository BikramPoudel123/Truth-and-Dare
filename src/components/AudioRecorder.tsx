import {
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  createAudioPlayer,
} from "expo-audio";
import * as FileSystem from "expo-file-system";
import { Mic, MicOff, Play, Square, Check, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants/design-system";

interface Props {
  onRecorded: (base64: string, uri: string) => void;
  accentColor?: string;
}

type RecState = "idle" | "recording" | "recorded";

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AudioRecorder({ onRecorded, accentColor = COLORS.purple }: Props) {
  const [state, setState] = useState<RecState>("idle");
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  useEffect(() => {
    setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    return () => {
      playerRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playing) return;
    const id = setInterval(() => {
      if (!player.playing) setPlaying(false);
    }, 200);
    return () => clearInterval(id);
  }, [playing]);

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) return;
      setState("recording");
      setDurationMs(0);
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setState("idle");
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) setRecordingUri(uri);
      setDurationMs(recorder.currentTime * 1000);
      setState("recorded");
    } catch {
      setState("idle");
    }
  };

  const playRecording = () => {
    if (!recordingUri) return;
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
    const newPlayer = createAudioPlayer({ uri: recordingUri });
    playerRef.current = newPlayer;
    newPlayer.play();
    setPlaying(true);
  };

  const confirm = async () => {
    if (!recordingUri) return;
    try {
      const base64 = await FileSystem.readAsStringAsync(recordingUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      onRecorded(base64, recordingUri);
    } catch {}
    reset();
  };

  const reset = () => {
    playerRef.current?.remove();
    playerRef.current = null;
    setState("idle");
    setDurationMs(0);
    setRecordingUri(null);
    setPlaying(false);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: `${accentColor}10`,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: `${accentColor}30`,
      }}
    >
      {state === "idle" && (
        <>
          <Mic size={18} color={COLORS.sub} />
          <Text style={{ color: COLORS.sub, fontSize: 12, flex: 1 }}>
            Record voice
          </Text>
          <TouchableOpacity
            onPress={startRecording}
            activeOpacity={0.7}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: COLORS.red,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MicOff size={14} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {state === "recording" && (
        <>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: COLORS.red,
            }}
          />
          <Text
            style={{
              color: COLORS.red,
              fontSize: 13,
              fontWeight: "700",
              flex: 1,
            }}
          >
            Recording {formatTime(recorderState.durationMillis)}
          </Text>
          <TouchableOpacity onPress={stopRecording} activeOpacity={0.7}>
            <Square size={18} color={COLORS.red} />
          </TouchableOpacity>
        </>
      )}

      {state === "recorded" && (
        <>
          <TouchableOpacity onPress={playRecording} activeOpacity={0.7}>
            <Play size={16} color={playing ? accentColor : COLORS.text} />
          </TouchableOpacity>
          <Text style={{ color: COLORS.sub, fontSize: 12, flex: 1 }}>
            Voice {formatTime(durationMs)}
          </Text>
          <TouchableOpacity onPress={confirm} activeOpacity={0.7}>
            <Check size={18} color={COLORS.green} />
          </TouchableOpacity>
          <TouchableOpacity onPress={reset} activeOpacity={0.7}>
            <Trash2 size={16} color={COLORS.sub} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
