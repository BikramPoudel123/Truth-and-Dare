import { SERVER_URL } from "@/constants/server";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

const generateUUID = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

const MAX_MEDIA_CHUNK_CHARS = 700_000;

function splitBase64Payload(base64: string) {
  if (!base64 || base64.length <= MAX_MEDIA_CHUNK_CHARS) {
    return base64;
  }

  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += MAX_MEDIA_CHUNK_CHARS) {
    chunks.push(base64.slice(i, i + MAX_MEDIA_CHUNK_CHARS));
  }
  return chunks;
}

export interface Player {
  id: string;
  name: string;
  profilePic?: string | null;
}

export interface Media {
  type: "photo" | "video";
  data: string;
  playerName: string;
  playerId: string;
  timestamp: number;
}

export interface GameContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  profilePic: string | null;
  setProfilePic: (uri: string | null) => void;
  interests: string[];
  setInterests: (v: string[]) => void;
  players: Player[];
  currentTurn: number;
  phase:
    | "connecting"
    | "menu"
    | "waiting"
    | "choosing"
    | "question_set"
    | "answering"
    | "reveal"
    | "error";
  currentMode: "truth" | "dare" | null;
  currentQuestion: string | null;
  answer: string | null;
  media: Media[];
  answerMediaList: Media[];
  roomId: string | null;
  playerId: string;
  playerName: string | null;
  error: string | null;
  chooserName: string | null;
  askerName: string | null;
  responderName: string | null;
  createRoom: (playerName: string) => void;
  autoJoin: (playerName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  chooseMode: (mode: "truth" | "dare") => void;
  submitQuestion: (question: string) => void;
  submitAnswer: (
    answer: string,
    mediaList?: { type: "photo" | "video"; base64: string }[],
  ) => void;
  submitMedia: (mediaType: "photo" | "video", base64: string) => void;
  nextRound: () => void;
  quitGame: () => void;
  forfeit: () => void;
  reset: () => void;
  reconnect: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const playerId = useRef(generateUUID());
  const wsRef = useRef<WebSocket | null>(null);

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [phase, setPhase] = useState<GameContextType["phase"]>("connecting");
  const [currentMode, setCurrentMode] = useState<"truth" | "dare" | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [answerMediaList, setAnswerMediaList] = useState<Media[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chooserName, setChooserName] = useState<string | null>(null);
  const [askerName, setAskerName] = useState<string | null>(null);
  const [responderName, setResponderName] = useState<string | null>(null);
  const [profilePic, setProfilePicState] = useState<string | null>(null);
  const [interests, setInterestsState] = useState<string[]>([]);

  // Use refs for values needed inside callbacks to avoid stale closures
  const roomIdRef = useRef<string | null>(null);
  const playerNameRef = useRef<string | null>(null);
  const profilePicRef = useRef<string | null>(null);
  const interestsRef = useRef<string[]>([]);

  // Load persisted profile pic on mount
  useEffect(() => {
    AsyncStorage.getItem("profilePic").then((v) => {
      if (v) {
        setProfilePicState(v);
        profilePicRef.current = v;
      }
    });
    AsyncStorage.getItem("prof:interests").then((v) => {
      if (v) {
        const arr = JSON.parse(v) as string[];
        setInterestsState(arr);
        interestsRef.current = arr;
      }
    });
  }, []);

  const setProfilePic = useCallback((uri: string | null) => {
    setProfilePicState(uri);
    profilePicRef.current = uri;
    if (uri) AsyncStorage.setItem("profilePic", uri);
    else AsyncStorage.removeItem("profilePic");
  }, []);

  const setInterests = useCallback((v: string[]) => {
    setInterestsState(v);
    interestsRef.current = v;
  }, []);

  const handleMessage = useCallback((message: any) => {
    console.log("Message:", message.type);
    switch (message.type) {
      case "room_created":
        roomIdRef.current = message.room_id;
        setRoomId(message.room_id);
        setPhase("waiting");
        break;

      case "room_joined":
        roomIdRef.current = message.room_id;
        setRoomId(message.room_id);
        setPhase("waiting");
        break;

      case "player_joined":
        setPlayers(
          message.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            profilePic: p.profile_pic ?? null,
          })),
        );
        break;

      case "game_started":
        setCurrentTurn(message.current_turn);
        setPhase("choosing");
        break;

      case "mode_chosen":
        setChooserName(message.chooser_name);
        setCurrentMode(message.mode);
        setAskerName(message.asker_name);
        setPhase("question_set");
        break;

      case "question_ready":
        setCurrentQuestion(message.question);
        setAskerName(message.asker_name);
        setResponderName(message.responder_name);
        setAnswer(null);
        setPhase("answering");
        break;

      case "both_answered":
        setAnswer(message.answer);
        setAnswerMediaList([]);
        if (message.responder_name) setResponderName(message.responder_name);
        setPhase("reveal");
        break;

      case "answer_with_media_multiple":
        setAnswer(message.answer);
        setAnswerMediaList(
          (message.media_list as any[]).map((m) => ({
            type: m.media_type,
            data: m.media_data,
            playerName: message.player_name,
            playerId: message.player_id,
            timestamp: Date.now(),
          })),
        );
        setPhase("reveal");
        break;

      case "answer_with_media":
        setAnswer(message.answer);
        setAnswerMediaList([
          {
            type: message.media_type,
            data: message.media_data,
            playerName: message.player_name,
            playerId: message.player_id,
            timestamp: Date.now(),
          },
        ]);
        setPhase("reveal");
        break;

      case "forfeit":
        setAnswer(message.answer ?? null);
        setAnswerMediaList([]);
        if (message.responder_name) setResponderName(message.responder_name);
        setPhase("reveal");
        break;

      case "round_started":
        setCurrentTurn(message.current_turn);
        setCurrentMode(null);
        setCurrentQuestion(null);
        setAnswer(null);
        setAnswerMediaList([]);
        setMedia([]);
        setChooserName(null);
        setAskerName(null);
        setResponderName(null);
        setPhase("choosing");
        break;

      case "player_quit":
        setError(message.message);
        setPhase("error");
        break;

      case "game_state":
        roomIdRef.current = message.room_id;
        setRoomId(message.room_id);
        setCurrentTurn(message.current_turn);
        setCurrentMode(message.current_mode ?? null);
        setCurrentQuestion(message.current_question ?? null);
        setAnswer(message.answer ?? null);
        setPlayers(
          message.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            profilePic: p.profile_pic ?? null,
          })),
        );
        setChooserName(message.players[message.current_turn]?.name ?? null);
        setPhase(message.phase);
        break;

      case "error":
        setError(message.message);
        setPhase((prev) => {
          if (
            ["choosing", "question_set", "answering", "reveal"].includes(prev)
          ) {
            return "error";
          }
          return prev;
        });
        break;

      case "media_received":
        setMedia((prev) => [
          ...prev,
          {
            type: message.media_type,
            data: message.media_data,
            playerName: message.player_name,
            playerId: message.player_id,
            timestamp: Date.now(),
          },
        ]);
        break;
    }
  }, []);

  // FIX: stable connect function — no deps that change, uses refs for roomId
  const connectWebSocket = useCallback(() => {
    // Close any existing socket first
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    setPhase("connecting");
    // Avoid printing internal WS URL/IP in logs
    console.log("Connecting to server");

    const socket = new WebSocket(SERVER_URL);

    socket.onopen = () => {
      console.log("Connected");
      wsRef.current = socket;
      setWs(socket);
      setIsConnected(true);
      setError(null);

      // If we have an active room, attempt reconnect
      if (roomIdRef.current) {
        console.log("Reconnecting to room:", roomIdRef.current);
        socket.send(
          JSON.stringify({
            type: "reconnect",
            room_id: roomIdRef.current,
            player_id: playerId.current,
          }),
        );
      } else {
        setPhase("menu");
      }
    };

    socket.onmessage = (event) => {
      try {
        handleMessage(JSON.parse(event.data));
      } catch (e) {
        console.error("Parse error:", e);
      }
    };

    socket.onerror = () => {
      console.error("WebSocket error");
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log("Disconnected");
      wsRef.current = null;
      setWs(null);
      setIsConnected(false);
    };
  }, [handleMessage]); // handleMessage is stable (no deps), so this never re-runs

  // FIX: run only once on mount
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not open, message dropped:", message.type);
    }
  }, []);

  const reset = useCallback(() => {
    roomIdRef.current = null;
    playerNameRef.current = null;
    setRoomId(null);
    setPlayerName(null);
    setPlayers([]);
    setCurrentTurn(0);
    setPhase("menu");
    setCurrentMode(null);
    setCurrentQuestion(null);
    setAnswer(null);
    setMedia([]);
    setAnswerMediaList([]);
    setError(null);
    setChooserName(null);
    setAskerName(null);
    setResponderName(null);
  }, []);

  const createRoom = useCallback(
    (name: string) => {
      playerNameRef.current = name;
      setPlayerName(name);
      sendMessage({
        type: "create_room",
        player_id: playerId.current,
        player_name: name,
        profile_pic: profilePicRef.current,
      });
    },
    [sendMessage],
  );

  const autoJoin = useCallback(
    (name: string) => {
      playerNameRef.current = name;
      setPlayerName(name);
      sendMessage({
        type: "auto_join",
        player_id: playerId.current,
        player_name: name,
        profile_pic: profilePicRef.current,
        interests: interestsRef.current,
      });
    },
    [sendMessage],
  );

  const joinRoom = useCallback(
    (roomIdToJoin: string, name: string) => {
      playerNameRef.current = name;
      roomIdRef.current = roomIdToJoin;
      setPlayerName(name);
      setRoomId(roomIdToJoin);
      sendMessage({
        type: "join_room",
        room_id: roomIdToJoin,
        player_id: playerId.current,
        player_name: name,
        profile_pic: profilePicRef.current,
      });
    },
    [sendMessage],
  );

  const chooseMode = useCallback(
    (mode: "truth" | "dare") => {
      if (roomIdRef.current) {
        sendMessage({
          type: "choose_mode",
          room_id: roomIdRef.current,
          player_id: playerId.current,
          mode,
        });
      }
    },
    [sendMessage],
  );

  const submitQuestion = useCallback(
    (question: string) => {
      if (roomIdRef.current) {
        sendMessage({
          type: "submit_question",
          room_id: roomIdRef.current,
          player_id: playerId.current,
          question,
        });
      }
    },
    [sendMessage],
  );

  const submitAnswer = useCallback(
    (
      answerText: string,
      mediaList?: { type: "photo" | "video"; base64: string }[],
    ) => {
      if (!roomIdRef.current) return;
      if (mediaList && mediaList.length > 0) {
        sendMessage({
          type: "submit_answer_with_media_multiple",
          room_id: roomIdRef.current,
          player_id: playerId.current,
          answer: answerText,
          media_list: mediaList.map((m) => ({
            media_type: m.type,
            media_data: splitBase64Payload(m.base64),
          })),
        });
      } else {
        sendMessage({
          type: "submit_answer",
          room_id: roomIdRef.current,
          player_id: playerId.current,
          answer: answerText,
        });
      }
    },
    [sendMessage],
  );

  const submitMedia = useCallback(
    (mediaType: "photo" | "video", base64: string) => {
      if (roomIdRef.current) {
        sendMessage({
          type: "send_media",
          room_id: roomIdRef.current,
          player_id: playerId.current,
          player_name: playerNameRef.current,
          media_type: mediaType,
          media_data: splitBase64Payload(base64),
        });
      }
    },
    [sendMessage],
  );

  const forfeit = useCallback(() => {
    if (roomIdRef.current) {
      sendMessage({
        type: "forfeit",
        room_id: roomIdRef.current,
        player_id: playerId.current,
      });
    }
  }, [sendMessage]);

  const nextRound = useCallback(() => {
    if (roomIdRef.current) {
      sendMessage({
        type: "next_round",
        room_id: roomIdRef.current,
        player_id: playerId.current,
      });
    }
  }, [sendMessage]);

  // FIX: quitGame no longer depends on reset (avoids circular dep)
  const quitGame = useCallback(() => {
    if (roomIdRef.current) {
      sendMessage({
        type: "quit_game",
        room_id: roomIdRef.current,
        player_id: playerId.current,
      });
    }
    // Inline reset to avoid circular dependency
    roomIdRef.current = null;
    playerNameRef.current = null;
    setRoomId(null);
    setPlayerName(null);
    setPlayers([]);
    setCurrentTurn(0);
    setPhase("menu");
    setCurrentMode(null);
    setCurrentQuestion(null);
    setAnswer(null);
    setMedia([]);
    setAnswerMediaList([]);
    setError(null);
    setChooserName(null);
    setAskerName(null);
    setResponderName(null);
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const value: GameContextType = {
    ws,
    isConnected,
    profilePic,
    setProfilePic,
    interests,
    setInterests,
    players,
    currentTurn,
    phase,
    currentMode,
    currentQuestion,
    answer,
    media,
    answerMediaList,
    roomId,
    playerId: playerId.current,
    playerName,
    error,
    chooserName,
    askerName,
    responderName,
    createRoom,
    autoJoin,
    joinRoom,
    chooseMode,
    submitQuestion,
    submitAnswer,
    submitMedia,
    nextRound,
    quitGame,
    forfeit,
    reset,
    reconnect,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}
