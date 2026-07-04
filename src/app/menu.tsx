import { useGame } from "@/contexts/GameContext";
import { Interest, useProfile } from "@/contexts/ProfileContext";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Easing, Image,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#f8faff", CARD = "#ffffff", BLUE = "#3b82f6";
const BLUE_D = "#1d4ed8", BLUE_L = "#eff6ff", BLUE_M = "#bfdbfe";
const TEXT = "#0f172a", SUB = "#64748b", HINT = "#94a3b8", BORDER = "#e2e8f0";

const INTEREST_META: { key: Interest; label: string; emoji: string; color: string }[] = [
  { key: "fun",     label: "Fun & Laughs",  emoji: "😂", color: "#f59e0b" },
  { key: "life",    label: "Life Talks",    emoji: "💬", color: "#10b981" },
  { key: "hot",     label: "Hot & Flirty",  emoji: "🔥", color: "#ef4444" },
  { key: "connect", label: "Get in Touch",  emoji: "🤝", color: "#8b5cf6" },
  { key: "spicy",   label: "Spicy 🌶",      emoji: "🌶", color: "#f97316" },
  { key: "deep",    label: "Deep Talks",    emoji: "🌊", color: "#0ea5e9" },
];

function SearchingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((v, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 160),
        Animated.timing(v, { toValue: 1, duration: 350, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 350, easing: Easing.ease, useNativeDriver: true }),
        Animated.delay(480 - i * 160),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
      {dots.map((v, i) => (
        <Animated.View key={i} style={{
          width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE,
          opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] }) }],
        }} />
      ))}
    </View>
  );
}

type ScreenMode = "home" | "profile" | "random_waiting" | "private_join" | "private_waiting_creator" | "private_waiting_joiner";

export default function MenuScreen({ onNavigate }: { onNavigate?: (screen: "questions" | "community") => void }) {
  const { createRoom, autoJoin, joinRoom, roomId, players, isConnected, phase, reconnect, error, quitGame, setInterests } = useGame();
  const { profile, isProfileReady, setName, setBio, setPic, toggleInterest, usernameStatus, setUsername, checkUsername } = useProfile();
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<ScreenMode>("home");
  const [joining, setJoining] = useState(false);

  // Sync interests to GameContext whenever profile changes
  useEffect(() => { setInterests(profile.interests); }, [profile.interests]);

  useEffect(() => { if (phase === "menu") { setMode("home"); setJoining(false); setCode(""); } }, [phase]);
  useEffect(() => { if (error && joining) { Alert.alert("Oops", error); setJoining(false); setMode("home"); } }, [error, joining]);

  const pickPic = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Allow photo access for profile picture."); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true });
    if (!r.canceled && r.assets[0]) {
      const a = r.assets[0];
      setPic(a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri);
    }
  };

  const guard = (fn: () => void) => {
    if (!isProfileReady) { Alert.alert("Profile required", "Please set up your profile first."); return; }
    if (!isConnected) { Alert.alert("Not connected", "Connecting to server... please wait a moment."); reconnect(); return; }
    fn();
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 110 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={s.hero}>
            <View style={s.heroIconWrap}><Text style={s.heroIcon}>🎭</Text></View>
            <Text style={s.heroTitle}>Truth or Dare</Text>
            <Text style={s.heroSub}>Online · 2 Players · Spicy</Text>
            {/* Connection dot inline — auto reconnects, no ugly banner */}
            <View style={s.connDot}>
              <View style={[s.dot, { backgroundColor: isConnected ? "#22c55e" : "#f59e0b" }]} />
              <Text style={s.connTxt}>{isConnected ? "Online" : "Connecting..."}</Text>
            </View>
          </View>

          {/* Profile not set banner — RED */}
          {!isProfileReady && mode === "home" && (
            <TouchableOpacity style={s.profileBannerRed} onPress={() => setMode("profile")} activeOpacity={0.85}>
              <Text style={s.profileBannerIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.profileBannerTitleRed}>Please set up your profile first</Text>
                <Text style={s.profileBannerSubRed}>Tap here to set your name before playing</Text>
              </View>
              <Text style={{ color: "#dc2626", fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          )}

          {/* HOME */}
          {mode === "home" && (
            <View style={s.card}>
              <View style={s.homeCard}>
                <Text style={s.homeCardTitle}>Ready to play?</Text>
                <Text style={s.homeCardText}>Jump into a quick match or invite a friend.</Text>
              </View>
              <TouchableOpacity style={[s.btnFill, (!isProfileReady) && s.disabled]} onPress={() => guard(() => { setJoining(true); autoJoin(profile.name.trim()); setMode("random_waiting"); })} activeOpacity={0.82}>
                <View style={s.btnFillLeft}><Text style={s.btnFillEmoji}>⚡</Text><View><Text style={s.btnFillTitle}>Random Matchup</Text><Text style={s.btnFillSub}>Match with a stranger instantly</Text></View></View>
                <Text style={s.btnArrow}>›</Text>
              </TouchableOpacity>
              <View style={s.divider}><View style={s.divLine} /><Text style={s.divText}>or</Text><View style={s.divLine} /></View>
              <TouchableOpacity style={[s.btnGhost, !isProfileReady && s.disabled]} onPress={() => guard(() => setMode("private_join"))} activeOpacity={0.82}>
                <View style={s.btnFillLeft}><Text style={s.btnFillEmoji}>🔒</Text><View><Text style={s.btnGhostTitle}>Private Game</Text><Text style={s.btnGhostSub}>Play with a specific friend</Text></View></View>
                <Text style={[s.btnArrow, { color: BLUE }]}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PROFILE */}
          {mode === "profile" && (
            <View style={s.profileCard}>
              {/* Avatar */}
              <TouchableOpacity onPress={pickPic} activeOpacity={0.8} style={s.profilePicWrap}>
                {profile.pic ? (
                  <Image source={{ uri: profile.pic }} style={s.profilePic} />
                ) : (
                  <View style={s.profilePicEmpty}>
                    <Text style={{ fontSize: 36 }}>🎮</Text>
                  </View>
                )}
                <View style={s.profilePicBadge}><Text style={{ fontSize: 10 }}>✏️</Text></View>
              </TouchableOpacity>

              {/* Name */}
              <TextInput
                style={s.profileNameInput}
                placeholder="Your Name"
                placeholderTextColor="#cbd5e1"
                value={profile.name}
                onChangeText={setName}
                autoCapitalize="words"
                maxLength={20}
                textAlign="center"
              />

              {/* Username */}
              <View style={s.profileUsernameRow}>
                <Text style={s.profileUsernameAt}>@</Text>
                <TextInput
                  style={s.profileUsernameInput}
                  placeholder="username"
                  placeholderTextColor="#cbd5e1"
                  value={profile.username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  onEndEditing={checkUsername}
                />
                {usernameStatus === "checking" && <ActivityIndicator size="small" color={BLUE} />}
                {usernameStatus === "available" && <Text style={{ color: "#10b981", fontSize: 16 }}>✓</Text>}
                {usernameStatus === "saved" && <Text style={{ color: "#10b981", fontSize: 16 }}>✓</Text>}
                {usernameStatus === "taken" && <Text style={{ color: "#dc2626", fontSize: 16 }}>✗</Text>}
              </View>

              {/* Bio */}
              <TextInput
                style={s.profileBioInput}
                placeholder="Write a short bio..."
                placeholderTextColor="#cbd5e1"
                value={profile.bio}
                onChangeText={setBio}
                multiline
                maxLength={80}
                textAlign="center"
              />

              <View style={s.profileSpacer} />

              {/* Interests */}
              <Text style={s.profileSectionLabel}>INTERESTS</Text>
              <View style={s.profileChips}>
                {INTEREST_META.map(({ key, label, emoji, color }) => {
                  const active = profile.interests.includes(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[s.chip, active && { backgroundColor: color }]}
                      onPress={() => toggleInterest(key)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.chipEmoji}>{emoji}</Text>
                      <Text style={[s.chipLabel, active && { color: "#fff" }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {profile.pic && (
                <TouchableOpacity onPress={() => setPic(null)} style={{ alignSelf: "center", marginTop: -4 }}>
                  <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>Remove photo</Text>
                </TouchableOpacity>
              )}

              <View style={s.profileSpacer} />

              {isProfileReady && (
                <TouchableOpacity style={s.profileSaveBtn} onPress={() => setMode("home")} activeOpacity={0.85}>
                  <Text style={s.profileSaveBtnText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* RANDOM SEARCHING */}
          {mode === "random_waiting" && (
            <View style={s.card}>
              <View style={s.stateBlock}>
                <View style={s.pulseRing}><Text style={{ fontSize: 36 }}>🔍</Text></View>
                <Text style={s.stateTitle}>Finding opponent...</Text>
                <Text style={s.stateSub}>Playing as <Text style={s.nameTag}>{profile.name}</Text></Text>
                {profile.interests.length > 0 && (
                  <Text style={s.stateHint}>Matching on: {profile.interests.map(i => INTEREST_META.find(m => m.key === i)?.emoji).join(" ")}</Text>
                )}
                <SearchingDots />
                <Text style={s.stateHint}>{players.length === 2 ? "✓ Found! Starting game..." : "Scanning for available players"}</Text>
              </View>
              <TouchableOpacity style={s.btnDanger} onPress={() => { quitGame(); setMode("home"); setJoining(false); }} activeOpacity={0.82}>
                <Text style={s.btnDangerText}>Cancel Search</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PRIVATE JOIN/CREATE */}
          {mode === "private_join" && (
            <View style={s.card}>
              <TouchableOpacity onPress={() => setMode("home")} style={s.backBtn}><Text style={s.backBtnText}>← Back</Text></TouchableOpacity>
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>ENTER ROOM CODE</Text>
                <View style={[s.inputBox, s.codeBox]}>
                  <TextInput style={s.codeInput} placeholder="A B C" placeholderTextColor={HINT} value={code} onChangeText={t => setCode(t.toUpperCase().replace(/[^A-Z]/g, ""))} autoCapitalize="characters" maxLength={3} autoFocus />
                </View>
              </View>
              <TouchableOpacity style={[s.btnFill, code.length < 3 && s.disabled]} onPress={() => { if (!isConnected) { reconnect(); return; } setJoining(true); joinRoom(code, profile.name.trim()); setMode("private_waiting_joiner"); }} disabled={code.length < 3 || joining} activeOpacity={0.82}>
                {joining ? <ActivityIndicator color="#fff" /> : <Text style={[s.btnFillTitle, { textAlign: "center", flex: 1 }]}>Join Room</Text>}
              </TouchableOpacity>
              <View style={s.divider}><View style={s.divLine} /><Text style={s.divText}>or</Text><View style={s.divLine} /></View>
              <TouchableOpacity style={s.btnGhost} onPress={() => { if (!isConnected) { reconnect(); return; } createRoom(profile.name.trim()); setMode("private_waiting_creator"); }} activeOpacity={0.82}>
                <View style={s.btnFillLeft}><Text style={s.btnFillEmoji}>✨</Text><View><Text style={s.btnGhostTitle}>Create New Room</Text><Text style={s.btnGhostSub}>Get a code to share</Text></View></View>
                <Text style={[s.btnArrow, { color: BLUE }]}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CREATOR WAITING */}
          {mode === "private_waiting_creator" && (
            <View style={s.card}>
              <View style={s.stateBlock}>
                <Text style={{ fontSize: 44, marginBottom: 4 }}>🎉</Text>
                <Text style={s.stateTitle}>Room Ready!</Text>
                <Text style={s.stateSub}>Share this code with your friend</Text>
                <View style={s.codeCard}>
                  <Text style={s.codeCardLabel}>ROOM CODE</Text>
                  <Text style={s.codeCardValue}>{roomId ?? "···"}</Text>
                </View>
                <View style={s.waitRow}>
                  <ActivityIndicator size="small" color={BLUE} />
                  <Text style={s.waitRowText}>{players.length === 2 ? "Friend joined! Starting..." : "Waiting for friend..."}</Text>
                </View>
              </View>
              <TouchableOpacity style={s.btnDanger} onPress={() => { quitGame(); setMode("home"); }} activeOpacity={0.82}>
                <Text style={s.btnDangerText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* JOINER WAITING */}
          {mode === "private_waiting_joiner" && (
            <View style={s.card}>
              <View style={s.stateBlock}>
                <Text style={{ fontSize: 44, marginBottom: 4 }}>⏳</Text>
                <Text style={s.stateTitle}>Joining room...</Text>
                <Text style={s.stateSub}>Code: <Text style={s.nameTag}>{code}</Text></Text>
                <ActivityIndicator size="large" color={BLUE} style={{ marginTop: 16 }} />
                <Text style={s.stateHint}>{players.length === 2 ? "✓ Connected! Starting..." : "Connecting..."}</Text>
              </View>
              <TouchableOpacity style={s.btnDanger} onPress={() => { quitGame(); setMode("home"); setJoining(false); setCode(""); }} activeOpacity={0.82}>
                <Text style={s.btnDangerText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={s.footer}>SWOYEF LABS</Text>
        </ScrollView>

        {/* Bottom Nav */}
        <View style={s.bottomNav}>
          {[
            { key: "home",      label: "Home",      emoji: "🏠" },
            { key: "profile",   label: "Profile",   emoji: "👤" },
            { key: "questions", label: "Questions", emoji: "🃏" },
            { key: "community", label: "Community", emoji: "📣" },
          ].map(tab => {
            const isActive = tab.key === mode || (tab.key === "questions" && mode === "home" && false);
            const isExternal = tab.key === "questions" || tab.key === "community";
            return (
              <TouchableOpacity key={tab.key} style={[s.navItem, (mode === tab.key) && s.navItemActive]}
                onPress={() => {
                  if (isExternal) { onNavigate?.(tab.key as "questions" | "community"); }
                  else { setMode(tab.key as ScreenMode); }
                }} activeOpacity={0.85}>
                <Text style={s.navIcon}>{tab.emoji}</Text>
                <Text style={[s.navLabel, (mode === tab.key) && s.navLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  hero: { alignItems: "center", paddingTop: 48, paddingBottom: 28 },
  heroIconWrap: { width: 88, height: 88, borderRadius: 28, backgroundColor: BLUE_L, borderWidth: 2, borderColor: BLUE_M, alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  heroIcon: { fontSize: 44 },
  heroTitle: { fontSize: 30, fontWeight: "900", color: TEXT, letterSpacing: 0.5 },
  heroSub: { fontSize: 13, color: SUB, marginTop: 4 },
  connDot: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  connTxt: { fontSize: 11, color: HINT },
  profileBannerRed: { backgroundColor: "#fef2f2", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14, borderWidth: 1.5, borderColor: "#fca5a5" },
  profileBannerIcon: { fontSize: 32 },
  profileBannerTitleRed: { color: "#dc2626", fontSize: 14, fontWeight: "800" },
  profileBannerSubRed: { color: "#ef4444", fontSize: 12, marginTop: 2 },
  card: { backgroundColor: CARD, borderRadius: 20, padding: 20, gap: 14, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3, marginBottom: 16 },
  homeCard: { backgroundColor: BLUE_L, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BLUE_M, gap: 4 },
  homeCardTitle: { color: BLUE_D, fontSize: 16, fontWeight: "800" },
  homeCardText: { color: SUB, fontSize: 12, lineHeight: 18 },
  btnFill: { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  btnFillLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  btnFillEmoji: { fontSize: 24 },
  btnFillTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  btnFillSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
  btnArrow: { color: "rgba(255,255,255,0.8)", fontSize: 22, fontWeight: "300" },
  btnGhost: { backgroundColor: BLUE_L, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderColor: BLUE_M },
  btnGhostTitle: { color: BLUE_D, fontSize: 15, fontWeight: "800" },
  btnGhostSub: { color: SUB, fontSize: 12, marginTop: 1 },
  disabled: { opacity: 0.38 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: BORDER },
  divText: { color: HINT, fontSize: 12, fontWeight: "600" },
  stateBlock: { alignItems: "center", paddingVertical: 16, gap: 8 },
  pulseRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: BLUE_L, borderWidth: 2, borderColor: BLUE_M, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  stateTitle: { color: TEXT, fontSize: 20, fontWeight: "800" },
  stateSub: { color: SUB, fontSize: 13 },
  stateHint: { color: HINT, fontSize: 12, textAlign: "center", marginTop: 2 },
  nameTag: { color: BLUE, fontWeight: "800" },
  codeCard: { backgroundColor: BLUE_L, borderRadius: 16, paddingHorizontal: 36, paddingVertical: 18, alignItems: "center", marginTop: 8, borderWidth: 2, borderColor: BLUE_M },
  codeCardLabel: { color: SUB, fontSize: 10, fontWeight: "800", letterSpacing: 3, marginBottom: 4 },
  codeCardValue: { color: BLUE_D, fontSize: 48, fontWeight: "900", letterSpacing: 12 },
  waitRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  waitRowText: { color: SUB, fontSize: 13 },
  backBtn: { alignSelf: "flex-start" },
  backBtnText: { color: BLUE, fontSize: 13, fontWeight: "700" },
  btnDanger: { borderRadius: 12, paddingVertical: 13, alignItems: "center", backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  btnDangerText: { color: "#dc2626", fontSize: 14, fontWeight: "700" },
  fieldWrap: { gap: 8 },
  fieldLabel: { fontSize: 10, fontWeight: "800", color: HINT, letterSpacing: 2 },
  inputBox: { backgroundColor: BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: BLUE_M },
  codeBox: { justifyContent: "center" },
  codeInput: { flex: 1, color: BLUE_D, fontSize: 28, fontWeight: "900", letterSpacing: 12, textAlign: "center" },
  profileCard: {
    backgroundColor: CARD, borderRadius: 24,
    paddingHorizontal: 32, paddingVertical: 40,
    alignItems: "center", gap: 0,
    shadowColor: "#94a3b8", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
    marginBottom: 16,
  },
  profilePicWrap: { position: "relative", marginBottom: 20 },
  profilePic: { width: 96, height: 96, borderRadius: 48 },
  profilePicEmpty: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
  },
  profilePicBadge: {
    position: "absolute", bottom: 0, right: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#e2e8f0", borderWidth: 3, borderColor: CARD,
    alignItems: "center", justifyContent: "center",
  },
  profileNameInput: {
    color: TEXT, fontSize: 24, fontWeight: "800",
    textAlign: "center", paddingVertical: 6, minWidth: 200,
  },
  profileUsernameRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  profileUsernameAt: { color: "#94a3b8", fontSize: 16, fontWeight: "500" },
  profileUsernameInput: {
    color: "#64748b", fontSize: 15, fontWeight: "500",
    paddingVertical: 4, minWidth: 120,
  },
  profileBioInput: {
    color: TEXT, fontSize: 14, fontWeight: "400",
    minHeight: 40, maxHeight: 60, lineHeight: 20,
    paddingVertical: 4, alignSelf: "stretch",
  },
  profileSpacer: { height: 1, backgroundColor: "#f1f5f9", alignSelf: "stretch", marginVertical: 20 },
  profileSectionLabel: {
    fontSize: 11, fontWeight: "700", color: "#94a3b8",
    letterSpacing: 1.5, marginBottom: 14, textAlign: "center",
  },
  profileChips: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    justifyContent: "center", marginBottom: 4,
  },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: "600", color: "#475569" },
  profileSaveBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: "center",
    alignSelf: "center",
  },
  profileSaveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, paddingBottom: 16, paddingHorizontal: 8 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6, borderRadius: 12 },
  navItemActive: { backgroundColor: BLUE_L },
  navIcon: { fontSize: 18, marginBottom: 2 },
  navLabel: { color: SUB, fontSize: 10, fontWeight: "700" },
  navLabelActive: { color: BLUE_D },
  footer: { color: HINT, fontSize: 9, fontWeight: "800", letterSpacing: 3, textAlign: "center", marginTop: 16 },
});
