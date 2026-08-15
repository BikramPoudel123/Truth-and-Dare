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
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS } from "@/constants/design-system";
import { getHttpBase, fetchProfileCached, sendFriendRequest as sendFriendRequestApi, fetchFriendIdsAndSent } from "@/utils/http";
import { ArrowLeft, CalendarDays, Crown, Eye, Flame, Heart, Mic, PartyPopper, Skull, SmilePlus, Sparkles, Star, Timer as TimerIcon, Paperclip, Send, Camera, Check, X, Flag, UserPlus, UserMinus, UserCheck, Users, Zap, Target, Pencil } from "lucide-react-native";
import { BrandGradient } from "@/components/BrandGradient";
import { AppBackground } from "@/components/AppBackground";
import { ParticleBurst } from "@/components/ParticleBurst";
import { Logo } from "@/components/Logo";
import { ADS } from "@/constants/ads";
import { adsAvailable, initAds, loadInterstitial, loadRewardedAd, showInterstitial, showRewardedAd } from "@/utils/ads";

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
  const avatar = (
    <Avatar
      uri={pic}
      name={player.name}
      size={38}
      borderWidth={2}
      borderColor={pic ? moodColor : colors.border}
      initialsBgColor={active ? moodColor : colors.glassBg}
      initialsTextColor={active ? "#fff" : colors.sub}
      style={{ marginBottom: 2 }}
    />
  );
  const content = active && pic ? (
    <BrandGradient variant="primary" style={[glowStyle, { padding: 3, borderRadius: 25, marginBottom: 2, alignSelf: "flex-start" }]}>
      {avatar}
    </BrandGradient>
  ) : avatar;
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
  if (currentMode === "truth") moodCfg = { ...moodCfg, color: colors.truth, accentColor: colors.truth };
  if (currentMode === "dare") moodCfg = { ...moodCfg, color: colors.dare, accentColor: colors.dare };
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "rgba(255,177,0,0.15)", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Crown size={9} color={colors.gold} />
            <Text style={{ color: colors.gold, fontSize: 9, fontWeight: "900" }}>{playerLevels?.[me.id] ?? selfLevel?.level}</Text>
          </View>
        </View>
        {activeMe && <Text style={[pb.turnTag, { color: moodCfg.color }]}>● TURN</Text>}
      </View>

      <BrandGradient colors={[moodCfg.color, moodCfg.accentColor]} style={[pb.vsWrap, { borderColor: `${moodCfg.color}60` }]}>
        <Text style={[pb.vsText, { color: "#fff" }]}>VS</Text>
      </BrandGradient>

      <View style={[pb.slot, { alignItems: "flex-end" }]}>
        <PlayerAvatarItem player={opponent} active={activeOpp} playerId={opponent.id} playerName={playerName} profilePic={profilePic} onAvatarPress={onAvatarPress} moodColor={moodCfg.color} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={[pb.name, { color: colors.subAlt }, activeOpp && pb.nameOn, activeOpp && { color: colors.text }]} numberOfLines={1}>
            {opponent.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "rgba(255,177,0,0.15)", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
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
    borderColor: "rgba(0, 0, 0, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f5f5f6",
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
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  avatarTxt: { fontSize: 12, fontWeight: "800" },
  name: { fontSize: 11, fontWeight: "700", color: "#8a8a94", maxWidth: 80 },
  nameOn: { color: "#1c1c1e" },
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

function TimerBar({ seconds, moodColor, maxSeconds = 60, style }: { seconds: number; moodColor: string; maxSeconds?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const urgent = seconds <= 10;
  const pct = Math.max(0, seconds / maxSeconds);
  return (
    <View style={[tib.wrap, style]}>
      <View style={[tib.track, { backgroundColor: `${moodColor}20` }]}>
        <View style={[tib.fill, { width: `${pct * 100}%` as any, backgroundColor: urgent ? colors.red : moodColor }]} />
      </View>
      {urgent ? <Flame size={14} color={colors.red} /> : <TimerIcon size={14} color={moodColor} />}
      <Text style={[tib.time, { color: urgent ? colors.red : moodColor }]}>{seconds}s</Text>
    </View>
  );
}
const tib = StyleSheet.create({
  wrap:  { flexDirection: "row", alignItems: "center", gap: 8 },
  time:  { fontSize: 14, fontWeight: "800", minWidth: 30, textAlign: "right" },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  fill:  { height: "100%", borderRadius: 3 },
});

function ModeCard({ icon, label, sub, color, onPress, burstColors }: { icon: React.ReactNode; label: string; sub: string; color: string; onPress: () => void; burstColors?: string[] }) {
  const { colors } = useTheme();
  const scale = useMemo(() => new Animated.Value(1), []);
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
  const scale = useMemo(() => new Animated.Value(1), []);

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
    submitAnswer, submitMedia, nextRound, skipRound, quitGame, forfeit, gameMood,
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
  if (currentMode === "truth") moodCfg = { ...moodCfg, color: colors.truth, accentColor: colors.truth };
  if (currentMode === "dare") moodCfg = { ...moodCfg, color: colors.dare, accentColor: colors.dare };
  const answerInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

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
  const [kbOpen, setKbOpen] = useState(false);
  const [timer, setTimer]         = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerPausedRef = useRef(false);
  const bonusUsedRef = useRef(false);
  const roundCountRef = useRef(0);
  const [saveRoundOffer, setSaveRoundOffer] = useState(false);
  const [timeUpMsg, setTimeUpMsg] = useState<string | null>(null);
  const [pfModal, setPfModal] = useState<ProfileModalData>(DEFAULT_MODAL_DATA);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { height: screenH } = useWindowDimensions();

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
      timerPausedRef.current = false;
      bonusUsedRef.current = false;
      timerRef.current = setInterval(() => {
        if (timerPausedRef.current) return;
        setTimer(p => { if (p <= 1) { clearInterval(timerRef.current!); return 0; } return p - 1; });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentMode]);

  useEffect(() => {
    initAds();
    loadInterstitial();
    loadRewardedAd();
  }, []);

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

  useEffect(() => {
    const prev = prevTimerRef.current;
    prevTimerRef.current = timer;
    if (timer > 0 && timer <= 3) {
      playTick();
    }
    if (prev === 1 && timer === 0) {
      if (phase === "answering" && isMyTurn && adsAvailable() && !bonusUsedRef.current) {
        playFail();
        setSaveRoundOffer(true);
      } else {
        if (phase === "answering" && isMyTurn) { playFail(); setTimeUpMsg("⏰ Time's up! Round skipped"); skipRound(); }
        if (phase === "choosing" && isMyTurn) chooseMode("truth");
        if (phase === "question_set" && isMyQ) { playFail(); setTimeUpMsg("⏰ Time's up! Round skipped"); skipRound(); }
        if (phase === "reveal") nextRound();
      }
    }
  }, [timer, phase, isMyTurn, isMyQ, forfeit, chooseMode, nextRound, playTick, playFail, skipRound]);

  useEffect(() => {
    setSaveRoundOffer(false);
  }, [phase]);

  const handleWatchAd = useCallback(() => {
    const ok = showRewardedAd({
      onOpen: () => { timerPausedRef.current = true; },
      onReward: () => {
        timerPausedRef.current = false;
        bonusUsedRef.current = true;
        setSaveRoundOffer(false);
        setTimer(t => t + ADS.rewardSeconds);
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            if (timerPausedRef.current) return;
            setTimer(p => { if (p <= 1) { clearInterval(timerRef.current!); return 0; } return p - 1; });
          }, 1000);
        }
        setTimeUpMsg(`🎁 +${ADS.rewardSeconds}s added!`);
      },
      onClose: () => { timerPausedRef.current = false; },
    });
    if (!ok) setTimeUpMsg("Ad not ready — try again in a second");
  }, []);

  const handleNextRound = useCallback(() => {
    playNextRound();
    nextRound();
    roundCountRef.current += 1;
    if (roundCountRef.current % ADS.interstitialEveryRound === 0) {
      showInterstitial({
        onOpen: () => { timerPausedRef.current = true; },
        onClose: () => { timerPausedRef.current = false; },
      });
    }
  }, [nextRound, playNextRound]);

  useEffect(() => {
    if (timeUpMsg) {
      const t = setTimeout(() => setTimeUpMsg(null), 2500);
      return () => clearTimeout(t);
    }
  }, [timeUpMsg]);

  useEffect(() => {
    const showEvt = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKbOpen(true),
    );
    const hideEvt = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKbOpen(false),
    );
    return () => {
      showEvt.remove();
      hideEvt.remove();
    };
  }, []);

  useEffect(() => {
    if (kbOpen && phase === "answering" && isMyTurn) {
      const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
      return () => clearTimeout(t);
    }
  }, [kbOpen, phase, isMyTurn]);

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
    <SafeAreaView style={s.safe}>
      <AppBackground />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.flex}>

        <View style={[s.topBar, { borderBottomColor: `${moodCfg.color}20` }]}>
          <TouchableOpacity onPress={handleQuit} style={[s.topBtn, { backgroundColor: colors.glassBg, borderColor: colors.border }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={18} color={moodCfg.color} />
          </TouchableOpacity>
          <View style={s.topTitleWrap}>
            <Logo size="sm" />
          </View>
          <View style={{ width: 36 }} />
        </View>

        <PlayerBar players={players} currentTurn={currentTurn} playerName={playerName} selfId={playerId} profilePic={profilePic} onAvatarPress={onAvatarPress} selfLevel={selfLevel} playerLevels={playerLevels} />

        {phase === "answering" && (
          <View style={s.adArea}>
            <View style={[s.stickyTimer, { backgroundColor: `${moodCfg.color}10`, borderColor: `${moodCfg.color}25` }]}>
              <TimerBar seconds={timer} moodColor={moodCfg.color} maxSeconds={getTimerDuration()} />
            </View>
            {adsAvailable() && isMyTurn && !bonusUsedRef.current && timer > 0 && timer <= 15 && (
              <TouchableOpacity style={[s.adBonusBtn, { borderColor: `${colors.gold}60`, backgroundColor: `${colors.gold}15` }]} onPress={handleWatchAd} activeOpacity={0.85}>
                <Zap size={14} color={colors.gold} />
                <Text style={[s.adBonusTxt, { color: colors.gold }]}>Low on time — watch ad for +{ADS.rewardSeconds}s</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {timeUpMsg && (
          <View style={[s.timeUpBanner, { backgroundColor: `${colors.red}15`, borderColor: `${colors.red}40` }]}>
            <TimerIcon size={16} color={colors.red} />
            <Text style={[s.timeUpTxt, { color: colors.red }]}>{timeUpMsg}</Text>
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (kbOpen && phase === "answering" && isMyTurn)
              scrollRef.current?.scrollToEnd({ animated: false });
          }}
        >

          {phase === "choosing" && isMyTurn && (
            <View style={s.chooseWrap}>
              <Text style={[s.chooseLabel, { color: colors.sub }]}>Your turn — pick a mode</Text>
              <TimerBar seconds={timer} moodColor={moodCfg.color} maxSeconds={getTimerDuration()} />

              <View style={s.modeRow}>
                <ModeCard
                  icon={<Eye size={36} color={colors.truth} />}
                  label="TRUTH"
                  sub="Answer honestly"
                  color={colors.truth}
                  onPress={() => { playModeSelect(); chooseMode("truth"); }}
                  burstColors={[colors.truth, "#fd267a", "#fd267a"]}
                />
                <ModeCard
                  icon={<Flame size={36} color={colors.dare} />}
                  label="DARE"
                  sub="Accept challenge"
                  color={colors.dare}
                  onPress={() => { playModeSelect(); chooseMode("dare"); }}
                  burstColors={[colors.dare, "#ff9b6b", "#ff9b6b"]}
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
                <TimerBar seconds={timer} moodColor={moodCfg.color} maxSeconds={7} style={{ marginTop: 8 }} />
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
                style={[s.textBox, { borderColor: moodCfg.color, color: colors.text, backgroundColor: colors.surface }]}
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
                <TimerBar seconds={timer} moodColor={moodCfg.color} maxSeconds={getTimerDuration()} style={{ marginTop: 8 }} />
              </View>
            </View>
          )}

          {phase === "answering" && isMyTurn && (
            <View style={[s.answerPanel, { ...shadows.glow }, kbOpen && s.answerPanelCompact]}>
              <View style={[s.questionPill, { backgroundColor: "#ffffff", borderColor: moodCfg.color, borderWidth: 2 }]}>
                <ModeBadge mode={currentMode} />
                <Text
                  style={[s.questionText, { color: "#000000", fontWeight: "800" }]}
                >
                  {currentQuestion}
                </Text>
                <View style={s.reactIconAbs}>
                  <TouchableOpacity onPress={() => setShowQuestionReactions(true)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <SmilePlus size={20} color={colors.sub} />
                  </TouchableOpacity>
                </View>
                {questionReaction && (
                  <View style={[s.reactDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={s.reactEmoji}>{questionReaction}</Text>
                  </View>
                )}
              </View>
              {media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  {media.map((m, i) => (
                    <View key={i} style={m.type === "audio" ? { marginRight: 8, width: 240 } : { marginRight: 8 }}>
                      <MediaDisplay media={m} size="small" />
                    </View>
                  ))}
                </ScrollView>
              )}
              <View style={[s.answerInputRow, kbOpen && s.answerInputRowCompact]}>
                <Pencil size={18} color={colors.purple} />
                <TextInput
                  ref={answerInputRef}
                  style={[s.answerInput, { color: colors.text, maxHeight: kbOpen ? Math.max(56, Math.min(110, screenH * 0.16)) : 140 }, kbOpen && s.answerInputCompact]}
                  placeholder="Type your answer..."
                  placeholderTextColor="#8f84ad"
                  value={inputA}
                  onChangeText={setInputA}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

        {phase === "answering" && !isMyTurn && (
            <View style={s.answerContainer}>
              <View style={[s.questionPill, { backgroundColor: "#ffffff", borderColor: moodCfg.color, borderWidth: 2 }]}>
                <ModeBadge mode={currentMode} />
                <Text style={[s.questionText, { color: "#000000", fontWeight: "800" }]}>{currentQuestion}</Text>
                {questionReaction && (
                  <View style={[s.reactDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
              <View style={s.waitingAnswer}>
                <ActivityIndicator size="small" color={moodCfg.color} />
                <Text style={[s.waitingAnswerText, { color: colors.sub }]}>{responderName}{youSuffix(responderName)} is answering…</Text>
              </View>
            </View>
          )}

          {phase === "reveal" && (
            <View style={s.revealContainer}>
              <Text style={[s.revealLabel, { color: colors.text }]}>Round Results</Text>

              <View style={[s.questionPill, { backgroundColor: "#ffffff", borderColor: moodCfg.color, borderWidth: 2 }]}>
                <ModeBadge mode={currentMode} />
                <Text style={[s.questionText, { color: "#000000", fontWeight: "800" }]}>{currentQuestion}</Text>
                {questionReaction && (
                  <View style={[s.reactDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={s.reactEmoji}>{questionReaction}</Text>
                  </View>
                )}
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
                <View style={[s.answerCard, { backgroundColor: "#f6f2ff", borderColor: moodCfg.color, borderWidth: 2 }]}>
                  {isMyQ && (
                    <View style={s.reactRow}>
                      <TouchableOpacity onPress={() => setShowReactions(true)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <SmilePlus size={20} color={colors.sub} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {answer ? <Text style={[s.answerText, { color: "#000000", fontWeight: "800" }]}>{answer}</Text> : null}
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
                onPress={handleNextRound}
                disabled={!isMyQ}
                style={[{ borderRadius: RADIUS.button }, !isMyQ && s.nextBtnDisabled]}
              >
                <BrandGradient variant="primary" style={s.nextBtnGrad}>
                  <Text style={s.nextBtnTxt}>
                    {isMyQ ? `Next Round  →  ${timer}s` : `Waiting for ${askerName_}${youSuffix(askerName_)}…`}
                  </Text>
                </BrandGradient>
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
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${colors.brand}15`, borderColor: colors.border }]} onPress={() => setShowQMedia(v => !v)} activeOpacity={0.82}>
                <Paperclip size={20} color={colors.sub} />
                {qMedia.length > 0 && <View style={[s.badge, { backgroundColor: moodCfg.color }]}><Text style={s.badgeTxt}>{qMedia.length}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${colors.brand}15`, borderColor: colors.border }]} onPress={() => setShowQAudio(v => !v)} activeOpacity={0.82}>
                <Mic size={20} color={colors.sub} />
                {qMedia.filter(m => m.type === "audio").length > 0 && <View style={[s.badge, { backgroundColor: moodCfg.color }]}><Text style={s.badgeTxt}>{qMedia.filter(m => m.type === "audio").length}</Text></View>}
              </TouchableOpacity>
              <ActionButton
                onPress={handleSendQ}
                disabled={!canSendQ}
                style={[{ backgroundColor: moodCfg.color, borderRadius: RADIUS.button, flex: 1 }, !canSendQ && s.stickyDisabled]}
              >
                <View style={[s.stickyBtn, { backgroundColor: "transparent" }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${colors.brand}15`, borderColor: colors.border }]} onPress={() => setShowAMedia(v => !v)} activeOpacity={0.82}>
                <Camera size={20} color={colors.sub} />
                {aMedia.length > 0 && <View style={[s.badge, { backgroundColor: colors.green }]}><Text style={s.badgeTxt}>{aMedia.length}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${colors.brand}15`, borderColor: colors.border }]} onPress={() => setShowAAudio(v => !v)} activeOpacity={0.82}>
                <Mic size={20} color={colors.sub} />
                {aMedia.filter(m => m.type === "audio").length > 0 && <View style={[s.badge, { backgroundColor: colors.green }]}><Text style={s.badgeTxt}>{aMedia.filter(m => m.type === "audio").length}</Text></View>}
              </TouchableOpacity>
              <ActionButton
                onPress={handleSendA}
                disabled={!canSendA}
                style={[{ borderRadius: RADIUS.button, flex: 1 }, !canSendA && s.submitBtnDisabled]}
              >
                <View style={[s.submitBtn, { backgroundColor: moodCfg.color }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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

        {showQuestionReactions && (
          <View style={s.reactOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowQuestionReactions(false)} />
            <View style={[s.emojiPicker, s.reactPickerFixed, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {["😂", "🔥", "😍", "😮", "💀", "😢", "🎉", "👏"].map(e => (
                <TouchableOpacity key={e} onPress={() => { playPop(); sendQuestionReaction(e); setShowQuestionReactions(false); }} activeOpacity={0.7} style={s.emojiBtn}>
                  <Text style={s.emojiTxt}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {showReactions && (
          <View style={s.reactOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowReactions(false)} />
            <View style={[s.emojiPicker, s.reactPickerFixed, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {["😂", "🔥", "😍", "😮", "💀", "😢", "🎉", "👏"].map(e => (
                <TouchableOpacity key={e} onPress={() => { playPop(); sendReaction(e); setShowReactions(false); }} activeOpacity={0.7} style={s.emojiBtn}>
                  <Text style={s.emojiTxt}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {saveRoundOffer && (
          <View style={s.reactOverlay}>
            <View style={[s.saveRoundCard, { backgroundColor: colors.card, borderColor: colors.red }]}>
              <TimerIcon size={30} color={colors.red} />
              <Text style={[s.saveRoundTitle, { color: colors.text }]}>Time's up!</Text>
              <Text style={[s.saveRoundSub, { color: colors.sub }]}>
                Your answer wasn't submitted. Watch a quick ad to get +{ADS.rewardSeconds}s and save your round.
              </Text>
              <TouchableOpacity style={[s.saveRoundPrimary, { backgroundColor: colors.gold }]} onPress={handleWatchAd} activeOpacity={0.85}>
                <Zap size={16} color="#fff" />
                <Text style={s.saveRoundPrimaryTxt}>Watch Ad — +{ADS.rewardSeconds}s</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSaveRoundOffer(false); playFail(); setTimeUpMsg("⏰ Time's up! Round skipped"); skipRound(); }} activeOpacity={0.7} style={{ paddingVertical: 8 }}>
                <Text style={[s.saveRoundSkip, { color: colors.sub }]}>Skip round</Text>
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
  safe:  { flex: 1 },
  flex:  { flex: 1 },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(0, 0, 0, 0.08)",
  },
  topBtn:    { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#f0f0f2", borderRadius: 18, borderWidth: 1, borderColor: "rgba(0, 0, 0, 0.08)" },
  topBtnTxt: { color: "#1c1c1e", fontSize: 18, fontWeight: "700" },
  topTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },

  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 20, paddingTop: 6 },

  timeUpBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 16, marginTop: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: RADIUS.cardSm,
    borderWidth: 1,
  },
  timeUpTxt: { fontSize: 14, fontWeight: "800" },

  centerFill: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 20 },
  chooseWrap: { alignItems: "center", paddingVertical: 20, width: "100%", flex: 1, justifyContent: "center" },
  section:    { gap: 10, paddingTop: 6 },

  chooseLabel: { color: "#5c5c66", fontSize: 14, textAlign: "center", fontWeight: "600", marginBottom: 2 },

  waitingCard: {
    borderRadius: RADIUS.cardSm, padding: 20, alignItems: "center", gap: 8,
    borderWidth: 1, width: "100%",
  },

  phaseLabel: { color: "#5c5c66", fontSize: 14, textAlign: "center", fontWeight: "600" },
  waitTitle:  { color: "#1c1c1e", fontSize: 18, fontWeight: "700", textAlign: "center" },
  waitSub:    { color: "#5c5c66", fontSize: 13, textAlign: "center" },

  browseBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: RADIUS.small,
    paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  browseBtnText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },

  modeRow: { flexDirection: "row", gap: 12, width: "100%", marginTop: 12 },
  modeCard: {
    flex: 1, borderRadius: RADIUS.cardSm, paddingVertical: 22,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, gap: 8,
  },
  modeIconWrap: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  modeWord:  { fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  modeSub:   { color: "#5c5c66", fontSize: 12 },

  textBox: {
    borderWidth: 2,
    borderRadius: RADIUS.cardSm,
    paddingHorizontal: 14, paddingVertical: 12,
    color: "#1c1c1e", fontSize: 15, minHeight: 44, textAlignVertical: "top",
    backgroundColor: "#f5f5f6",
  },

  // ── Answer-centric UI ──
  answerContainer: {
    gap: 8,
    paddingTop: 8,
  },
  stickyTimer: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: RADIUS.small,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  adArea: { marginHorizontal: 16, marginBottom: 6, gap: 6 },
  adBonusBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderRadius: RADIUS.small, paddingVertical: 8, paddingHorizontal: 12,
  },
  adBonusTxt: { fontSize: 12, fontWeight: "800" },
  saveRoundCard: {
    borderRadius: RADIUS.card, padding: 22, width: "86%", alignItems: "center", gap: 10,
    borderWidth: 2,
  },
  saveRoundTitle: { fontSize: 22, fontWeight: "900" },
  saveRoundSub: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  saveRoundPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: RADIUS.button, paddingVertical: 12, paddingHorizontal: 20, width: "100%", marginTop: 4,
  },
  saveRoundPrimaryTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
  saveRoundSkip: { fontSize: 13, fontWeight: "600" },
  answerPanel: {
    backgroundColor: "#ffffff",
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 8,
  },
  answerPanelCompact: {
    padding: 12,
    gap: 8,
  },
  questionPill: {
    borderRadius: RADIUS.cardSm,
    padding: 10,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    position: "relative",
  },
  questionText: {
    color: "#5c5c66",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  answerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: "#cdbdf0",
    backgroundColor: "#f6f2ff",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  answerInputRowCompact: {
    paddingVertical: 2,
  },
  answerInput: {
    flex: 1,
    color: "#1c1c1e",
    fontSize: 16,
    minHeight: 44,
    maxHeight: 140,
    paddingVertical: 10,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  answerInputCompact: {
    minHeight: 40,
    paddingVertical: 8,
    lineHeight: 20,
  },
  waitingAnswer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  waitingAnswerText: {
    color: "#5c5c66",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Reveal ──
  revealContainer: {
    paddingTop: 4,
    gap: 8,
  },
  revealLabel: {
    color: "#1c1c1e",
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
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(0, 0, 0, 0.08)" },
  divDot: { width: 6, height: 6, borderRadius: 3 },
  responderSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  responderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  responderAvatarTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },
  responderName: { color: "#1c1c1e", fontSize: 12, fontWeight: "600" },
  answerCard: {
    borderRadius: RADIUS.cardSm,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  answerText: {
    color: "#1c1c1e",
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
    backgroundColor: "#ffffff",
    borderRadius: RADIUS.small,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  emojiBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiTxt: { fontSize: 18 },
  reactIconAbs: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 20,
  },
  reactOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  reactPickerFixed: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  reactDisplay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#f5f5f6",
    borderRadius: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  reactEmoji: { fontSize: 18 },
  forfeitBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ff4d4d15",
    borderRadius: RADIUS.small,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "center",
  },
  forfeitTxt: { color: "#ff4d4d", fontSize: 14, fontWeight: "700" },
  nextBtnGrad: { borderRadius: RADIUS.button, paddingVertical: 12, alignItems: "center" },
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
    paddingHorizontal: 16, paddingVertical: 8,
    gap: 6,
    backgroundColor: "#e8e8ec",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
  },
  stickyBtn:      { flex: 1, borderRadius: RADIUS.small, paddingVertical: 12, alignItems: "center" },
  stickyGreen:    { backgroundColor: "#34c271" },
  stickyRed:      { backgroundColor: "#ff4d4d15", borderWidth: 1, borderColor: "#ff4d4d30" },
  stickyDisabled: { opacity: 0.35 },
  stickyBtnTxt:   { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 1 },

  submitBtn: {
    flex: 1,
    borderRadius: RADIUS.button,
    paddingVertical: 12,
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
    backgroundColor: "#ff4d4d15",
    borderWidth: 1,
    borderColor: "#ff4d4d30",
  },
});
