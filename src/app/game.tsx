import { MediaDisplay } from "@/components/MediaDisplay";
import { MediaPicker, SelectedMedia } from "@/components/MediaPicker";
import { QuestionPicker } from "@/components/QuestionPicker";
import { useGame } from "@/contexts/GameContext";
import { getMoodConfig } from "@/data/moods";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { SERVER_URL } from "@/constants/server";
import { ArrowLeft, Crown, Eye, Flame, Heart, PartyPopper, Skull, SmilePlus, Sparkles, Star, Timer as TimerIcon, Paperclip, Send, Target, Camera, Check, X, Flag, UserPlus, Zap } from "lucide-react-native";

function getHttpBase() {
  return SERVER_URL.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://").replace(/\/$/, "");
}

const INTEREST_LABEL: Record<string, string> = {
  "fun": "fun",
  "life": "life",
  "hot": "hot",
  "connect": "connect",
  "spicy": "spicy",
  "deep": "deep",
};

function PlayerBar({ players, currentTurn, playerName, profilePic, onAvatarPress }: {
  players: { id: string; name: string }[];
  currentTurn: number;
  playerName: string | null;
  profilePic: string | null;
  onAvatarPress?: (playerId: string, playerName: string) => void;
}) {
  const { gameMood, currentMode } = useGame();
  let moodCfg = getMoodConfig(gameMood);
  if (currentMode === "dare") moodCfg = { ...moodCfg, color: COLORS.red, accentColor: COLORS.red };
  if (players.length < 2) return null;
  const p0 = players[0];
  const p1 = players[1];
  const active0 = currentTurn === 0;
  const active1 = currentTurn === 1;

  const handlePress = (playerId: string, playerName: string) => {
    onAvatarPress?.(playerId, playerName);
  };

  const Avatar = ({ player, active, playerId }: { player: { name: string; profilePic?: string | null }; active: boolean; playerId: string }) => {
    const isMe = player.name === playerName;
    const pic = isMe ? profilePic : player.profilePic;
    const content = pic
      ? <Image source={{ uri: pic }} style={[pb.avatar, { borderColor: moodCfg.color }, active && { borderColor: moodCfg.color, ...SHADOWS.glow }]} />
      : (
        <View style={[pb.avatar, { backgroundColor: active ? moodCfg.color : "rgba(255,255,255,0.06)" }]}>
          <Text style={[pb.avatarTxt, { color: active ? "#fff" : COLORS.sub }]}>
            {player.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      );
    if (isMe) return content;
    return (
      <TouchableOpacity onPress={() => handlePress(playerId, player.name)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  };

  return (
    <View style={pb.bar}>
      <View style={[pb.slot, { alignItems: "flex-start" }]}>
        <Avatar player={p0} active={active0} playerId={p0.id} />
        <Text style={[pb.name, active0 && pb.nameOn]} numberOfLines={1}>
          {p0.name}
        </Text>
        {active0 && <Text style={[pb.turnTag, { color: moodCfg.color }]}>● TURN</Text>}
      </View>

      <View style={[pb.vsWrap, { backgroundColor: `${moodCfg.color}20`, borderColor: `${moodCfg.color}40` }]}>
        <Text style={[pb.vsText, { color: moodCfg.color }]}>VS</Text>
      </View>

      <View style={[pb.slot, { alignItems: "flex-end" }]}>
        <Avatar player={p1} active={active1} playerId={p1.id} />
        <Text style={[pb.name, active1 && pb.nameOn]} numberOfLines={1}>
          {p1.name}
        </Text>
        {active1 && <Text style={[pb.turnTag, { color: moodCfg.color }]}>● TURN</Text>}
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: RADIUS.cardSm,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderColor: COLORS.border,
  },
  avatarTxt: { fontSize: 12, fontWeight: "800" },
  name: { fontSize: 11, fontWeight: "700", color: COLORS.subAlt, maxWidth: 80 },
  nameOn: { color: COLORS.text },
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
  let moodCfg = getMoodConfig(gameMood);
  if (currentMode === "dare") moodCfg = { ...moodCfg, color: COLORS.red, accentColor: COLORS.red };
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
  const urgent = seconds <= 10;
  const pct = Math.max(0, seconds / maxSeconds);
  return (
    <View style={tib.wrap}>
      <View style={tib.row}>
        {urgent ? <Flame size={14} color={COLORS.red} /> : <TimerIcon size={14} color={moodColor} />}
        <Text style={[tib.time, { color: moodColor }, urgent && { color: COLORS.red }]}>
          {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
        </Text>
      </View>
      <View style={[tib.track, { backgroundColor: `${moodColor}20` }]}>
        <View style={[tib.fill, { width: `${pct * 100}%` as any, backgroundColor: urgent ? COLORS.red : moodColor }]} />
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

export default function GameScreen() {
  const {
    players, currentTurn, phase, currentMode, currentQuestion,
    answer, media, answerMediaList, playerName, chooserName,
    askerName, responderName, profilePic, chooseMode, submitQuestion,
    submitAnswer, submitMedia, nextRound, quitGame, forfeit, gameMood,
    reaction, sendReaction, playerId,
  } = useGame();
  let moodCfg = getMoodConfig(gameMood);
  if (currentMode === "dare") moodCfg = { ...moodCfg, color: COLORS.red, accentColor: COLORS.red };
  const answerInputRef = useRef<TextInput>(null);

  const [inputQ, setInputQ]       = useState("");
  const [qMedia, setQMedia]       = useState<SelectedMedia[]>([]);
  const [showQMedia, setShowQMedia] = useState(false);
  const [showQPicker, setShowQPicker] = useState(false);
  const [inputA, setInputA]       = useState("");
  const [aMedia, setAMedia]       = useState<SelectedMedia[]>([]);
  const [showAMedia, setShowAMedia] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [timer, setTimer]         = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pfModal, setPfModal] = useState<{ visible: boolean; authorId: string | null; name: string; bio: string; pic: string | null; interests: string[]; playStyle: string | null; reactions: Record<string, number>; loading: boolean }>({ visible: false, authorId: null, name: "", bio: "", pic: null, interests: [], playStyle: null, reactions: {}, loading: false });
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const base = getHttpBase();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${base}/friends/${playerId}`);
        if (res.ok) {
          const data = await res.json();
          setFriendIds(new Set(data.friends.map((f: { id: string }) => f.id)));
          setSentIds(new Set(data.sent ?? []));
        }
      } catch {}
    })();
  }, []);
  const openProfile = async (targetId: string, targetName: string) => {
    if (!targetId) return;
    setPfModal({ visible: true, authorId: targetId, name: targetName, bio: "", pic: null, interests: [], playStyle: null, reactions: {}, loading: true });
    try {
      const res = await fetch(`${base}/profile/${encodeURIComponent(targetId)}`);
      if (res.ok) {
        const data = await res.json();
        setPfModal({ visible: true, authorId: targetId, name: data.name, bio: data.bio, pic: data.pic, interests: data.interests, playStyle: data.playStyle, reactions: data.reactions ?? {}, loading: false });
      } else {
        setPfModal(prev => ({ ...prev, authorId: targetId, loading: false }));
      }
    } catch {
      setPfModal(prev => ({ ...prev, authorId: targetId, loading: false }));
    }
  };
  const onAvatarPress = (targetId: string, targetName: string) => openProfile(targetId, targetName);
  const prevTimerRef = useRef(0);

  const chooserName_ = chooserName ?? players[currentTurn]?.name ?? null;
  const isMyTurn     = !!playerName && playerName === chooserName_;
  const askerName_   = askerName ?? (players.length === 2 ? players[1 - currentTurn]?.name : null);
  const isMyQ        = !!playerName && playerName === askerName_;
  const responderPlayer = players.find(p => p.name === responderName);
  const responderPic = responderName === playerName ? profilePic : (responderPlayer?.profilePic ?? null);
  const canSendQ     = inputQ.trim().length > 0 || qMedia.length > 0;
  const canSendA     = inputA.trim().length > 0 || aMedia.length > 0;

  function getTimerDuration() {
    if (phase === "reveal" && currentMode === "dare") return 60;
    if (phase === "reveal") return 30;
    if (phase === "answering" && currentMode === "dare") return 180;
    if (phase === "answering") return 60;
    if (phase === "choosing") return 7;
    if (phase === "question_set") return 30;
    return 0;
  }

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

  const sendQ = (q: string) => {
    submitQuestion(q);
    qMedia.forEach(m => submitMedia(m.type, m.base64));
    setInputQ(""); setQMedia([]); setShowQMedia(false);
  };
  const handleSendQ = () => { if (canSendQ) sendQ(inputQ); };
  const autoSendQ = () => sendQ(inputQ);

  useEffect(() => {
    const prev = prevTimerRef.current;
    prevTimerRef.current = timer;
    if (prev === 1 && timer === 0) {
      if (phase === "answering" && isMyTurn) forfeit();
      if (phase === "choosing" && isMyTurn) chooseMode("truth");
      if (phase === "question_set" && isMyQ) autoSendQ();
      if (phase === "reveal") nextRound();
    }
  }, [timer, phase, isMyTurn, isMyQ]);

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

  const handleQuit  = () => Alert.alert("Quit Game", "Are you sure?", [{ text: "Cancel" }, { text: "Quit", onPress: quitGame, style: "destructive" }]);
  const handleSendA = () => {
    if (!canSendA) return;
    submitAnswer(inputA, aMedia.length > 0 ? aMedia.map(m => ({ type: m.type, base64: m.base64 })) : undefined);
    setInputA(""); setAMedia([]); setShowAMedia(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.flex}>

        <View style={[s.topBar, { borderBottomColor: `${moodCfg.color}20` }]}>
          <TouchableOpacity onPress={handleQuit} style={s.topBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={18} color={moodCfg.color} />
          </TouchableOpacity>
          <Text style={s.topTitle}>Truth or Dare</Text>
          <View style={{ width: 36 }} />
        </View>

        <PlayerBar players={players} currentTurn={currentTurn} playerName={playerName} profilePic={profilePic} onAvatarPress={onAvatarPress} />

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >

          {phase === "choosing" && isMyTurn && (
            <View style={s.centerFill}>
              <Text style={s.chooseLabel}>Your turn — pick one</Text>
              <View style={[s.choiceTimer, timer <= 3 && s.choiceTimerUrgent]}>
                <TimerIcon size={12} color={timer <= 3 ? COLORS.red : COLORS.sub} />
                <Text style={[s.choiceTimerTxt, timer <= 3 && { color: COLORS.red }]}>
                  Choose in {timer}s
                </Text>
                <View style={[s.choiceTrack, { backgroundColor: `${moodCfg.color}15` }]}>
                  <View style={[s.choiceFill, { width: `${(timer / 7) * 100}%` as any, backgroundColor: timer <= 3 ? COLORS.red : moodCfg.color }]} />
                </View>
              </View>
              <View style={s.modeRow}>
                <TouchableOpacity style={[s.modeCard, { backgroundColor: `${moodCfg.color}15`, borderColor: moodCfg.color }]} onPress={() => chooseMode("truth")} activeOpacity={0.82}>
                  <View style={[s.modeIconWrap, { backgroundColor: `${moodCfg.color}20` }]}>
                    <Eye size={32} color={moodCfg.color} />
                  </View>
                  <Text style={[s.modeWord, { color: moodCfg.color }]}>TRUTH</Text>
                  <Text style={s.modeSub}>Answer honestly</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modeCard, { backgroundColor: `${moodCfg.accentColor}15`, borderColor: moodCfg.accentColor }]} onPress={() => chooseMode("dare")} activeOpacity={0.82}>
                  <View style={[s.modeIconWrap, { backgroundColor: `${moodCfg.accentColor}20` }]}>
                    <Flame size={32} color={moodCfg.accentColor} />
                  </View>
                  <Text style={[s.modeWord, { color: moodCfg.accentColor }]}>DARE</Text>
                  <Text style={s.modeSub}>Accept challenge</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {phase === "choosing" && !isMyTurn && (
            <View style={s.centerFill}>
              <View style={[s.waitingCard, { backgroundColor: `${moodCfg.color}10`, borderColor: `${moodCfg.color}30` }]}>
                <ActivityIndicator size="large" color={moodCfg.color} />
                <Text style={s.waitTitle}>{chooserName_} is choosing…</Text>
                <Text style={s.waitSub}>Truth or Dare?</Text>
              </View>
            </View>
          )}

          {phase === "question_set" && isMyQ && (
            <View style={s.section}>
              <ModeBadge mode={currentMode} />
              <TimerBar seconds={timer} moodColor={moodCfg.color} maxSeconds={getTimerDuration()} />
              <Text style={s.phaseLabel}>
                {currentMode === "truth" ? `Ask ${chooserName_} a question` : `Give ${chooserName_} a dare`}
              </Text>
              <TouchableOpacity style={[s.browseBtn, { backgroundColor: `${moodCfg.color}15`, borderColor: `${moodCfg.color}30` }]} onPress={() => setShowQPicker(true)} activeOpacity={0.85}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Sparkles size={14} color={moodCfg.color} />
                  <Text style={[s.browseBtnText, { color: moodCfg.color }]}>Browse Question Bank & Community</Text>
                </View>
              </TouchableOpacity>
              <TextInput
                style={[s.textBox, { borderColor: moodCfg.borderColor }]}
                placeholder={currentMode === "truth" ? "Type your question…" : "Describe the dare…"}
                placeholderTextColor={COLORS.subAlt}
                value={inputQ}
                onChangeText={setInputQ}
                multiline
                autoFocus
              />
              {qMedia.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {qMedia.map((m, i) => (
                    <View key={i} style={{ marginRight: 8 }}>
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
                <Text style={s.waitTitle}>
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
                <Text style={s.questionText}>{currentQuestion}</Text>
              </View>
              {media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {media.map((m, i) => <View key={i} style={{ marginRight: 8 }}><MediaDisplay media={m} size="small" /></View>)}
                </ScrollView>
              )}
              <TextInput
                ref={answerInputRef}
                style={[s.answerInput, { borderColor: moodCfg.color }]}
                placeholder={currentMode === "truth" ? "Your truth…" : "What did you do?"}
                placeholderTextColor={COLORS.subAlt}
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
                <Text style={s.questionText}>{currentQuestion}</Text>
              </View>
              {media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {media.map((m, i) => <View key={i} style={{ marginRight: 8 }}><MediaDisplay media={m} size="small" /></View>)}
                </ScrollView>
              )}
              <View style={s.waitingAnswer}>
                <ActivityIndicator size="small" color={moodCfg.color} />
                <Text style={s.waitingAnswerText}>{responderName} is answering…</Text>
              </View>
            </View>
          )}

          {phase === "reveal" && (
            <View style={s.revealContainer}>
              <Text style={s.revealLabel}>Round Results</Text>

              <View style={[s.questionPill, { backgroundColor: `${moodCfg.color}08`, borderColor: `${moodCfg.color}20` }]}>
                <ModeBadge mode={currentMode} />
                <Text style={s.questionText}>{currentQuestion}</Text>
              </View>

              <View style={s.divider}>
                <View style={s.divLine} />
                <View style={[s.divDot, { backgroundColor: moodCfg.color }]} />
                <View style={s.divLine} />
              </View>

              {responderName !== playerName ? (
                <TouchableOpacity style={s.responderSection} onPress={() => responderPlayer?.id && openProfile(responderPlayer.id, responderName ?? "")} activeOpacity={0.7}>
                  {responderPic ? (
                    <Image source={{ uri: responderPic }} style={[s.responderAvatar, { borderWidth: 2, borderColor: moodCfg.color }]} />
                  ) : (
                    <View style={[s.responderAvatar, { backgroundColor: moodCfg.color }]}>
                      <Text style={s.responderAvatarTxt}>{responderName?.slice(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={s.responderName}>{responderName}</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.responderSection}>
                  {responderPic ? (
                    <Image source={{ uri: responderPic }} style={[s.responderAvatar, { borderWidth: 2, borderColor: moodCfg.color }]} />
                  ) : (
                    <View style={[s.responderAvatar, { backgroundColor: moodCfg.color }]}>
                      <Text style={s.responderAvatarTxt}>{responderName?.slice(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={s.responderName}>{responderName}</Text>
                </View>
              )}

              {answer || answerMediaList.length > 0 ? (
                <View style={[s.answerCard, { backgroundColor: `${moodCfg.color}18`, borderColor: `${moodCfg.color}35` }]}>
                  {isMyQ && (
                    <View style={s.reactRow}>
                      {showReactions ? (
                        <View style={s.emojiPicker}>
                          {["😂", "🔥", "😍", "😮", "💀", "😢", "🎉", "👏"].map(e => (
                            <TouchableOpacity key={e} onPress={() => { sendReaction(e); setShowReactions(false); }} activeOpacity={0.7} style={s.emojiBtn}>
                              <Text style={s.emojiTxt}>{e}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => setShowReactions(true)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <SmilePlus size={20} color={COLORS.sub} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {answer ? <Text style={s.answerText}>{answer}</Text> : null}
                  {answerMediaList.length > 0 && (
                    <View style={{ gap: 8, marginTop: 8 }}>
                      {answerMediaList.map((m, i) => (
                        <MediaDisplay key={i} media={{ type: m.type, data: m.data, playerName: m.playerName }} size="medium" />
                      ))}
                    </View>
                  )}
                  {reaction && (
                    <View style={s.reactDisplay}>
                      <Text style={s.reactEmoji}>{reaction}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={s.forfeitBadge}>
                  <Flag size={16} color={COLORS.red} />
                  <Text style={s.forfeitTxt}>Forfeited this round</Text>
                </View>
              )}

              {timer > 0 && <TimerBar seconds={timer} moodColor={moodCfg.color} maxSeconds={getTimerDuration()} />}
              <TouchableOpacity
                style={[s.nextBtn, { backgroundColor: moodCfg.color }, !isMyQ && s.nextBtnDisabled]}
                onPress={nextRound}
                activeOpacity={0.85}
                disabled={!isMyQ}
              >
                <Text style={s.nextBtnTxt}>
                  {isMyQ ? `Next Round  →  ${timer}s` : `Waiting for ${askerName_}…`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {phase === "question_set" && isMyQ && (
          <View style={s.sticky}>
            {showQMedia && <MediaPicker selected={qMedia} onChange={setQMedia} />}
            <View style={s.stickyRow}>
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${COLORS.purple}15`, borderColor: COLORS.border }]} onPress={() => setShowQMedia(v => !v)} activeOpacity={0.82}>
                <Paperclip size={20} color={COLORS.sub} />
                {qMedia.length > 0 && <View style={[s.badge, { backgroundColor: moodCfg.color }]}><Text style={s.badgeTxt}>{qMedia.length}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.stickyBtn, { backgroundColor: moodCfg.color, flex: 1 }, !canSendQ && s.stickyDisabled]}
                onPress={handleSendQ}
                disabled={!canSendQ}
                activeOpacity={0.85}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  {currentMode === "truth" ? <Send size={16} color="#fff" /> : <Target size={16} color="#fff" />}
                  <Text style={s.stickyBtnTxt}>
                    Send {currentMode === "truth" ? "Question" : "Dare"}
                    {qMedia.length > 0 ? `  (${qMedia.length})` : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {phase === "answering" && isMyTurn && (
          <View style={[s.sticky, { borderTopColor: `${moodCfg.color}20` }]}>
            {showAMedia && <MediaPicker selected={aMedia} onChange={setAMedia} />}
            <View style={s.stickyRow}>
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${COLORS.purple}15`, borderColor: COLORS.border }]} onPress={() => setShowAMedia(v => !v)} activeOpacity={0.82}>
                <Camera size={20} color={COLORS.sub} />
                {aMedia.length > 0 && <View style={[s.badge, { backgroundColor: COLORS.green }]}><Text style={s.badgeTxt}>{aMedia.length}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, !canSendA && s.submitBtnDisabled]}
                onPress={handleSendA}
                disabled={!canSendA}
                activeOpacity={0.85}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Check size={18} color="#fff" />
                  <Text style={s.submitBtnTxt}>
                    {aMedia.length > 0 && !inputA.trim()
                      ? `Send ${aMedia.length} file${aMedia.length > 1 ? "s" : ""}`
                      : "Submit Answer"}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[s.forfeitBtn]} onPress={forfeit} activeOpacity={0.82}>
                <X size={18} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile modal */}
        <Modal visible={pfModal.visible} transparent animationType="fade" onRequestClose={() => setPfModal(prev => ({ ...prev, visible: false }))}>
          <TouchableOpacity style={s.pfOverlay} activeOpacity={1} onPress={() => setPfModal(prev => ({ ...prev, visible: false }))}>
            <TouchableOpacity style={s.pfCard} activeOpacity={1} onPress={() => {}}>
              {pfModal.loading ? (
                <ActivityIndicator size="large" color={COLORS.purple} />
              ) : (
                <ScrollView contentContainerStyle={{ alignItems: "center", gap: 16 }} showsVerticalScrollIndicator={false}>
                  {pfModal.pic ? (
                    <Image source={{ uri: pfModal.pic }} style={s.pfAvatar} />
                  ) : (
                    <View style={[s.pfAvatar, { backgroundColor: `${COLORS.purple}20`, alignItems: "center", justifyContent: "center" }]}>
                      <Text style={{ color: COLORS.purple, fontSize: 24, fontWeight: "800" }}>{pfModal.name.slice(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={s.pfName}>{pfModal.name}</Text>

                  {pfModal.playStyle && (() => {
                    const iconMap: Record<string, [React.ComponentType<{size: number; color: string}>, string]> = {
                      "Rising Star":      [Star, COLORS.gold],
                      "Hot Player":       [Flame, COLORS.orange],
                      "Funny Player":     [SmilePlus, "#facc15"],
                      "Heartthrob":       [Heart, COLORS.pink],
                      "Shocking Player":  [Zap, COLORS.electricBlue],
                      "Savage Player":    [Skull, "#a855f7"],
                      "Emotional Player": [Heart, "#60a5fa"],
                      "Life of the Party":[PartyPopper, "#f97316"],
                      "Respected Player": [Crown, COLORS.gold],
                    };
                    const pair = iconMap[pfModal.playStyle ?? ""] ?? [Star, COLORS.sub];
                    const Icon = pair[0];
                    return (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: RADIUS.pill, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border }}>
                        <Icon size={13} color={pair[1]} />
                        <Text style={{ color: COLORS.text, fontSize: 11, fontWeight: "700" }}>{pfModal.playStyle}</Text>
                      </View>
                    );
                  })()}

                  {Object.keys(pfModal.reactions).length > 0 && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                      {Object.entries(pfModal.reactions).map(([emoji, count]) => (
                        <View key={emoji} style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border }}>
                          <Text style={{ fontSize: 14 }}>{emoji}</Text>
                          <Text style={{ color: COLORS.sub, fontSize: 11, fontWeight: "700" }}>{count}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {pfModal.bio ? <Text style={s.pfBio}>{pfModal.bio}</Text> : null}
                  {pfModal.interests.length > 0 && (
                    <>
                      <Text style={{ color: COLORS.sub, fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" }}>Interests</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                        {pfModal.interests.map((i) => (
                          <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: `${COLORS.purple}15`, borderWidth: 1, borderColor: `${COLORS.purple}30` }}>
                            <Text style={{ color: COLORS.purple, fontSize: 11, fontWeight: "700" }}>{INTEREST_LABEL[i] ?? i}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                  {pfModal.authorId && pfModal.authorId !== playerId && !friendIds.has(pfModal.authorId) && (
                    sentIds.has(pfModal.authorId)
                      ? (
                        <View style={[s.pfAddBtn, { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }]}>
                          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "700" }}>Request Sent</Text>
                        </View>
                      )
                      : (
                        <TouchableOpacity
                          style={s.pfAddBtn}
                          onPress={async () => {
                            try {
                              const res = await fetch(`${base}/friends/request`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ from_id: playerId, from_name: playerName, from_pic: profilePic, to_id: pfModal.authorId }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.status === "already_friends") Alert.alert("Already Friends", "You are already friends with this player.");
                                else if (data.status === "already_requested") Alert.alert("Request Pending", "A friend request is already pending.");
                                else Alert.alert("Sent", "Friend request sent!");
                              }
                            } catch {}
                          }}
                          activeOpacity={0.8}
                        >
                          <UserPlus size={14} color="#fff" />
                          <Text style={s.pfAddTxt}>Add Friend</Text>
                        </TouchableOpacity>
                      )
                  )}
                </ScrollView>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.bg },
  flex:  { flex: 1 },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  topBtn:    { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, borderWidth: 1, borderColor: COLORS.border },
  topBtnTxt: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  topTitle:  { color: COLORS.text, fontSize: 14, fontWeight: "800", letterSpacing: 1 },

  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },

  centerFill: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 32 },
  section:    { gap: 14, paddingTop: 8 },

  chooseLabel: { color: COLORS.sub, fontSize: 14, textAlign: "center", fontWeight: "600", marginBottom: 4 },

  choiceTimer: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.small,
  },
  choiceTimerUrgent: { backgroundColor: `${COLORS.red}10` },
  choiceTimerTxt: { color: COLORS.sub, fontSize: 12, fontWeight: "700" },
  choiceTrack: { height: 3, borderRadius: 2, flex: 1, overflow: "hidden", minWidth: 60 },
  choiceFill: { height: "100%", borderRadius: 2 },

  waitingCard: {
    borderRadius: RADIUS.cardSm, padding: 28, alignItems: "center", gap: 12,
    borderWidth: 1, width: "100%",
  },

  phaseLabel: { color: COLORS.sub, fontSize: 14, textAlign: "center", fontWeight: "600" },
  waitTitle:  { color: COLORS.text, fontSize: 18, fontWeight: "700", textAlign: "center" },
  waitSub:    { color: COLORS.sub, fontSize: 13, textAlign: "center" },

  browseBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: RADIUS.small,
    paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  browseBtnText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },

  modeRow: { flexDirection: "row", gap: 12, width: "100%" },
  modeCard: {
    flex: 1, borderRadius: RADIUS.cardSm, paddingVertical: 28,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, gap: 8,
  },
  modeIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  modeWord:  { fontSize: 20, fontWeight: "900", letterSpacing: 2 },
  modeSub:   { color: COLORS.sub, fontSize: 11 },

  textBox: {
    borderWidth: 1.5,
    borderRadius: RADIUS.cardSm,
    paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 15, minHeight: 90, textAlignVertical: "top",
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
  },
  questionText: {
    color: COLORS.sub,
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
    color: COLORS.text,
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
    color: COLORS.sub,
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
    color: COLORS.text,
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
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
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
  responderName: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  answerCard: {
    borderRadius: RADIUS.cardSm,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  answerText: {
    color: COLORS.text,
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
    borderColor: COLORS.border,
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
    borderColor: COLORS.border,
  },
  reactEmoji: { fontSize: 18 },
  forfeitBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: `${COLORS.red}15`,
    borderRadius: RADIUS.small,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "center",
  },
  forfeitTxt: { color: COLORS.red, fontSize: 14, fontWeight: "700" },
  nextBtn: { borderRadius: RADIUS.button, paddingVertical: 16, alignItems: "center" },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 1 },

  // ── Sticky bottom ──
  stickyRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
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
    borderTopColor: COLORS.border,
  },
  stickyBtn:      { borderRadius: RADIUS.small, paddingVertical: 15, alignItems: "center" },
  stickyGreen:    { backgroundColor: COLORS.green },
  stickyRed:      { backgroundColor: `${COLORS.red}15`, borderWidth: 1, borderColor: `${COLORS.red}30` },
  stickyDisabled: { opacity: 0.35 },
  stickyBtnTxt:   { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 1 },

  submitBtn: {
    flex: 1,
    borderRadius: RADIUS.button,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: COLORS.green,
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 1 },
  forfeitBtn: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.small,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.red}15`,
    borderWidth: 1,
    borderColor: `${COLORS.red}30`,
  },

  // ── Profile Modal ──
  pfOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 32 },
  pfCard: { width: "100%", maxWidth: 300, backgroundColor: COLORS.bg, borderRadius: RADIUS.cardSm, borderWidth: 1, borderColor: COLORS.border, padding: 28, alignItems: "center", ...SHADOWS.glow },
  pfAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: COLORS.purple },
  pfName: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  pfBio: { color: COLORS.sub, fontSize: 13, textAlign: "center", lineHeight: 18 },
  pfAddBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.purple, borderRadius: RADIUS.button, paddingVertical: 10, paddingHorizontal: 20, width: "100%", justifyContent: "center" },
  pfAddTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
