import { MediaDisplay } from "@/components/MediaDisplay";
import { MediaPicker, SelectedMedia } from "@/components/MediaPicker";
import { QuestionPicker } from "@/components/QuestionPicker";
import { useGame } from "@/contexts/GameContext";
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

const BG       = "#f8faff";
const CARD     = "#ffffff";
const BLUE     = "#3b82f6";
const BLUE_D   = "#1d4ed8";
const BLUE_L   = "#eff6ff";
const BLUE_M   = "#bfdbfe";
const TEXT     = "#0f172a";
const SUB      = "#64748b";
const HINT     = "#94a3b8";
const BORDER   = "#e2e8f0";
const GREEN    = "#059669";
const RED      = "#dc2626";

// ── Player Bar ────────────────────────────────────────────────────────────────
function PlayerBar({ players, currentTurn, playerName, profilePic }: {
  players: { id: string; name: string }[];
  currentTurn: number;
  playerName: string | null;
  profilePic: string | null;
}) {
  if (players.length < 2) return null;
  const p0 = players[0];
  const p1 = players[1];
  const active0 = currentTurn === 0;
  const active1 = currentTurn === 1;

  const Avatar = ({ player, active }: { player: { name: string; profilePic?: string | null }; active: boolean }) => {
    const isMe = player.name === playerName;
    const pic = isMe ? profilePic : player.profilePic;
    return pic
      ? <Image source={{ uri: pic }} style={[pb.avatar, pb.avatarImg, active && pb.avatarImgActive]} />
      : (
        <View style={[pb.avatar, active ? pb.avatarOn : pb.avatarOff]}>
          <Text style={[pb.avatarTxt, active ? pb.avatarTxtOn : pb.avatarTxtOff]}>
            {player.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      );
  };

  return (
    <View style={pb.bar}>
      {/* Player 0 */}
      <View style={[pb.slot, { alignItems: "flex-start" }]}>
        <Avatar player={p0} active={active0} />
        <Text style={[pb.name, active0 && pb.nameOn]} numberOfLines={1}>
          {p0.name}{p0.name === playerName ? " (you)" : ""}
        </Text>
        {active0 && <Text style={pb.turnTag}>● TURN</Text>}
      </View>

      {/* VS chip */}
      <View style={pb.vsWrap}>
        <Text style={pb.vsText}>VS</Text>
      </View>

      {/* Player 1 */}
      <View style={[pb.slot, { alignItems: "flex-end" }]}>
        <Avatar player={p1} active={active1} />
        <Text style={[pb.name, active1 && pb.nameOn]} numberOfLines={1}>
          {p1.name}{p1.name === playerName ? " (you)" : ""}
        </Text>
        {active1 && <Text style={pb.turnTag}>● TURN</Text>}
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  slot: { flex: 1, gap: 3 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  avatarOn:  { backgroundColor: BLUE },
  avatarOff: { backgroundColor: BLUE_L },
  avatarImg: { borderWidth: 2, borderColor: BLUE_M },
  avatarImgActive: { borderColor: BLUE },
  avatarTxt: { fontSize: 13, fontWeight: "800" },
  avatarTxtOn:  { color: "#fff" },
  avatarTxtOff: { color: BLUE_D },
  name: { fontSize: 12, fontWeight: "700", color: SUB, maxWidth: 90 },
  nameOn: { color: TEXT },
  turnTag: { fontSize: 9, fontWeight: "800", color: BLUE, letterSpacing: 0.8 },
  vsWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BLUE_L,
    borderWidth: 1.5,
    borderColor: BLUE_M,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  vsText: { fontSize: 11, fontWeight: "900", color: BLUE_D },
});

// ── Timer ─────────────────────────────────────────────────────────────────────
function Timer({ seconds }: { seconds: number }) {
  const urgent = seconds <= 10;
  const pct = seconds / 60; // shrinks 1→0 as time runs out
  return (
    <View style={ti.wrap}>
      <Text style={[ti.time, urgent && { color: RED }]}>
        {urgent ? "🔥 " : "⏱ "}
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
      </Text>
      <View style={ti.track}>
        <View style={[ti.fill, { width: `${pct * 100}%` as any, backgroundColor: urgent ? RED : BLUE }]} />
      </View>
    </View>
  );
}
const ti = StyleSheet.create({
  wrap:  { alignItems: "center", gap: 6, marginBottom: 8 },
  time:  { color: BLUE, fontSize: 30, fontWeight: "800" },
  track: { width: 140, height: 5, backgroundColor: BLUE_L, borderRadius: 3, overflow: "hidden" },
  fill:  { height: "100%", borderRadius: 3 },
});

// ── Mode Badge ────────────────────────────────────────────────────────────────
function ModeBadge({ mode }: { mode: "truth" | "dare" | null }) {
  if (!mode) return null;
  const isTruth = mode === "truth";
  return (
    <View style={[mb.badge, isTruth ? mb.truth : mb.dare]}>
      <Text style={[mb.text, { color: isTruth ? BLUE_D : "#c2410c" }]}>
        {isTruth ? "👁  TRUTH" : "🔥  DARE"}
      </Text>
    </View>
  );
}
const mb = StyleSheet.create({
  badge: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 7, alignSelf: "center" },
  truth: { backgroundColor: "#eff6ff", borderWidth: 1.5, borderColor: BLUE },
  dare:  { backgroundColor: "#fff7ed", borderWidth: 1.5, borderColor: "#f97316" },
  text:  { fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },
});

// ── Wait Chip ─────────────────────────────────────────────────────────────────
function WaitChip({ name }: { name: string | null }) {
  return (
    <View style={wc.chip}>
      <ActivityIndicator size="small" color={BLUE} />
      <Text style={wc.text}>Waiting on <Text style={wc.name}>{name}</Text>…</Text>
    </View>
  );
}
const wc = StyleSheet.create({
  chip: {
    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center",
    backgroundColor: BLUE_L, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, marginTop: 8,
  },
  text: { color: SUB, fontSize: 13 },
  name: { color: BLUE_D, fontWeight: "700" },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function GameScreen() {
  const {
    players, currentTurn, phase, currentMode, currentQuestion,
    answer, media, answerMediaList, playerName, chooserName,
    askerName, responderName, profilePic, chooseMode, submitQuestion,
    submitAnswer, submitMedia, nextRound, quitGame, forfeit,
  } = useGame();

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

        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={handleQuit} style={s.topBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.topBtnTxt}>←</Text>
          </TouchableOpacity>
          <Text style={s.topTitle}>Truth or Dare</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Player bar — always visible */}
        <PlayerBar players={players} currentTurn={currentTurn} playerName={playerName} profilePic={profilePic} />

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >

          {/* ── CHOOSING — my turn ── */}
          {phase === "choosing" && isMyTurn && (
            <View style={s.centerFill}>
              <Text style={s.phaseLabel}>Your turn — pick one</Text>
              <View style={s.modeRow}>
                <TouchableOpacity style={[s.modeCard, s.modeTruth]} onPress={() => chooseMode("truth")} activeOpacity={0.82}>
                  <Text style={s.modeEmoji}>👁</Text>
                  <Text style={[s.modeWord, { color: BLUE_D }]}>TRUTH</Text>
                  <Text style={s.modeSub}>Answer honestly</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modeCard, s.modeDare]} onPress={() => chooseMode("dare")} activeOpacity={0.82}>
                  <Text style={s.modeEmoji}>🔥</Text>
                  <Text style={[s.modeWord, { color: "#c2410c" }]}>DARE</Text>
                  <Text style={s.modeSub}>Accept challenge</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── CHOOSING — waiting ── */}
          {phase === "choosing" && !isMyTurn && (
            <View style={s.centerFill}>
              <ActivityIndicator size="large" color={BLUE} />
              <Text style={s.waitTitle}>{chooserName_} is choosing…</Text>
              <Text style={s.waitSub}>Truth or Dare?</Text>
            </View>
          )}

          {/* ── QUESTION SET — asker ── */}
          {phase === "question_set" && isMyQ && (
            <View style={s.section}>
              <ModeBadge mode={currentMode} />
              <Text style={s.phaseLabel}>
                {currentMode === "truth" ? `Ask ${chooserName_} a question` : `Give ${chooserName_} a dare`}
              </Text>
              <TouchableOpacity style={s.browseBtn} onPress={() => setShowQPicker(true)} activeOpacity={0.85}>
                <Text style={s.browseBtnText}>🃏  Browse Question Bank & Community</Text>
              </TouchableOpacity>
              <TextInput
                style={s.textBox}
                placeholder={currentMode === "truth" ? "Type your question…" : "Describe the dare…"}
                placeholderTextColor={HINT}
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
                onSelect={(text) => setInputQ(text)}
                onClose={() => setShowQPicker(false)}
              />
            </View>
          )}

          {/* ── QUESTION SET — waiting ── */}
          {phase === "question_set" && !isMyQ && (
            <View style={s.centerFill}>
              <ModeBadge mode={currentMode} />
              <ActivityIndicator size="large" color={BLUE} style={{ marginTop: 16 }} />
              <Text style={s.waitTitle}>
                {currentMode === "truth" ? "Waiting for question…" : "Waiting for dare…"}
              </Text>
            </View>
          )}

          {/* ── ANSWERING — my turn ── */}
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
                style={s.textBox}
                placeholder={currentMode === "truth" ? "Tell the truth…" : "Describe what you did…"}
                placeholderTextColor={HINT}
                value={inputA}
                onChangeText={setInputA}
                multiline
              />
            </View>
          )}

          {/* ── ANSWERING — waiting ── */}
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

          {/* ── REVEAL ── */}
          {phase === "reveal" && (
            <View style={s.section}>
              <Text style={s.revealTitle}>🎭 Round Results</Text>

              {/* Question recap */}
              <View style={s.recapCard}>
                <ModeBadge mode={currentMode} />
                <Text style={s.recapQ}>{currentQuestion}</Text>
              </View>

              {/* Answer card */}
              <View style={s.resultCard}>
                <View style={s.responderPill}>
                  <View style={s.responderAvatar}>
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

              <TouchableOpacity style={s.nextBtn} onPress={nextRound} activeOpacity={0.85}>
                <Text style={s.nextBtnTxt}>Next Round  →</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {/* Sticky — send question */}
        {phase === "question_set" && isMyQ && (
          <View style={s.sticky}>
            {showQMedia && <MediaPicker selected={qMedia} onChange={setQMedia} />}
            <View style={s.stickyRow}>
              <TouchableOpacity style={s.attachBtn} onPress={() => setShowQMedia(v => !v)} activeOpacity={0.82}>
                <Text style={s.attachBtnIcon}>📎</Text>
                {qMedia.length > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{qMedia.length}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.stickyBtn, s.stickyBlue, { flex: 1 }, !canSendQ && s.stickyDisabled]}
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

        {/* Sticky — send answer */}
        {phase === "answering" && isMyTurn && (
          <View style={s.sticky}>
            {showAMedia && <MediaPicker selected={aMedia} onChange={setAMedia} />}
            <View style={s.stickyRow}>
              <TouchableOpacity style={s.attachBtn} onPress={() => setShowAMedia(v => !v)} activeOpacity={0.82}>
                <Text style={s.attachBtnIcon}>📸</Text>
                {aMedia.length > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{aMedia.length}</Text></View>}
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
                <Text style={[s.stickyBtnTxt, { color: RED }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: BG },
  flex:  { flex: 1 },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  topBtn:    { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  topBtnTxt: { color: BLUE, fontSize: 20, fontWeight: "700" },
  topTitle:  { color: TEXT, fontSize: 15, fontWeight: "800", letterSpacing: 1 },

  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 },

  // fills remaining height so content can be vertically centered
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 32 },
  section:    { gap: 14 },

  phaseLabel: { color: SUB, fontSize: 14, textAlign: "center", fontWeight: "600" },
  waitTitle:  { color: TEXT, fontSize: 20, fontWeight: "700", textAlign: "center" },
  waitSub:    { color: SUB, fontSize: 14, textAlign: "center" },

  // Browse question picker button
  browseBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: BLUE_L, borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: BLUE_M,
  },
  browseBtnText: { color: BLUE_D, fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },

  // Mode cards
  modeRow: { flexDirection: "row", gap: 14, width: "100%" },
  modeCard: {
    flex: 1, borderRadius: 20, paddingVertical: 36,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, gap: 6,
  },
  modeTruth: { backgroundColor: "#eff6ff", borderColor: BLUE },
  modeDare:  { backgroundColor: "#fff7ed", borderColor: "#f97316" },
  modeEmoji: { fontSize: 40, marginBottom: 4 },
  modeWord:  { fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  modeSub:   { color: SUB, fontSize: 11 },

  // Question card
  qCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 20, gap: 10,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#94a3b8", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  qText: { color: TEXT, fontSize: 18, fontWeight: "800", textAlign: "center", lineHeight: 26 },

  textBox: {
    backgroundColor: CARD, borderWidth: 1.5, borderColor: BLUE_M,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    color: TEXT, fontSize: 15, minHeight: 90, textAlignVertical: "top",
  },

  stickyRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  attachBtn:  {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: BLUE_L, borderWidth: 1, borderColor: BLUE_M,
    alignItems: "center", justifyContent: "center",
  },
  attachBtnIcon: { fontSize: 20 },
  badge:      { backgroundColor: BLUE, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1, minWidth: 20, alignItems: "center" },
  badgeTxt:   { color: "#fff", fontSize: 11, fontWeight: "800" },

  // Reveal
  revealTitle: { color: TEXT, fontSize: 22, fontWeight: "800", textAlign: "center" },
  recapCard: {
    backgroundColor: BLUE_L, borderRadius: 14, padding: 16, gap: 8,
    borderWidth: 1, borderColor: BLUE_M, alignItems: "center",
  },
  recapQ: { color: TEXT, fontSize: 15, fontWeight: "700", textAlign: "center", lineHeight: 22 },
  resultCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 20,
    borderWidth: 1.5, borderColor: BLUE_M, gap: 12,
    shadowColor: "#bfdbfe", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 2,
  },
  responderPill:      { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "center" },
  responderAvatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" },
  responderAvatarTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },
  responderName:      { color: TEXT, fontSize: 16, fontWeight: "800" },
  answerTxt:          { color: SUB, fontSize: 15, textAlign: "center", lineHeight: 22 },
  forfeitBadge:       { backgroundColor: "#fef2f2", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignSelf: "center" },
  forfeitTxt:         { color: RED, fontSize: 14, fontWeight: "700" },
  nextBtn:            { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  nextBtnTxt:         { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 1 },

  // Sticky bar
  sticky: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER, gap: 8,
  },
  stickyBtn:      { borderRadius: 13, paddingVertical: 15, alignItems: "center" },
  stickyBlue:     { backgroundColor: BLUE },
  stickyGreen:    { backgroundColor: GREEN },
  stickyRed:      { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  stickyDisabled: { opacity: 0.35 },
  stickyBtnTxt:   { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
});
