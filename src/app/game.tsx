import { AudioRecorder } from "@/components/AudioRecorder";
import { Avatar } from "@/components/Avatar";
import { MediaDisplay } from "@/components/MediaDisplay";
import { MediaPicker, SelectedMedia } from "@/components/MediaPicker";
import { QuestionPicker } from "@/components/QuestionPicker";
import { ProfileModal, ProfileModalData, DEFAULT_MODAL_DATA } from "@/components/ProfileModal";
import { useGame } from "@/contexts/GameContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getMoodConfig } from "@/data/moods";
import { getLevelProgress } from "@/utils/levels";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS } from "@/constants/design-system";
import { getHttpBase, fetchProfileCached, sendFriendRequest as sendFriendRequestApi, fetchFriendIdsAndSent } from "@/utils/http";
import { ArrowLeft, CalendarDays, Crown, Eye, Flame, Gamepad2, Heart, Mic, PartyPopper, Skull, SmilePlus, Sparkles, Star, Timer as TimerIcon, Paperclip, Send, Target, Camera, Check, X, Flag, UserPlus, UserMinus, UserCheck, Users, Zap } from "lucide-react-native";
import { ParticleBurst } from "@/components/ParticleBurst";

const PlayerAvatarItem = memo(function PlayerAvatarItem({
  player, active, playerId, playerName, profilePic, onAvatarPress, moodColor,
}: {
  player: { name: string; profilePic?: string | null };
  active: boolean;
  playerId: string;
  playerName: string | null;
  profilePic: string | null;
  onAvatarPress?: (playerId: string, playerName: string) => void;
  moodColor: string;
}) {
  const { colors, shadows } = useTheme();
  const isMe = player.name === playerName;
  const pic = isMe ? profilePic : player.profilePic;
  const glowStyle = useMemo(() => active && pic ? { ...shadows.glow } : undefined, [active, pic]);
  const content = (
    <Avatar
      uri={pic}
      name={player.name}
      size={38}
      borderWidth={2}
      borderColor={pic ? moodColor : colors.border}
      initialsBgColor={active ? moodColor : colors.glassBg}
      initialsTextColor={active ? "#fff" : colors.sub}
      style={[glowStyle, { marginBottom: 2 }]}
    />
  );
  if (isMe) return content;
  return (
    <TouchableOpacity onPress={() => onAvatarPress?.(playerId, player.name)} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
});

const PlayerBar = memo(function PlayerBar({ players, currentTurn, playerName, selfId, profilePic, onAvatarPress, playerLevels, selfLevel }: {
  players: { id: string; name: string }[];
  currentTurn: number;
  playerName: string | null;
  selfId: string;
  profilePic: string | null;
  onAvatarPress?: (playerId: string, playerName: string) => void;
  playerLevels?: Record<string, number>;
  selfLevel?: { current: number; needed: number; progress: number; level: number };
}) {
  const { gameMood, currentMode } = useGame();
  const { colors } = useTheme();
  let moodCfg = getMoodConfig(gameMood);
  if (currentMode === "truth") moodCfg = { ...moodCfg, color: colors.purple, accentColor: colors.purple };
  if (currentMode === "dare") moodCfg = { ...moodCfg, color: colors.red, accentColor: colors.red };
  if (players.length < 2) return null;

  const meIdx = players.findIndex(p => p.id === selfId);
  const me = meIdx >= 0 ? players[meIdx] : players[0];
  const oppIdx = meIdx >= 0 ? (meIdx === 0 ? 1 : 0) : 1;
  const opponent = players[oppIdx];
  const activeMe = currentTurn === meIdx;
  const activeOpp = currentTurn === oppIdx;

  return (
    <View style={[pb.bar, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[pb.slot, { alignItems: "flex-start" }]}>
        <PlayerAvatarItem player={me} active={activeMe} playerId={me.id} playerName={playerName} profilePic={profilePic} onAvatarPress={onAvatarPress} moodColor={moodCfg.color} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={[pb.name, { color: colors.subAlt }, activeMe && pb.nameOn, activeMe && { color: colors.text }]} numberOfLines={1}>
            {me.name} (you)
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Crown size={9} color={colors.gold} />
            <Text style={{ color: colors.gold, fontSize: 9, fontWeight: "900" }}>{playerLevels?.[me.id] ?? selfLevel?.level}</Text>
          </View>
        </View>
        {activeMe && <Text style={[pb.turnTag, { color: moodCfg.color }]}>● TURN</Text>}
      </View>

      <View style={[pb.vsWrap, { backgroundColor: `${moodCfg.color}20`, borderColor: `${moodCfg.color}40` }]}>
        <Text style={[pb.vsText, { color: moodCfg.color }]}>VS</Text>
      </View>

      <View style={[pb.slot, { alignItems: "flex-end" }]}>
        <PlayerAvatarItem player={opponent} active={activeOpp} playerId={opponent.id} playerName={playerName} profilePic={profilePic} onAvatarPress={onAvatarPress} moodColor={moodCfg.color} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={[pb.name, { color: colors.subAlt }, activeOpp && pb.nameOn, activeOpp && { color: colors.text }]} numberOfLines={1}>
            {opponent.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Crown size={9} color={colors.gold} />
            <Text style={{ color: colors.gold, fontSize: 9, fontWeight: "900" }}>{playerLevels?.[opponent.id] ?? "?"}</Text>
          </View>
        </View>
        {activeOpp && <Text style={[pb.turnTag, { color: moodCfg.color }]}>● TURN</Text>}
      </View>
    </View>
  );
});

const pb = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: RADIUS.cardSm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(23, 19, 50, 0.7)",
  },
  slot: { flex: 1, gap: 2 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  avatarTxt: { fontSize: 12, fontWeight: "800" },
  name: { fontSize: 11, fontWeight: "700", color: "#7c7890", maxWidth: 80 },
  nameOn: { color: "#ffffff" },
  turnTag: { fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  vsWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  vsText: { fontSize: 10, fontWeight: "900" },
});

function ModeBadge({ mode }: { mode: "truth" | "dare" | null }) {
  const { gameMood, currentMode } = useGame();
  const { colors } = useTheme();
  let moodCfg = getMoodConfig(gameMood);
  if (currentMode === "truth") moodCfg = { ...moodCfg, color: colors.purple, accentColor: colors.purple };
  if (currentMode === "dare") moodCfg = { ...moodCfg, color: colors.red, accentColor: colors.red };
  if (!mode) return null;
  const isTruth = mode === "truth";
  return (
    <View style={[mb.badge, { backgroundColor: `${moodCfg.color}20`, borderColor: moodCfg.color }]}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
        {isTruth ? <Eye size={14} color={moodCfg.color} /> : <Flame size={14} color={moodCfg.color} />}
        <Text style={[mb.text, { color: moodCfg.color }]}>{isTruth ? "TRUTH" : "DARE"}</Text>
      </View>
    </View>
  );
}
const mb = StyleSheet.create({
  badge: { borderRadius: RADIUS.small, paddingHorizontal: 14, paddingVertical: 5, alignSelf: "center", borderWidth: 1.5 },
  text:  { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
});

function TimerBar({ seconds, moodColor, maxSeconds = 60 }: { seconds: number; moodColor: string; maxSeconds?: number }) {
  const { colors } = useTheme();
  const urgent = seconds <= 10;
  const pct = Math.max(0, seconds / maxSeconds);
  return (
    <View style={tib.wrap}>
      <View style={tib.row}>
        {urgent ? <Flame size={14} color={colors.red} /> : <TimerIcon size={14} color={moodColor} />}
        <Text style={[tib.time, { color: moodColor }, urgent && { color: colors.red }]}>
          {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
        </Text>
      </View>
      <View style={[tib.track, { backgroundColor: `${moodColor}20` }]}>
        <View style={[tib.fill, { width: `${pct * 100}%` as any, backgroundColor: urgent ? colors.red : moodColor }]} />
      </View>
    </View>
  );
}
const tib = StyleSheet.create({
  wrap:  { gap: 4, marginBottom: 4 },
  row:   { flexDirection: "row", alignItems: "center", gap: 6 },
  time:  { fontSize: 16, fontWeight: "800" },
  track: { height: 4, borderRadius: 2, overflow: "hidden" },
  fill:  { height: "100%", borderRadius: 2 },
});

function ModeCard({ icon, label, sub, color, onPress, burstColors }: { icon: React.ReactNode; label: string; sub: string; color: string; onPress: () => void; burstColors?: string[] }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const [burst, setBurst] = useState(false);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, friction: 6, tension: 200 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 150 }).start();

  const handlePress = () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 100);
    onPress();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }], flex: 1 }]}>
      <TouchableOpacity
        style={[s.modeCard, { backgroundColor: `${color}15`, borderColor: color }]}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.82}
      >
        <ParticleBurst trigger={burst} count={10} colors={burstColors || [color]} spread={70} />
        <View style={[s.modeIconWrap, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <Text style={[s.modeWord, { color }]}>{label}</Text>
        <Text style={[s.modeSub, { color: colors.sub }]}>{sub}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ActionButton({ children, onPress, disabled, style }: { children: React.ReactNode; onPress: () => void; disabled?: boolean; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => { if (!disabled) Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, friction: 6, tension: 200 }).start(); };
  const onPressOut = () => { if (!disabled) Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 150 }).start(); };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled} activeOpacity={0.85} style={{ flex: 1 }}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function GameScreen() {
  const {
    players, currentTurn, phase, currentMode, currentQuestion,
    answer, media, answerMediaList, playerName, chooserName,
    askerName, responderName, profilePic, chooseMode, submitQuestion,
    submitAnswer, submitMedia, nextRound, quitGame, forfeit, gameMood,
    reaction, sendReaction, questionReaction, sendQuestionReaction, playerId,
    setSoundCallbacks,
  } = useGame();
  const { profile } = useProfile();
  const { colors, shadows } = useTheme();
  const {
    playGameStart, playRoundStart, playModeSelect, playSend,
    playQuestionReceived, playSubmit, playReveal, playPop,
    playNextRound, playFail, playDisconnect, playTick,
  } = useSoundEffects();
  const selfLevel = getLevelProgress(profile.stats.gamesPlayed);
  const [playerLevels, setPlayerLevels] = useState<Record<string, number>>({});
  let moodCfg = getMoodConfig(gameMood);
  if (currentMode === "truth") moodCfg = { ...moodCfg, color: colors.purple, accentColor: colors.purple };
  if (currentMode === "dare") moodCfg = { ...moodCfg, color: colors.red, accentColor: colors.red };
  const answerInputRef = useRef<TextInput>(null);

  const [inputQ, setInputQ]       = useState("");
  const [qMedia, setQMedia]       = useState<SelectedMedia[]>([]);
  const [showQMedia, setShowQMedia] = useState(false);
  const [showQAudio, setShowQAudio] = useState(false);
  const [showQPicker, setShowQPicker] = useState(false);
  const [inputA, setInputA]       = useState("");
  const [aMedia, setAMedia]       = useState<SelectedMedia[]>([]);
  const [showAMedia, setShowAMedia] = useState(false);
  const [showAAudio, setShowAAudio] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showQuestionReactions, setShowQuestionReactions] = useState(false);
  const [timer, setTimer]         = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pfModal, setPfModal] = useState<ProfileModalData>(DEFAULT_MODAL_DATA);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const base = getHttpBase();

  const handleQAudioRecorded = useCallback((base64: string, uri: string) => {
    setQMedia((prev) => [...prev, { type: "audio", base64, uri }]);
    setShowQAudio(false);
  }, []);
  const handleAAudioRecorded = useCallback((base64: string, uri: string) => {
    setAMedia((prev) => [...prev, { type: "audio", base64, uri }]);
    setShowAAudio(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { friendIds, sentIds } = await fetchFriendIdsAndSent(playerId);
      setFriendIds(friendIds);
      setSentIds(sentIds);
    })();
  }, []);

  // Register sound callbacks for server-triggered events
  useEffect(() => {
    setSoundCallbacks({
      gameStart: playGameStart,
      roundStart: playRoundStart,
      questionReceived: playQuestionReceived,
      reveal: playReveal,
      fail: playFail,
      pop: playPop,
      disconnect: playDisconnect,
    });
  }, [playGameStart, playRoundStart, playQuestionReceived, playReveal, playFail, playPop, playDisconnect, setSoundCallbacks]);

  // Fetch levels for both players
  useEffect(() => {
    if (players.length < 2) return;
    (async () => {
      const levels: Record<string, number> = {};
      for (const p of players) {
        const data = await fetchProfileCached(p.id);
        if (data) levels[p.id] = data.level ?? 1;
      }
      if (Object.keys(levels).length > 0) setPlayerLevels(levels);
    })();
  }, [players.length >= 2 && players.map(p => p.id).join(",")]);
  const openProfile = useCallback(async (targetId: string, targetName: string) => {
    if (!targetId) return;
    setPfModal({ ...DEFAULT_MODAL_DATA, visible: true, authorId: targetId, name: targetName, loading: true });
    const { friendIds: fIds, sentIds: sIds } = await fetchFriendIdsAndSent(playerId);
    setFriendIds(fIds);
    setSentIds(sIds);
    const data = await fetchProfileCached(targetId);
    if (data) {
      setPfModal({ ...DEFAULT_MODAL_DATA, visible: true, authorId: targetId, name: data.name, bio: data.bio, pic: data.pic, interests: data.interests, playStyle: data.playStyle, reactions: data.reactions ?? {}, gamesPlayed: data.gamesPlayed ?? 0, level: data.level ?? 1, playedSince: data.played_since ?? "", loading: false });
    } else {
      setPfModal(prev => ({ ...prev, authorId: targetId, loading: false }));
    }
  }, [playerId]);
  const onAvatarPress = useCallback((targetId: string, targetName: string) => openProfile(targetId, targetName), [openProfile]);
  const isLocalPlayer = useCallback((name: string | null) => {
    if (!name || !playerId) return false;
    if (name === playerName) return true;
    const match = players.find(p => p.name === name);
    return match?.id === playerId;
  }, [playerName, playerId, players]);
  const youSuffix = useCallback((name: string | null) => isLocalPlayer(name) ? " (you)" : "", [isLocalPlayer]);
  const prevTimerRef = useRef(0);

  const chooserName_ = useMemo(() => chooserName ?? players[currentTurn]?.name ?? null, [chooserName, players, currentTurn]);
  const isMyTurn     = useMemo(() => !!playerName && playerName === chooserName_, [playerName, chooserName_]);
  const askerName_   = useMemo(() => askerName ?? (players.length === 2 ? players[1 - currentTurn]?.name : null), [askerName, players, currentTurn]);
  const isMyQ        = useMemo(() => !!playerName && playerName === askerName_, [playerName, askerName_]);
  const responderPlayer = useMemo(() => players.find(p => p.name === responderName), [players, responderName]);
  const responderPic = useMemo(() => responderName === playerName ? profilePic : (responderPlayer?.profilePic ?? null), [responderName, playerName, profilePic, responderPlayer]);
  const canSendQ     = useMemo(() => inputQ.trim().length > 0 || qMedia.length > 0, [inputQ, qMedia]);
  const canSendA     = useMemo(() => {
    if (currentMode === "dare") return aMedia.length > 0;
    return inputA.trim().length > 0 || aMedia.length > 0;
  }, [inputA, aMedia, currentMode]);

  const getTimerDuration = useCallback(() => {
    if (phase === "reveal" && currentMode === "dare") return 60;
    if (phase === "reveal") return 30;
    if (phase === "answering" && currentMode === "dare") return 180;
    if (phase === "answering") return 60;
    if (phase === "choosing") return 7;
    if (phase === "question_set") return 30;
    return 0;
  }, [phase, currentMode]);

  useEffect(() => {
    const dur = getTimerDuration();
    if (dur > 0) {
      setTimer(dur);
      timerRef.current = setInterval(() =>
        setTimer(p => { if (p <= 1) { clearInterval(timerRef.current!); return 0; } return p - 1; }), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentMode]);

  const sendQ = useCallback(async (q: string) => {
    playSend();
    submitQuestion(q);
    const media = [...qMedia];
    setInputQ(""); setQMedia([]); setShowQMedia(false);
    for (const m of media) {
      if (m.type === "audio") {
        submitMedia(m.type, m.base64);
        continue;
      }
      try {
        const resp = await fetch(`${base}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: m.base64, filename: `media-${playerId}-${Date.now()}` }),
        });
        if (resp.ok) {
          const data = await resp.json();
          submitMedia(m.type, `${base}${data.url}`);
        } else {
          submitMedia(m.type, m.base64);
        }
      } catch {
        submitMedia(m.type, m.base64);
      }
    }
  }, [submitQuestion, qMedia, submitMedia, playerId, base]);
  const handleSendQ = useCallback(() => { if (canSendQ) sendQ(inputQ); }, [canSendQ, sendQ, inputQ]);
  const autoSendQ = useCallback(() => sendQ(inputQ), [sendQ, inputQ]);

  useEffect(() => {
    const prev = prevTimerRef.current;
    prevTimerRef.current = timer;
    if (timer > 0 && timer <= 3) {
      playTick();
    }
    if (prev === 1 && timer === 0) {
      if (phase === "answering" && isMyTurn) forfeit();
      if (phase === "choosing" && isMyTurn) chooseMode("truth");
      if (phase === "question_set" && isMyQ) autoSendQ();
      if (phase === "reveal") nextRound();
    }
  }, [timer, phase, isMyTurn, isMyQ, forfeit, chooseMode, autoSendQ, nextRound, playTick]);

  useEffect(() => {
    if (phase === "answering" && isMyTurn) {
      setTimeout(() => answerInputRef.current?.focus(), 300);
    }
  }, [phase, isMyTurn]);

  useEffect(() => {
    if (phase === "choosing") {
      setInputQ(""); setQMedia([]); setShowQMedia(false);
      setInputA(""); setAMedia([]); setShowAMedia(false);
    }
  }, [phase]);

  const handleQuit = useCallback(() => Alert.alert("Quit Game", "Are you sure?", [{ text: "Cancel" }, { text: "Quit", onPress: quitGame, style: "destructive" }]), [quitGame]);
  const handleSendA = useCallback(async () => {
    if (!canSendA) return;
    let uploaded: { type: "photo" | "video" | "audio"; base64?: string; url?: string }[] | undefined;
    if (aMedia.length > 0) {
      uploaded = await Promise.all(aMedia.map(async (m) => {
        if (m.type === "audio") return { type: m.type, base64: m.base64 };
        try {
          const resp = await fetch(`${base}/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64: m.base64, filename: `game-${playerId}-${Date.now()}` }),
          });
          if (resp.ok) {
            const data = await resp.json();
            return { type: m.type, url: `${base}${data.url}` };
          }
        } catch {}
        return { type: m.type, base64: m.base64 };
      }));
    }
    playSubmit();
    submitAnswer(inputA, uploaded);
    setInputA(""); setAMedia([]); setShowAMedia(false);
  }, [canSendA, aMedia, base, playerId, submitAnswer, inputA, playSubmit]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.flex}>

        <View style={[s.topBar, { borderBottomColor: `${moodCfg.color}20` }]}>
          <TouchableOpacity onPress={handleQuit} style={[s.topBtn, { backgroundColor: colors.glassBg, borderColor: colors.border }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={18} color={moodCfg.color} />
          </TouchableOpacity>
          <Text style={[s.topTitle, { color: colors.text }]}>Truth or Dare</Text>
          <View style={{ width: 36 }} />
        </View>

        <PlayerBar players={players} currentTurn={currentTurn} playerName={playerName} selfId={playerId} profilePic={profilePic} onAvatarPress={onAvatarPress} selfLevel={selfLevel} playerLevels={playerLevels} />

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >

          {phase === "choosing" && isMyTurn && (
            <View style={s.chooseWrap}>
              <Text style={[s.chooseLabel, { color: colors.sub }]}>Your turn — pick one</Text>
              <View style={[s.choiceTimer, timer <= 3 && s.choiceTimerUrgent, timer <= 3 && { backgroundColor: `${colors.red}10` }]}>
                <TimerIcon size={12} color={timer <= 3 ? colors.red : colors.sub} />
                <Text style={[s.choiceTimerTxt, { color: colors.sub }, timer <= 3 && { color: colors.red }]}>
                  Choose in {timer}s
                </Text>
                <View style={[s.choiceTrack, { backgroundColor: `${moodCfg.color}15` }]}>
                  <View style={[s.choiceFill, { width: `${(timer / 7) * 100}%` as any, backgroundColor: timer <= 3 ? colors.red : moodCfg.color }]} />
                </View>
              </View>
              <View style={s.modeRow}>
                <ModeCard
                  icon={<Eye size={36} color={moodCfg.color} />}
                  label="TRUTH"
                  sub="Answer honestly"
                  color={moodCfg.color}
                  onPress={() => { playModeSelect(); chooseMode("truth"); }}
                  burstColors={[colors.purple, "#60a5fa", "#93c5fd"]}
                />
                <ModeCard
                  icon={<Flame size={36} color={moodCfg.accentColor} />}
                  label="DARE"
                  sub="Accept challenge"
                  color={moodCfg.accentColor}
                  onPress={() => { playModeSelect(); chooseMode("dare"); }}
                  burstColors={[colors.red, "#f87171", "#fca5a5"]}
                />
              </View>
            </View>
          )}

          {phase === "choosing" && !isMyTurn && (
            <View style={s.centerFill}>
              <View style={[s.waitingCard, { backgroundColor: `${moodCfg.color}10`, borderColor: `${moodCfg.color}30` }]}>
                <ActivityIndicator size="large" color={moodCfg.color} />
                <Text style={[s.waitTitle, { color: colors.text }]}>{chooserName_}{youSuffix(chooserName_)} is choosing…</Text>
                <Text style={[s.waitSub, { color: colors.sub }]}>Truth or Dare?</Text>
              </View>
            </View>
          )}

          {phase === "question_set" && isMyQ && (
            <View style={s.section}>
              <ModeBadge mode={currentMode} />
              <TimerBar seconds={timer} moodColor={moodCfg.color} maxSeconds={getTimerDuration()} />
              <Text style={[s.phaseLabel, { color: colors.sub }]}>
                {currentMode === "truth" ? `Ask ${chooserName_}${youSuffix(chooserName_)} a question` : `Give ${chooserName_}${youSuffix(chooserName_)} a dare`}
              </Text>
              <TouchableOpacity style={[s.browseBtn, { backgroundColor: `${moodCfg.color}15`, borderColor: `${moodCfg.color}30` }]} onPress={() => setShowQPicker(true)} activeOpacity={0.85}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Sparkles size={14} color={moodCfg.color} />
                  <Text style={[s.browseBtnText, { color: moodCfg.color }]}>Browse Question Bank & Community</Text>
                </View>
              </TouchableOpacity>
              <TextInput
                style={[s.textBox, { borderColor: moodCfg.borderColor, color: colors.text, backgroundColor: colors.surface }]}
                placeholder={currentMode === "truth" ? "Type your question…" : "Describe the dare…"}
                placeholderTextColor={colors.subAlt}
                value={inputQ}
                onChangeText={setInputQ}
                multiline
                autoFocus
              />
              {qMedia.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {qMedia.map((m, i) => (
                    <View key={i} style={m.type === "audio" ? { marginRight: 8, width: 240 } : { marginRight: 8 }}>
                      <MediaDisplay media={{ type: m.type, data: m.uri, playerName: playerName ?? "" }} size="small" />
                    </View>
                  ))}
                </ScrollView>
              )}
              <QuestionPicker
                visible={showQPicker}
                mode={currentMode}
                moodTags={moodCfg.tags}
                onSelect={(text) => setInputQ(text)}
                onClose={() => setShowQPicker(false)}
              />
            </View>
          )}

          {phase === "question_set" && !isMyQ && (
            <View style={s.centerFill}>
              <View style={[s.waitingCard, { backgroundColor: `${moodCfg.color}10`, borderColor: `${moodCfg.color}30` }]}>
                <ModeBadge mode={currentMode} />
                <ActivityIndicator size="large" color={moodCfg.color} style={{ marginTop: 12 }} />
                <Text style={[s.waitTitle, { color: colors.text }]}>
                  {currentMode === "truth" ? "Waiting for question…" : "Waiting for dare…"}
                </Text>
              </View>
            </View>
          )}

          {phase === "answering" && isMyTurn && (
            <View style={s.answerContainer}>
              <TimerBar seconds={timer} moodColor={moodCfg.color} maxSeconds={getTimerDuration()} />
              <View style={[s.questionPill, { backgroundColor: `${moodCfg.color}15`, borderColor: `${moodCfg.color}30` }]}>
                <ModeBadge mode={currentMode} />
                <Text style={[s.questionText, { color: colors.sub }]}>{currentQuestion}</Text>
                <View style={{ position: "absolute", top: -8, right: -4, zIndex: 20 }}>
                  {showQuestionReactions ? (
                    <View style={[s.emojiPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {["😂", "🔥", "😍", "😮", "💀", "😢", "🎉", "👏"].map(e => (
                        <TouchableOpacity key={e} onPress={() => { playPop(); sendQuestionReaction(e); setShowQuestionReactions(false); }} activeOpacity={0.7} style={s.emojiBtn}>
                          <Text style={s.emojiTxt}>{e}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setShowQuestionReactions(true)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <SmilePlus size={20} color={colors.sub} />
                    </TouchableOpacity>
                  )}
                </View>
                {questionReaction && (
                  <View style={[s.reactDisplay, { bottom: -12, right: -8, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={s.reactEmoji}>{questionReaction}</Text>
                  </View>
                )}
              </View>
              {media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {media.map((m, i) => (
                    <View key={i} style={m.type === "audio" ? { marginRight: 8, width: 240 } : { marginRight: 8 }}>
                      <MediaDisplay media={m} size="small" />
                    </View>
                  ))}
                </ScrollView>
              )}
              <TextInput
                ref={answerInputRef}
                style={[s.answerInput, { borderColor: moodCfg.color, color: colors.text, backgroundColor: colors.surface }]}
                placeholder={currentMode === "truth" ? "Your truth…" : "What did you do?"}
                placeholderTextColor={colors.subAlt}
                value={inputA}
                onChangeText={setInputA}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          {phase === "answering" && !isMyTurn && (
            <View style={s.answerContainer}>
              <TimerBar seconds={timer} moodColor={moodCfg.color} maxSeconds={getTimerDuration()} />
              <View style={[s.questionPill, { backgroundColor: `${moodCfg.color}15`, borderColor: `${moodCfg.color}30` }]}>
                <ModeBadge mode={currentMode} />
                <Text style={[s.questionText, { color: colors.sub }]}>{currentQuestion}</Text>
              </View>
              {media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {media.map((m, i) => (
                    <View key={i} style={m.type === "audio" ? { marginRight: 8, width: 240 } : { marginRight: 8 }}>
                      <MediaDisplay media={m} size="small" />
                    </View>
                  ))}
                </ScrollView>
              )}
              <View style={s.waitingAnswer}>
                <ActivityIndicator size="small" color={moodCfg.color} />
                <Text style={[s.waitingAnswerText, { color: colors.sub }]}>{responderName}{youSuffix(responderName)} is answering…</Text>
              </View>
            </View>
          )}

          {phase === "reveal" && (
            <View style={s.revealContainer}>
              <Text style={[s.revealLabel, { color: colors.text }]}>Round Results</Text>

              <View style={[s.questionPill, { backgroundColor: `${moodCfg.color}08`, borderColor: `${moodCfg.color}20` }]}>
                <ModeBadge mode={currentMode} />
                <Text style={[s.questionText, { color: colors.sub }]}>{currentQuestion}</Text>
              </View>

              <View style={s.divider}>
                <View style={[s.divLine, { backgroundColor: colors.border }]} />
                <View style={[s.divDot, { backgroundColor: moodCfg.color }]} />
                <View style={[s.divLine, { backgroundColor: colors.border }]} />
              </View>

              {responderName !== playerName ? (
                <TouchableOpacity style={s.responderSection} onPress={() => responderPlayer?.id && openProfile(responderPlayer.id, responderName ?? "")} activeOpacity={0.7}>
                  <Avatar uri={responderPic} name={responderName ?? ""} size={32} borderWidth={2} borderColor={moodCfg.color} initialsBgColor={moodCfg.color} initialsTextColor="#fff" />
                  <Text style={[s.responderName, { color: colors.text }]}>{responderName}{youSuffix(responderName)}</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.responderSection}>
                  <Avatar uri={responderPic} name={responderName ?? ""} size={32} borderWidth={2} borderColor={moodCfg.color} initialsBgColor={moodCfg.color} initialsTextColor="#fff" />
                  <Text style={[s.responderName, { color: colors.text }]}>{responderName}{youSuffix(responderName)}</Text>
                </View>
              )}

              {answer || answerMediaList.length > 0 ? (
                <View style={[s.answerCard, { backgroundColor: `${moodCfg.color}18`, borderColor: `${moodCfg.color}35` }]}>
                  {isMyQ && (
                    <View style={s.reactRow}>
                      {showReactions ? (
                        <View style={[s.emojiPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          {["😂", "🔥", "😍", "😮", "💀", "😢", "🎉", "👏"].map(e => (
                            <TouchableOpacity key={e} onPress={() => { playPop(); sendReaction(e); setShowReactions(false); }} activeOpacity={0.7} style={s.emojiBtn}>
                              <Text style={s.emojiTxt}>{e}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => setShowReactions(true)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <SmilePlus size={20} color={colors.sub} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {answer ? <Text style={[s.answerText, { color: colors.text }]}>{answer}</Text> : null}
                  {answerMediaList.length > 0 && (
                    <View style={{ gap: 8, marginTop: 8, alignSelf: "stretch", alignItems: "center" }}>
                      {answerMediaList.map((m, i) => (
                        <MediaDisplay key={i} media={{ type: m.type, data: m.data, playerName: m.playerName }} size="medium" />
                      ))}
                    </View>
                  )}
                  {reaction && (
                    <View style={[s.reactDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={s.reactEmoji}>{reaction}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[s.forfeitBadge, { backgroundColor: `${colors.red}15` }]}>
                  <Flag size={16} color={colors.red} />
                  <Text style={[s.forfeitTxt, { color: colors.red }]}>Forfeited this round</Text>
                </View>
              )}

              {timer > 0 && <TimerBar seconds={timer} moodColor={moodCfg.color} maxSeconds={getTimerDuration()} />}
              <ActionButton
                onPress={() => { playNextRound(); nextRound(); }}
                disabled={!isMyQ}
                style={[{ borderRadius: RADIUS.button }, !isMyQ && s.nextBtnDisabled]}
              >
                <View style={[s.nextBtn, { backgroundColor: moodCfg.color }]}>
                  <Text style={s.nextBtnTxt}>
                    {isMyQ ? `Next Round  →  ${timer}s` : `Waiting for ${askerName_}${youSuffix(askerName_)}…`}
                  </Text>
                </View>
              </ActionButton>
              <TouchableOpacity onPress={handleQuit} activeOpacity={0.7} style={{ paddingVertical: 10, alignItems: "center" }}>
                <Text style={{ color: colors.red, fontSize: 13, fontWeight: "600" }}>End Game</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {phase === "question_set" && isMyQ && (
          <View style={[s.sticky, { backgroundColor: colors.surfaceDark, borderTopColor: colors.border }]}>
            {showQMedia && <MediaPicker selected={qMedia} onChange={setQMedia} />}
            {showQAudio && <AudioRecorder onRecorded={handleQAudioRecorded} accentColor={moodCfg.color} />}
            <View style={s.stickyRow}>
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${colors.purple}15`, borderColor: colors.border }]} onPress={() => setShowQMedia(v => !v)} activeOpacity={0.82}>
                <Paperclip size={20} color={colors.sub} />
                {qMedia.length > 0 && <View style={[s.badge, { backgroundColor: moodCfg.color }]}><Text style={s.badgeTxt}>{qMedia.length}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${colors.purple}15`, borderColor: colors.border }]} onPress={() => setShowQAudio(v => !v)} activeOpacity={0.82}>
                <Mic size={20} color={colors.sub} />
                {qMedia.filter(m => m.type === "audio").length > 0 && <View style={[s.badge, { backgroundColor: moodCfg.color }]}><Text style={s.badgeTxt}>{qMedia.filter(m => m.type === "audio").length}</Text></View>}
              </TouchableOpacity>
              <ActionButton
                onPress={handleSendQ}
                disabled={!canSendQ}
                style={[{ backgroundColor: moodCfg.color, borderRadius: RADIUS.button, flex: 1 }, !canSendQ && s.stickyDisabled]}
              >
                <View style={[s.stickyBtn, { backgroundColor: "transparent" }]}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    {currentMode === "truth" ? <Send size={16} color="#fff" /> : <Target size={16} color="#fff" />}
                    <Text style={s.stickyBtnTxt}>
                      Send {currentMode === "truth" ? "Question" : "Dare"}
                      {qMedia.length > 0 ? `  (${qMedia.length})` : ""}
                    </Text>
                  </View>
                </View>
              </ActionButton>
            </View>
          </View>
        )}

        {phase === "answering" && isMyTurn && (
          <View style={[s.sticky, { backgroundColor: colors.surfaceDark, borderTopColor: `${moodCfg.color}20` }]}>
            {showAMedia && <MediaPicker selected={aMedia} onChange={setAMedia} />}
            {showAAudio && <AudioRecorder onRecorded={handleAAudioRecorded} accentColor={moodCfg.color} />}
            <View style={s.stickyRow}>
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${colors.purple}15`, borderColor: colors.border }]} onPress={() => setShowAMedia(v => !v)} activeOpacity={0.82}>
                <Camera size={20} color={colors.sub} />
                {aMedia.length > 0 && <View style={[s.badge, { backgroundColor: colors.green }]}><Text style={s.badgeTxt}>{aMedia.length}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${colors.purple}15`, borderColor: colors.border }]} onPress={() => setShowAAudio(v => !v)} activeOpacity={0.82}>
                <Mic size={20} color={colors.sub} />
                {aMedia.filter(m => m.type === "audio").length > 0 && <View style={[s.badge, { backgroundColor: colors.green }]}><Text style={s.badgeTxt}>{aMedia.filter(m => m.type === "audio").length}</Text></View>}
              </TouchableOpacity>
              <ActionButton
                onPress={handleSendA}
                disabled={!canSendA}
                style={[{ borderRadius: RADIUS.button, flex: 1 }, !canSendA && s.submitBtnDisabled]}
              >
                <View style={[s.submitBtn, { backgroundColor: moodCfg.color }]}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Check size={18} color="#fff" />
                    <Text style={s.submitBtnTxt}>
                      {aMedia.length > 0 && !inputA.trim()
                        ? `Send ${aMedia.length} file${aMedia.length > 1 ? "s" : ""}`
                        : "Submit Answer"}
                    </Text>
                  </View>
                </View>
              </ActionButton>
              <TouchableOpacity style={[s.forfeitBtn, { backgroundColor: `${colors.red}15`, borderColor: `${colors.red}30` }]} onPress={() => { playFail(); forfeit(); }} activeOpacity={0.82}>
                <X size={18} color={colors.red} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile modal */}
        <ProfileModal
          data={pfModal}
          onClose={() => setPfModal(prev => ({ ...prev, visible: false }))}
          actionMode="community"
          isFriend={pfModal.authorId ? friendIds.has(pfModal.authorId) : false}
          isSent={pfModal.authorId ? sentIds.has(pfModal.authorId) : false}
          onSendFriendRequest={async (authorId) => {
            const result = await sendFriendRequestApi(playerId, playerName ?? "", profilePic, authorId);
            if (result.ok) {
              if (result.status === "mutual") {
                setFriendIds(prev => new Set(prev).add(authorId));
                setSentIds(prev => { const s = new Set(prev); s.delete(authorId); return s; });
              } else if (result.status === "already_friends") {
                setFriendIds(prev => new Set(prev).add(authorId));
              } else if (result.status !== "already_requested") {
                setSentIds(prev => new Set(prev).add(authorId));
              }
            }
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: "#0b081c" },
  flex:  { flex: 1 },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  topBtn:    { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  topBtnTxt: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  topTitle:  { color: "#ffffff", fontSize: 14, fontWeight: "800", letterSpacing: 1 },

  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },

  centerFill: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 32 },
  chooseWrap: { alignItems: "center", paddingVertical: 32, width: "100%" },
  section:    { gap: 14, paddingTop: 8 },

  chooseLabel: { color: "#a19bb3", fontSize: 14, textAlign: "center", fontWeight: "600", marginBottom: 4 },

  choiceTimer: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.small,
  },
  choiceTimerUrgent: { backgroundColor: "#dc262610" },
  choiceTimerTxt: { color: "#a19bb3", fontSize: 12, fontWeight: "700" },
  choiceTrack: { height: 3, borderRadius: 2, flex: 1, overflow: "hidden", minWidth: 60 },
  choiceFill: { height: "100%", borderRadius: 2 },

  waitingCard: {
    borderRadius: RADIUS.cardSm, padding: 28, alignItems: "center", gap: 12,
    borderWidth: 1, width: "100%",
  },

  phaseLabel: { color: "#a19bb3", fontSize: 14, textAlign: "center", fontWeight: "600" },
  waitTitle:  { color: "#ffffff", fontSize: 18, fontWeight: "700", textAlign: "center" },
  waitSub:    { color: "#a19bb3", fontSize: 13, textAlign: "center" },

  browseBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: RADIUS.small,
    paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  browseBtnText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },

  modeRow: { flexDirection: "row", gap: 12, width: "100%" },
  modeCard: {
    flex: 1, borderRadius: RADIUS.cardSm, paddingVertical: 32,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, gap: 10,
  },
  modeIconWrap: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  modeWord:  { fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  modeSub:   { color: "#a19bb3", fontSize: 12 },

  textBox: {
    borderWidth: 1.5,
    borderRadius: RADIUS.cardSm,
    paddingHorizontal: 14, paddingVertical: 12,
    color: "#ffffff", fontSize: 15, minHeight: 90, textAlignVertical: "top",
    backgroundColor: "rgba(23, 19, 50, 0.5)",
  },

  // ── Answer-centric UI ──
  answerContainer: {
    flex: 1,
    paddingTop: 12,
    gap: 10,
  },
  questionPill: {
    borderRadius: RADIUS.cardSm,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    position: "relative",
  },
  questionText: {
    color: "#a19bb3",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  answerInput: {
    borderWidth: 2,
    borderRadius: RADIUS.cardSm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#ffffff",
    fontSize: 17,
    minHeight: 140,
    textAlignVertical: "top",
    backgroundColor: "rgba(23, 19, 50, 0.6)",
    lineHeight: 24,
  },
  waitingAnswer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 32,
  },
  waitingAnswerText: {
    color: "#a19bb3",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Reveal ──
  revealContainer: {
    flex: 1,
    paddingTop: 4,
    gap: 12,
  },
  revealLabel: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 40,
  },
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.08)" },
  divDot: { width: 6, height: 6, borderRadius: 3 },
  responderSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  responderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  responderAvatarTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },
  responderName: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  answerCard: {
    borderRadius: RADIUS.cardSm,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  answerText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
  },
  reactRow: {
    alignSelf: "flex-end",
    marginBottom: 4,
    zIndex: 10,
  },
  emojiPicker: {
    flexDirection: "row",
    gap: 2,
    backgroundColor: "rgba(23, 19, 50, 0.95)",
    borderRadius: RADIUS.small,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  emojiBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiTxt: { fontSize: 18 },
  reactDisplay: {
    position: "absolute",
    bottom: -12,
    right: -8,
    backgroundColor: "rgba(23, 19, 50, 0.9)",
    borderRadius: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  reactEmoji: { fontSize: 18 },
  forfeitBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#dc262615",
    borderRadius: RADIUS.small,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "center",
  },
  forfeitTxt: { color: "#dc2626", fontSize: 14, fontWeight: "700" },
  nextBtn: { borderRadius: RADIUS.button, paddingVertical: 16, alignItems: "center" },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 1 },

  // ── Sticky bottom ──
  stickyRow:  { flexDirection: "row", alignItems: "center", gap: 8, width: "100%" },
  attachBtn:  {
    width: 46, height: 46, borderRadius: RADIUS.small,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  badge:      { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1, minWidth: 20, alignItems: "center" },
  badgeTxt:   { color: "#fff", fontSize: 11, fontWeight: "800" },

  sticky: {
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 8,
    backgroundColor: "rgba(11, 8, 28, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  stickyBtn:      { flex: 1, borderRadius: RADIUS.small, paddingVertical: 15, alignItems: "center" },
  stickyGreen:    { backgroundColor: "#10b981" },
  stickyRed:      { backgroundColor: "#dc262615", borderWidth: 1, borderColor: "#dc262630" },
  stickyDisabled: { opacity: 0.35 },
  stickyBtnTxt:   { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 1 },

  submitBtn: {
    flex: 1,
    borderRadius: RADIUS.button,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 1 },
  forfeitBtn: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.small,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc262615",
    borderWidth: 1,
    borderColor: "#dc262630",
  },
});
