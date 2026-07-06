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

function PlayerBar({ players, currentTurn, playerName, profilePic }: {
  players: { id: string; name: string }[];
  currentTurn: number;
  playerName: string | null;
  profilePic: string | null;
}) {
  const { gameMood } = useGame();
  const moodCfg = getMoodConfig(gameMood);
  if (players.length < 2) return null;
  const p0 = players[0];
  const p1 = players[1];
  const active0 = currentTurn === 0;
  const active1 = currentTurn === 1;

  const Avatar = ({ player, active }: { player: { name: string; profilePic?: string | null }; active: boolean }) => {
    const isMe = player.name === playerName;
    const pic = isMe ? profilePic : player.profilePic;
    return pic
      ? <Image source={{ uri: pic }} style={[pb.avatar, { borderColor: moodCfg.color }, active && { borderColor: moodCfg.color, ...SHADOWS.glow }]} />
      : (
        <View style={[pb.avatar, { backgroundColor: active ? moodCfg.color : "rgba(255,255,255,0.06)" }]}>
          <Text style={[pb.avatarTxt, { color: active ? "#fff" : COLORS.sub }]}>
            {player.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      );
  };

  return (
    <View style={pb.bar}>
      <View style={[pb.slot, { alignItems: "flex-start" }]}>
        <Avatar player={p0} active={active0} />
        <Text style={[pb.name, active0 && pb.nameOn]} numberOfLines={1}>
          {p0.name}{p0.name === playerName ? "" : ""}
        </Text>
        {active0 && <Text style={[pb.turnTag, { color: moodCfg.color }]}>● TURN</Text>}
      </View>

      <View style={[pb.vsWrap, { backgroundColor: `${moodCfg.color}20`, borderColor: `${moodCfg.color}40` }]}>
        <Text style={[pb.vsText, { color: moodCfg.color }]}>VS</Text>
      </View>

      <View style={[pb.slot, { alignItems: "flex-end" }]}>
        <Avatar player={p1} active={active1} />
        <Text style={[pb.name, active1 && pb.nameOn]} numberOfLines={1}>
          {p1.name}{p1.name === playerName ? "" : ""}
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
    paddingVertical: 14,
    ...SHADOWS.subtle,
    backgroundColor: "rgba(23, 19, 50, 0.7)",
  },
  slot: { flex: 1, gap: 3 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarTxt: { fontSize: 13, fontWeight: "800" },
  name: { fontSize: 12, fontWeight: "700", color: COLORS.subAlt, maxWidth: 90 },
  nameOn: { color: COLORS.text },
  turnTag: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  vsWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  vsText: { fontSize: 11, fontWeight: "900" },
});

function Timer({ seconds }: { seconds: number }) {
  const { gameMood } = useGame();
  const moodCfg = getMoodConfig(gameMood);
  const urgent = seconds <= 10;
  const pct = seconds / 60;
  return (
    <View style={ti.wrap}>
      <Text style={[ti.time, { color: moodCfg.color }, urgent && { color: COLORS.red }]}>
        {urgent ? "🔥 " : "⏱ "}
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
      </Text>
      <View style={[ti.track, { backgroundColor: `${moodCfg.color}20` }]}>
        <View style={[ti.fill, { width: `${pct * 100}%` as any, backgroundColor: urgent ? COLORS.red : moodCfg.color }]} />
      </View>
    </View>
  );
}
const ti = StyleSheet.create({
  wrap:  { alignItems: "center", gap: 6, marginBottom: 8 },
  time:  { fontSize: 30, fontWeight: "800" },
  track: { width: 140, height: 5, borderRadius: 3, overflow: "hidden" },
  fill:  { height: "100%", borderRadius: 3 },
});

function ModeBadge({ mode }: { mode: "truth" | "dare" | null }) {
  const { gameMood } = useGame();
  const moodCfg = getMoodConfig(gameMood);
  if (!mode) return null;
  const isTruth = mode === "truth";
  return (
    <View style={[mb.badge, { backgroundColor: `${moodCfg.color}20`, borderColor: moodCfg.color }]}>
      <Text style={[mb.text, { color: moodCfg.color }]}>
        {isTruth ? "👁  TRUTH" : "🔥  DARE"}
      </Text>
    </View>
  );
}
const mb = StyleSheet.create({
  badge: { borderRadius: RADIUS.small, paddingHorizontal: 18, paddingVertical: 7, alignSelf: "center", borderWidth: 1.5 },
  text:  { fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },
});

function WaitChip({ name }: { name: string | null }) {
  const { gameMood } = useGame();
  const moodCfg = getMoodConfig(gameMood);
  return (
    <View style={[wc.chip, { backgroundColor: `${moodCfg.color}15` }]}>
      <ActivityIndicator size="small" color={moodCfg.color} />
      <Text style={wc.text}>Waiting on <Text style={[wc.name, { color: moodCfg.color }]}>{name}</Text>…</Text>
    </View>
  );
}
const wc = StyleSheet.create({
  chip: {
    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginTop: 8,
  },
  text: { color: COLORS.sub, fontSize: 13 },
  name: { fontWeight: "700" },
});

export default function GameScreen() {
  const {
    players, currentTurn, phase, currentMode, currentQuestion,
    answer, media, answerMediaList, playerName, chooserName,
    askerName, responderName, profilePic, chooseMode, submitQuestion,
    submitAnswer, submitMedia, nextRound, quitGame, forfeit, gameMood,
  } = useGame();
  const moodCfg = getMoodConfig(gameMood);

  const [inputQ, setInputQ]       = useState("");
  const [qMedia, setQMedia]       = useState<SelectedMedia[]>([]);
  const [showQMedia, setShowQMedia] = useState(false);
  const [showQPicker, setShowQPicker] = useState(false);
  const [inputA, setInputA]       = useState("");
  const [aMedia, setAMedia]       = useState<SelectedMedia[]>([]);
  const [showAMedia, setShowAMedia] = useState(false);
  const [timer, setTimer]         = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chooserName_ = chooserName ?? players[currentTurn]?.name ?? null;
  const isMyTurn     = !!playerName && playerName === chooserName_;
  const askerName_   = askerName ?? (players.length === 2 ? players[1 - currentTurn]?.name : null);
  const isMyQ        = !!playerName && playerName === askerName_;
  const canSendQ     = inputQ.trim().length > 0 || qMedia.length > 0;
  const canSendA     = inputA.trim().length > 0 || aMedia.length > 0;

  useEffect(() => {
    if (phase === "answering") {
      setTimer(60);
      timerRef.current = setInterval(() =>
        setTimer(p => { if (p <= 1) { clearInterval(timerRef.current!); return 0; } return p - 1; }), 1000);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => { if (phase === "answering" && isMyTurn && timer === 0) forfeit(); }, [timer, phase, isMyTurn]);

  useEffect(() => {
    if (phase === "choosing") {
      setInputQ(""); setQMedia([]); setShowQMedia(false);
      setInputA(""); setAMedia([]); setShowAMedia(false);
    }
  }, [phase]);

  const handleQuit  = () => Alert.alert("Quit Game", "Are you sure?", [{ text: "Cancel" }, { text: "Quit", onPress: quitGame, style: "destructive" }]);
  const handleSendQ = () => {
    if (!canSendQ) return;
    submitQuestion(inputQ);
    qMedia.forEach(m => submitMedia(m.type, m.base64));
    setInputQ(""); setQMedia([]); setShowQMedia(false);
  };
  const handleSendA = () => {
    if (!canSendA) return;
    submitAnswer(inputA, aMedia.length > 0 ? aMedia.map(m => ({ type: m.type, base64: m.base64 })) : undefined);
    setInputA(""); setAMedia([]); setShowAMedia(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.flex}>

        <View style={s.topBar}>
          <TouchableOpacity onPress={handleQuit} style={s.topBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[s.topBtnTxt, { color: moodCfg.color }]}>←</Text>
          </TouchableOpacity>
          <Text style={s.topTitle}>Truth or Dare</Text>
          <View style={{ width: 36 }} />
        </View>

        <PlayerBar players={players} currentTurn={currentTurn} playerName={playerName} profilePic={profilePic} />

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >

          {phase === "choosing" && isMyTurn && (
            <View style={s.centerFill}>
              <Text style={s.phaseLabel}>Your turn — pick one</Text>
              <View style={s.modeRow}>
                <TouchableOpacity style={[s.modeCard, { backgroundColor: `${moodCfg.color}15`, borderColor: moodCfg.color }]} onPress={() => chooseMode("truth")} activeOpacity={0.82}>
                  <Text style={s.modeEmoji}>👁</Text>
                  <Text style={[s.modeWord, { color: moodCfg.color }]}>TRUTH</Text>
                  <Text style={s.modeSub}>Answer honestly</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modeCard, { backgroundColor: `${moodCfg.accentColor}15`, borderColor: moodCfg.accentColor }]} onPress={() => chooseMode("dare")} activeOpacity={0.82}>
                  <Text style={s.modeEmoji}>🔥</Text>
                  <Text style={[s.modeWord, { color: moodCfg.accentColor }]}>DARE</Text>
                  <Text style={s.modeSub}>Accept challenge</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {phase === "choosing" && !isMyTurn && (
            <View style={s.centerFill}>
              <ActivityIndicator size="large" color={moodCfg.color} />
              <Text style={s.waitTitle}>{chooserName_} is choosing…</Text>
              <Text style={s.waitSub}>Truth or Dare?</Text>
            </View>
          )}

          {phase === "question_set" && isMyQ && (
            <View style={s.section}>
              <ModeBadge mode={currentMode} />
              <Text style={s.phaseLabel}>
                {currentMode === "truth" ? `Ask ${chooserName_} a question` : `Give ${chooserName_} a dare`}
              </Text>
              <TouchableOpacity style={[s.browseBtn, { backgroundColor: `${moodCfg.color}15`, borderColor: `${moodCfg.color}30` }]} onPress={() => setShowQPicker(true)} activeOpacity={0.85}>
                <Text style={[s.browseBtnText, { color: moodCfg.color }]}>🃏  Browse Question Bank & Community</Text>
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
              <ModeBadge mode={currentMode} />
              <ActivityIndicator size="large" color={moodCfg.color} style={{ marginTop: 16 }} />
              <Text style={s.waitTitle}>
                {currentMode === "truth" ? "Waiting for question…" : "Waiting for dare…"}
              </Text>
            </View>
          )}

          {phase === "answering" && isMyTurn && (
            <View style={s.section}>
              <Timer seconds={timer} />
              <View style={s.qCard}>
                <ModeBadge mode={currentMode} />
                <Text style={s.qText}>{currentQuestion}</Text>
                {media.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {media.map((m, i) => <View key={i} style={{ marginRight: 8 }}><MediaDisplay media={m} size="medium" /></View>)}
                  </ScrollView>
                )}
              </View>
              <TextInput
                style={[s.textBox, { borderColor: moodCfg.borderColor }]}
                placeholder={currentMode === "truth" ? "Tell the truth…" : "Describe what you did…"}
                placeholderTextColor={COLORS.subAlt}
                value={inputA}
                onChangeText={setInputA}
                multiline
              />
            </View>
          )}

          {phase === "answering" && !isMyTurn && (
            <View style={s.centerFill}>
              <Timer seconds={timer} />
              <View style={s.qCard}>
                <ModeBadge mode={currentMode} />
                <Text style={s.qText}>{currentQuestion}</Text>
                {media.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {media.map((m, i) => <View key={i} style={{ marginRight: 8 }}><MediaDisplay media={m} size="medium" /></View>)}
                  </ScrollView>
                )}
                <WaitChip name={responderName} />
              </View>
            </View>
          )}

          {phase === "reveal" && (
            <View style={s.section}>
              <Text style={s.revealTitle}>🎭 Round Results</Text>

              <View style={[s.recapCard, { backgroundColor: `${moodCfg.color}15`, borderColor: `${moodCfg.color}30` }]}>
                <ModeBadge mode={currentMode} />
                <Text style={s.recapQ}>{currentQuestion}</Text>
              </View>

              <View style={[s.resultCard, { borderColor: moodCfg.borderColor }]}>
                <View style={s.responderPill}>
                  <View style={[s.responderAvatar, { backgroundColor: moodCfg.color }]}>
                    <Text style={s.responderAvatarTxt}>{responderName?.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={s.responderName}>{responderName}</Text>
                </View>

                {(answer || answerMediaList.length > 0) ? (
                  <>
                    {answer ? <Text style={s.answerTxt}>{answer}</Text> : null}
                    {answerMediaList.length > 0 && (
                      <View style={{ gap: 10, marginTop: 12, width: "100%" }}>
                        {answerMediaList.map((m, i) => (
                          <MediaDisplay key={i} media={{ type: m.type, data: m.data, playerName: m.playerName }} size="large" />
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <View style={s.forfeitBadge}>
                    <Text style={s.forfeitTxt}>🏳️  Forfeited this round</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={[s.nextBtn, { backgroundColor: moodCfg.color }]} onPress={nextRound} activeOpacity={0.85}>
                <Text style={s.nextBtnTxt}>Next Round  →</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {phase === "question_set" && isMyQ && (
          <View style={s.sticky}>
            {showQMedia && <MediaPicker selected={qMedia} onChange={setQMedia} />}
            <View style={s.stickyRow}>
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${COLORS.purple}15`, borderColor: COLORS.border }]} onPress={() => setShowQMedia(v => !v)} activeOpacity={0.82}>
                <Text style={s.attachBtnIcon}>📎</Text>
                {qMedia.length > 0 && <View style={[s.badge, { backgroundColor: moodCfg.color }]}><Text style={s.badgeTxt}>{qMedia.length}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.stickyBtn, { backgroundColor: moodCfg.color, flex: 1 }, !canSendQ && s.stickyDisabled]}
                onPress={handleSendQ}
                disabled={!canSendQ}
                activeOpacity={0.85}
              >
                <Text style={s.stickyBtnTxt}>
                  {currentMode === "truth" ? "📨  Send Question" : "🎯  Send Dare"}
                  {qMedia.length > 0 ? `  (${qMedia.length})` : ""}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {phase === "answering" && isMyTurn && (
          <View style={s.sticky}>
            {showAMedia && <MediaPicker selected={aMedia} onChange={setAMedia} />}
            <View style={s.stickyRow}>
              <TouchableOpacity style={[s.attachBtn, { backgroundColor: `${COLORS.purple}15`, borderColor: COLORS.border }]} onPress={() => setShowAMedia(v => !v)} activeOpacity={0.82}>
                <Text style={s.attachBtnIcon}>📸</Text>
                {aMedia.length > 0 && <View style={[s.badge, { backgroundColor: COLORS.green }]}><Text style={s.badgeTxt}>{aMedia.length}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.stickyBtn, s.stickyGreen, { flex: 1 }, !canSendA && s.stickyDisabled]}
                onPress={handleSendA}
                disabled={!canSendA}
                activeOpacity={0.85}
              >
                <Text style={s.stickyBtnTxt}>
                  {aMedia.length > 0 && !inputA.trim()
                    ? `✓  Send ${aMedia.length} file${aMedia.length > 1 ? "s" : ""}`
                    : "✓  Submit Answer"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.stickyBtn, s.stickyRed, { paddingHorizontal: 16 }]} onPress={forfeit} activeOpacity={0.85}>
                <Text style={[s.stickyBtnTxt, { color: COLORS.red }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.bg },
  flex:  { flex: 1 },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  topBtn:    { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, borderWidth: 1, borderColor: COLORS.border },
  topBtnTxt: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  topTitle:  { color: COLORS.text, fontSize: 15, fontWeight: "800", letterSpacing: 1 },

  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 },

  centerFill: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 32 },
  section:    { gap: 14 },

  phaseLabel: { color: COLORS.sub, fontSize: 14, textAlign: "center", fontWeight: "600" },
  waitTitle:  { color: COLORS.text, fontSize: 20, fontWeight: "700", textAlign: "center" },
  waitSub:    { color: COLORS.sub, fontSize: 14, textAlign: "center" },

  browseBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: RADIUS.small,
    paddingVertical: 11, paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  browseBtnText: { color: COLORS.purple, fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },

  modeRow: { flexDirection: "row", gap: 14, width: "100%" },
  modeCard: {
    flex: 1, borderRadius: RADIUS.cardSm, paddingVertical: 36,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, gap: 6,
    ...SHADOWS.subtle,
  },
  modeEmoji: { fontSize: 40, marginBottom: 4 },
  modeWord:  { fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  modeSub:   { color: COLORS.sub, fontSize: 11 },

  qCard: {
    borderRadius: RADIUS.cardSm, padding: 20, gap: 10,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.subtle,
    backgroundColor: "rgba(23, 19, 50, 0.7)",
  },
  qText: { color: COLORS.text, fontSize: 18, fontWeight: "800", textAlign: "center", lineHeight: 26 },

  textBox: {
    borderWidth: 1.5,
    borderRadius: RADIUS.cardSm,
    paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 15, minHeight: 90, textAlignVertical: "top",
    backgroundColor: "rgba(23, 19, 50, 0.5)",
  },

  stickyRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  attachBtn:  {
    width: 46, height: 46, borderRadius: RADIUS.small,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  attachBtnIcon: { fontSize: 20 },
  badge:      { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1, minWidth: 20, alignItems: "center" },
  badgeTxt:   { color: "#fff", fontSize: 11, fontWeight: "800" },

  revealTitle: { color: COLORS.text, fontSize: 22, fontWeight: "800", textAlign: "center" },
  recapCard: {
    borderRadius: RADIUS.cardSm, padding: 16, gap: 8,
    borderWidth: 1, alignItems: "center",
  },
  recapQ: { color: COLORS.text, fontSize: 15, fontWeight: "700", textAlign: "center", lineHeight: 22 },
  resultCard: {
    borderRadius: RADIUS.cardSm, padding: 20,
    borderWidth: 1.5, gap: 12,
    ...SHADOWS.subtle,
    backgroundColor: "rgba(23, 19, 50, 0.7)",
  },
  responderPill:      { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "center" },
  responderAvatar:    { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  responderAvatarTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },
  responderName:      { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  answerTxt:          { color: COLORS.sub, fontSize: 15, textAlign: "center", lineHeight: 22 },
  forfeitBadge:       { backgroundColor: `${COLORS.red}20`, borderRadius: RADIUS.small, paddingVertical: 10, paddingHorizontal: 16, alignSelf: "center" },
  forfeitTxt:         { color: COLORS.red, fontSize: 14, fontWeight: "700" },
  nextBtn:            { borderRadius: RADIUS.button, paddingVertical: 16, alignItems: "center" },
  nextBtnTxt:         { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 1 },

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
});
