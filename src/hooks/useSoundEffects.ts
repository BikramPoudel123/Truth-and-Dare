import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";

type SoundName =
  | "game_start"
  | "round_start"
  | "mode_select"
  | "send"
  | "question_received"
  | "submit"
  | "reveal"
  | "pop"
  | "next_round"
  | "fail"
  | "disconnect"
  | "tick";

const SOUND_NAMES: SoundName[] = [
  "game_start",
  "round_start",
  "mode_select",
  "send",
  "question_received",
  "submit",
  "reveal",
  "pop",
  "next_round",
  "fail",
  "disconnect",
  "tick",
];

function isWeb(): boolean {
  return Platform.OS === "web";
}

export function useSoundEffects() {
  const playersRef = useRef<Map<SoundName, AudioPlayer>>(new Map());
  const enabledRef = useRef(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("settings:sound").then((v) => {
      enabledRef.current = v !== "false";
    });
  }, []);

  useEffect(() => {
    if (isWeb()) return;

    const players = new Map<SoundName, AudioPlayer>();

    SOUND_NAMES.forEach((name) => {
      try {
        const source = (() => {
          switch (name) {
            case "game_start": return require("../../assets/sounds/game_start.wav");
            case "round_start": return require("../../assets/sounds/round_start.wav");
            case "mode_select": return require("../../assets/sounds/mode_select.wav");
            case "send": return require("../../assets/sounds/send.wav");
            case "question_received": return require("../../assets/sounds/question_received.wav");
            case "submit": return require("../../assets/sounds/submit.wav");
            case "reveal": return require("../../assets/sounds/reveal.wav");
            case "pop": return require("../../assets/sounds/pop.wav");
            case "next_round": return require("../../assets/sounds/next_round.wav");
            case "fail": return require("../../assets/sounds/fail.wav");
            case "disconnect": return require("../../assets/sounds/disconnect.wav");
            case "tick": return require("../../assets/sounds/tick.wav");
          }
        })();
        const player = createAudioPlayer(source);
        players.set(name, player);
      } catch (e) {
        console.warn(`Sound init error: ${name}`, e);
      }
    });

    playersRef.current = players;
    loadedRef.current = true;

    return () => {
      players.forEach((player) => {
        try {
          player.remove();
        } catch {}
      });
      players.clear();
    };
  }, []);

  const play = useCallback((name: SoundName) => {
    if (isWeb() || !enabledRef.current) return;

    const player = playersRef.current.get(name);
    if (!player) return;

    try {
      player.play();
    } catch (e) {
      // Silently fail
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  const refreshEnabled = useCallback(async () => {
    const v = await AsyncStorage.getItem("settings:sound");
    enabledRef.current = v !== "false";
  }, []);

  return {
    play,
    setEnabled,
    refreshEnabled,
    playGameStart: useCallback(() => play("game_start"), [play]),
    playRoundStart: useCallback(() => play("round_start"), [play]),
    playModeSelect: useCallback(() => play("mode_select"), [play]),
    playSend: useCallback(() => play("send"), [play]),
    playQuestionReceived: useCallback(() => play("question_received"), [play]),
    playSubmit: useCallback(() => play("submit"), [play]),
    playReveal: useCallback(() => play("reveal"), [play]),
    playPop: useCallback(() => play("pop"), [play]),
    playNextRound: useCallback(() => play("next_round"), [play]),
    playFail: useCallback(() => play("fail"), [play]),
    playDisconnect: useCallback(() => play("disconnect"), [play]),
    playTick: useCallback(() => play("tick"), [play]),
  };
}
