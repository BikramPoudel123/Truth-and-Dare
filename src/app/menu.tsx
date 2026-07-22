import { useGame } from "@/contexts/GameContext";
import { Interest, useProfile } from "@/contexts/ProfileContext";
import { useTheme } from "@/contexts/ThemeContext";
import { GameMood, MOODS, getMoodConfig } from "@/data/moods";
import { SERVER_URL } from "@/constants/server";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator, Alert, Animated, Easing,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS } from "@/constants/design-system";
import { getHttpBase } from "@/utils/http";
import { getLevelProgress } from "@/utils/levels";
import { PLAY_STYLE_ICON_MAP } from "@/constants/profile";

import { Users, Settings, Bell, AlertTriangle, Zap, Gamepad2, Camera, Pencil, Flame, Crown, Sparkles, Search, PartyPopper, Hourglass, SmilePlus, MessageCircle, Handshake, Waves, Star, Skull, Heart, CalendarDays, ChevronRight } from "lucide-react-native";
import { ParticleBurst } from "@/components/ParticleBurst";

const ICON_MAP: Record<string, any> = { SmilePlus, MessageCircle, Flame, Handshake, Waves };

const INTEREST_META: { key: Interest; label: string; emoji: string; icon: string; gradient: string[] }[] = [
  { key: "fun",     label: "fun",     emoji: "😂", icon: "SmilePlus",     gradient: ["#3b82f6", "#60a5fa"] },
  { key: "life",    label: "life",    emoji: "💬", icon: "MessageCircle", gradient: ["#2563eb", "#93c5fd"] },
  { key: "hot",     label: "hot",     emoji: "🔥", icon: "Flame",         gradient: ["#dc2626", "#f87171"] },
  { key: "connect", label: "connect", emoji: "🤝", icon: "Handshake",     gradient: ["#3b82f6", "#60a5fa"] },
  { key: "spicy",   label: "spicy",   emoji: "🌶", icon: "Flame",         gradient: ["#dc2626", "#ef4444"] },
  { key: "deep",    label: "deep",    emoji: "🌊", icon: "Waves",         gradient: ["#1d4ed8", "#60a5fa"] },
];

function SearchingDots() {
  const { colors } = useTheme();
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
          width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pink,
          opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] }) }],
        }} />
      ))}
    </View>
  );
}



type ScreenMode = "home" | "profile" | "random_waiting" | "private_join" | "private_waiting_creator" | "private_waiting_joiner";

export default function MenuScreen({ onNavigate, initialMode }: { onNavigate?: (screen: "questions" | "community" | "friends" | "notifications" | "settings") => void; initialMode?: string }) {
  const { createRoom, autoJoin, joinRoom, roomId, players, isConnected, phase, reconnect, error, quitGame, setInterests, gameMood, setGameMood, playersOnline, notificationCount } = useGame();
  const { profile, isProfileReady, setName, setBio, setPic, toggleInterest, reactions, playedSince, playerId } = useProfile();
  const { colors, shadows } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const isSmall = screenW < 380;
  
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<ScreenMode>((initialMode as ScreenMode) || "home");
  const [joining, setJoining] = useState(false);
  const [quickMatchBurst, setQuickMatchBurst] = useState(false);
  const [privateGameBurst, setPrivateGameBurst] = useState(false);
  const [spicyMode, setSpicyMode] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [playStyle, setPlayStyle] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const displayName = profile.name || "Player";
  const initialRun = useRef(true);

  const base = getHttpBase();

  useEffect(() => { setInterests(profile.interests); }, [profile.interests]);
  useEffect(() => {
    if (initialMode) setMode(initialMode as ScreenMode);
  }, [initialMode]);
  useEffect(() => {
    if (initialRun.current) { initialRun.current = false; return; }
    if (phase === "menu") { setMode("home"); setJoining(false); setCode(""); }
  }, [phase]);
  useEffect(() => { if (error && joining) { Alert.alert("Oops", error); setJoining(false); setMode("home"); } }, [error, joining]);

  useEffect(() => {
    if (spicyMode && gameMood !== "spicy") setGameMood("spicy");
    else if (!spicyMode && gameMood === "spicy") setGameMood("casual");
  }, [spicyMode]);

  useEffect(() => {
    if (mode === "profile") {
      fetch(`${base}/profile/${encodeURIComponent(playerId)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => setPlayStyle(d?.playStyle ?? null))
        .catch(() => setPlayStyle(null));
    }
  }, [mode]);

  const pickPic = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Allow photo access for profile picture."); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true });
    if (!r.canceled && r.assets[0]) {
      const a = r.assets[0];
      const base64 = a.base64 ? `data:image/jpeg;base64,${a.base64}` : null;
      if (base64) {
        try {
          const resp = await fetch(`${base}/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64, filename: `prof-${playerId}` }),
          });
          if (resp.ok) {
            const data = await resp.json();
            setPic(`${base}${data.url}`);
          } else {
            setPic(base64);
          }
        } catch {
          setPic(base64);
        }
      } else {
        setPic(a.uri);
      }
    }
  };

  const guard = (fn: () => void) => {
    if (!isProfileReady) { Alert.alert("Profile required", "Please set up your profile first."); return; }
    if (!isConnected) { Alert.alert("Not connected", "Connecting to server... please wait a moment."); reconnect(); return; }
    fn();
  };

  return (
    <SafeAreaView edges={["top"]} style={[s.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 110 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {mode === "home" && (
              <View style={s.homeCenter}>
                {/* Header with Logo */}
                <View style={s.header}>
                  <View style={s.logoWrap}>
                  <View style={s.logoRow}>
                    <View style={s.maskRow}>
                      <Text style={s.maskBlue}>🎭</Text>
                    </View>
                <View style={s.logoTextCol}>
                  <Text style={[s.logoTruth, { color: colors.purple }]}>Truth</Text>
                  <Text style={[s.logoDare, { color: colors.red }]}>Dare</Text>
                  <Text style={[s.logoOr, { color: colors.text }]}>or</Text>
                </View>
                  </View>
                </View>
                <View style={s.headerRight}>
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.glassBg, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => onNavigate?.("friends")}>
                    <Users size={18} color={colors.sub} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.notifBtn, { backgroundColor: colors.glassBg, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => onNavigate?.("notifications")}>
                    {notificationCount > 0 && <View style={[s.notifDot, { backgroundColor: colors.red, borderColor: colors.bg }]} />}
                    <Bell size={18} color={notificationCount > 0 ? colors.purple : colors.sub} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.glassBg, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => onNavigate?.("settings")}>
                    <Settings size={18} color={colors.sub} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Online Players */}
              <View style={s.onlineRow}>
                <View style={[s.onlineDot, { backgroundColor: colors.green }]} />
                <Text style={[s.onlineTxt, { color: colors.sub }]}>{isConnected ? `${playersOnline < 2 ? "< 1,000" : `${(playersOnline + 1000).toLocaleString()}`} Players Online` : "Connecting..."}</Text>
              </View>

              {/* Profile missing warning */}
              {!isProfileReady && (
                <TouchableOpacity style={s.profileBanner} onPress={() => setMode("profile")} activeOpacity={0.85}>
                  <AlertTriangle size={24} color={colors.pink} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.profileBannerTitle, { color: colors.purple }]}>Profile needs setup</Text>
                    <Text style={[s.profileBannerSub, { color: colors.sub }]}>Tap here to set your name before playing</Text>
                  </View>
                  <ChevronRight size={20} color={colors.purple} />
                </TouchableOpacity>
              )}

              {/* Hero Card */}
              <View style={[s.matchCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.subtle }]}>
                <View style={s.matchContent}>
                  <View style={[s.matchIconWrap, s.matchIconWrapPink]}>
                    <Image source={require("../../assets/images/fun.png")} style={{ width: 36, height: 36 }} />
                  </View>
                  <View style={s.matchTextCol}>
                    <Text style={[s.matchTitle, { color: colors.text }]}>Ready for the <Text style={{ color: colors.purple }}>fun?</Text></Text>
                    <Text style={[s.matchDesc, { color: colors.sub }]}>Truth reveals. Dare dares. Let the game begin!</Text>
                  </View>
                </View>
              </View>

              {/* Quick Match Card */}
              <TouchableOpacity
                style={[s.matchCard, s.quickMatchCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.subtle }, (!isProfileReady) && s.disabled]}
                onPress={() => { setQuickMatchBurst(true); setTimeout(() => setQuickMatchBurst(false), 100); guard(() => { setJoining(true); autoJoin(profile.name.trim()); setMode("random_waiting"); }); }}
                activeOpacity={0.85}
              >
                <ParticleBurst trigger={quickMatchBurst} count={12} colors={[colors.purple, "#60a5fa", colors.red, "#f87171"]} spread={80} />
                <View style={[s.matchContent, s.quickMatchContent]}>
                  <View style={[s.matchIconWrap, s.quickMatchIcon]}>
                    <Zap size={28} color={colors.purple} />
                  </View>
                  <View style={s.matchTextCol}>
                    <Text style={[s.matchTitle, s.quickMatchTitle, { color: colors.text }]}>Quick Match</Text>
                    <Text style={[s.matchDesc, s.quickMatchDesc, { color: colors.sub }]} numberOfLines={2}>Find a random player and start instantly</Text>
                  </View>
                  <View style={[s.matchBtnPill, s.quickMatchPill, { backgroundColor: colors.purple }]}>
                    <Text style={[s.matchBtnText, { color: colors.text }]}>Play Now</Text>
                    <ChevronRight size={14} color={colors.text} />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Private Game Card */}
              <TouchableOpacity
                style={[s.matchCard, s.matchCardPrivate, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.subtle }, (!isProfileReady) && s.disabled]}
                onPress={() => { setPrivateGameBurst(true); setTimeout(() => setPrivateGameBurst(false), 100); guard(() => setMode("private_join")); }}
                activeOpacity={0.85}
              >
                <ParticleBurst trigger={privateGameBurst} count={10} colors={[colors.purple, "#60a5fa", "#93c5fd", colors.electricBlue]} spread={70} />
                <View style={s.matchContent}>
                  <View style={[s.matchIconWrap, s.matchIconWrapBlue]}>
                    <Users size={24} color={colors.purple} />
                  </View>
                  <View style={s.matchTextCol}>
                    <Text style={[s.matchTitle, { color: colors.text }]}>Private Game</Text>
                    <Text style={[s.matchDesc, { color: colors.sub }]} numberOfLines={2}>Invite a friend and play together</Text>
                  </View>
                  <View style={[s.matchBtnPill, s.matchBtnPillBlue, { backgroundColor: colors.purple }]}>
                    <Text style={[s.matchBtnText, { color: colors.text }]}>Create Room</Text>
                    <ChevronRight size={14} color={colors.text} />
                  </View>
                </View>
              </TouchableOpacity>

            </View>
          )}

          {/* PROFILE SCREEN */}
          {mode === "profile" && (
            <View style={s.profileContainer}>
              {/* Profile Avatar */}
              <View style={s.profileAvatarSection}>
                <TouchableOpacity onPress={pickPic} activeOpacity={0.8}>
                  <View style={[s.avatarRing, { width: isSmall ? 80 : 96, height: isSmall ? 80 : 96, borderRadius: isSmall ? 40 : 48, borderColor: colors.text, ...shadows.pinkGlow }]}>
                    <View style={[s.avatarGlow, { width: isSmall ? 72 : 88, height: isSmall ? 72 : 88, borderRadius: isSmall ? 36 : 44, backgroundColor: colors.cardDark }]}>
                      {profile.pic && !avatarFailed ? (
                        <Image source={{ uri: profile.pic }} style={[s.avatarImage, { width: isSmall ? 72 : 88, height: isSmall ? 72 : 88, borderRadius: isSmall ? 36 : 44 }]} onError={() => setAvatarFailed(true)} />
                      ) : (
                        <View style={[s.avatarPlaceholder, { backgroundColor: colors.surface, width: isSmall ? 72 : 88, height: isSmall ? 72 : 88, borderRadius: isSmall ? 36 : 44 }]}>
                          <Gamepad2 size={isSmall ? 26 : 32} color={colors.sub} />
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={[s.cameraBtn, { width: isSmall ? 24 : 28, height: isSmall ? 24 : 28, borderRadius: isSmall ? 12 : 14, backgroundColor: colors.cardDark, borderColor: colors.borderLight }]}>
                    <Camera size={isSmall ? 10 : 12} color={colors.sub} />
                  </View>
                </TouchableOpacity>

                {/* Editable Name */}
                {editingName ? (
                  <TextInput
                    style={[s.editableName, { fontSize: isSmall ? 20 : 24, color: colors.text }]}
                    placeholder="Your Name"
                    placeholderTextColor={colors.sub}
                    value={profile.name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    maxLength={20}
                    textAlign="center"
                    onBlur={() => setEditingName(false)}
                    autoFocus
                  />
                ) : (
                  <TouchableOpacity style={s.displayNameRow} onPress={() => setEditingName(true)} activeOpacity={0.7}>
                    <Text style={[s.displayName, { fontSize: isSmall ? 20 : 24, color: colors.text }]}>{profile.name || "Your Name"}</Text>
                    <Pencil size={14} color={colors.sub} />
                  </TouchableOpacity>
                )}

                {/* Play Style & Level Badges */}
                <View style={s.achievementRow}>
                  <View style={[s.achievementBadge, { backgroundColor: colors.glassBg, borderColor: colors.border }]}>
                    {(() => {
                      const pair = PLAY_STYLE_ICON_MAP[playStyle ?? ""] ?? [Star, colors.sub];
                      const Icon = pair[0];
                      return <Icon size={14} color={pair[1]} />;
                    })()}
                    <Text style={[s.achievementLabel, { color: colors.text }]}>{playStyle ?? "Rising Star"}</Text>
                  </View>
                  <View style={[s.achievementBadge, { backgroundColor: colors.glassBg, borderColor: colors.border }]}>
                    <Crown size={14} color={colors.gold} />
                    <Text style={[s.achievementLabel, { color: colors.text }]}>Level {profile.stats.level}</Text>
                  </View>
                </View>
                {(() => {
                  const gp = getLevelProgress(profile.stats.gamesPlayed);
                  return (
                    <View style={{ width: "100%", marginTop: 8 }}>
                      <View style={{ width: "100%", height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: "hidden" }}>
                        <View style={{ width: `${gp.progress * 100}%`, height: "100%", backgroundColor: colors.gold, borderRadius: 2 }} />
                      </View>
                      <Text style={{ color: colors.sub, fontSize: 9, fontWeight: "600", textAlign: "center", marginTop: 4 }}>{gp.current} / {gp.needed} XP to next level</Text>
                    </View>
                  );
                })()}
              </View>

              {/* Stats Card */}
              <View style={[s.statsCard, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.subtle }]}>
                <View style={s.statColumn}>
                  <Gamepad2 size={isSmall ? 16 : 20} color={colors.sub} />
                  <Text style={[s.statNumber, { fontSize: isSmall ? 18 : 22, color: colors.text }]}>{profile.stats.gamesPlayed}</Text>
                  <Text style={[s.statLabel, { color: colors.sub }]}>Games Played</Text>
                </View>
                <View style={[s.statDivider, { backgroundColor: colors.border }]} />
                <View style={s.statColumn}>
                  <SmilePlus size={isSmall ? 16 : 20} color={colors.sub} />
                  <Text style={[s.statNumber, { fontSize: isSmall ? 18 : 22, color: colors.text }]}>{Object.values(reactions).reduce((a, b) => a + b, 0)}</Text>
                  <Text style={[s.statLabel, { color: colors.sub }]}>Reactions</Text>
                </View>
                <View style={[s.statDivider, { backgroundColor: colors.border }]} />
                <View style={s.statColumn}>
                  <CalendarDays size={isSmall ? 16 : 20} color={colors.sub} />
                  <Text style={[s.statDate, { fontSize: isSmall ? 12 : 14, color: colors.text }]}>
                    {playedSince
                      ? new Date(playedSince).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </Text>
                  <Text style={[s.statLabel, { color: colors.sub }]}>Played Since</Text>
                </View>
              </View>

              {/* Bio Card */}
              <View style={[s.bioCard, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.subtle }]}>
                <View style={s.bioHeader}>
                  <Text style={[s.bioTitle, { color: colors.text }]}>Your Bio</Text>
                  <TouchableOpacity onPress={() => setEditingBio(!editingBio)} activeOpacity={0.7}>
                    <Pencil size={16} color={colors.sub} />
                  </TouchableOpacity>
                </View>
                {editingBio ? (
                  <TextInput
                    style={[s.bioInput, { color: colors.text }]}
                    placeholder="Here for fun, laughs and deep talks. Let's play!"
                    placeholderTextColor={colors.sub}
                    value={profile.bio}
                    onChangeText={setBio}
                    multiline
                    maxLength={80}
                    onBlur={() => setEditingBio(false)}
                    autoFocus
                  />
                ) : (
                  <Text style={[s.bioText, { color: colors.text }]}>{profile.bio || "Here for fun, laughs and deep talks. Let's play!"}</Text>
                )}
              </View>

              {/* Interests Card */}
              <View style={[s.interestsCard, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.subtle }]}>
                <View style={s.interestsHeader}>
                  <Text style={[s.interestsTitle, { color: colors.text }]}>Your Interests</Text>
                </View>
                <View style={s.interestsChips}>
                  {INTEREST_META.map(({ key, label, icon, gradient }) => {
                    const active = profile.interests.includes(key);
                    const IconComp = ICON_MAP[icon];
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          s.interestChip,
                          { backgroundColor: colors.glassBg, borderColor: colors.border },
                          active && { backgroundColor: "#22c55e" },
                          active && { borderColor: "#22c55e" },
                        ]}
                        onPress={() => toggleInterest(key)}
                        activeOpacity={0.7}
                      >
                        {IconComp && <IconComp size={13} color={active ? "#fff" : colors.sub} />}
                        <Text style={[s.interestChipLabel, { color: colors.sub }, active && { color: "#fff" }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {Object.keys(reactions).length > 0 && (
                <View style={s.reactionsWrap}>
                  {Object.entries(reactions).filter(([, c]) => c > 0).map(([emoji, count]) => (
                    <View key={emoji} style={[s.reactionTag, { backgroundColor: colors.glassBg, borderColor: colors.border }]}>
                      <Text style={s.reactionEmoji}>{emoji}</Text>
                      <Text style={[s.reactionCount, { color: colors.sub }]}>{count}</Text>
                    </View>
                  ))}
                </View>
              )}

            </View>
          )}

          {/* RANDOM SEARCHING */}
          {mode === "random_waiting" && (
            <View style={[s.stateCard, { backgroundColor: colors.card, marginTop: 40, borderColor: colors.border, ...shadows.subtle }]}>
              <View style={s.stateBlock}>
                <View style={[s.pulseRing, { backgroundColor: colors.purpleLight, borderColor: colors.purple }]}><Search size={36} color={colors.purple} /></View>
                <Text style={[s.stateTitle, { color: colors.text }]}>Finding opponent...</Text>
                <Text style={[s.stateSub, { color: colors.sub }]}>Playing as <Text style={{ color: colors.purple, fontWeight: 'bold' }}>{profile.name}</Text></Text>

                <SearchingDots />
                <Text style={[s.stateHint, { color: colors.sub }]}>{players.length === 2 ? "✓ Found! Starting game..." : "Scanning for available players"}</Text>
              </View>
              <TouchableOpacity style={[s.btnDanger, { backgroundColor: colors.pinkLight, borderColor: `${colors.pink}66` }]} onPress={() => { quitGame(); setMode("home"); setJoining(false); }} activeOpacity={0.82}>
                <Text style={[s.btnDangerText, { color: colors.pink }]}>Cancel Search</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PRIVATE JOIN/CREATE */}
          {mode === "private_join" && (
            <View style={[s.stateCard, { backgroundColor: colors.card, marginTop: 20, borderColor: colors.border, ...shadows.subtle }]}>
              <TouchableOpacity onPress={() => setMode("home")} style={s.backBtn}><Text style={[s.backBtnText, { color: colors.sub }]}>← Back</Text></TouchableOpacity>
              <View style={s.fieldWrap}>
                <Text style={[s.fieldLabel, { color: colors.sub }]}>ENTER ROOM CODE</Text>
                <View style={[s.inputBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  <TextInput style={[s.codeInput, { color: colors.purple }]} placeholder="A B C" placeholderTextColor={colors.sub} value={code} onChangeText={t => setCode(t.toUpperCase().replace(/[^A-Z]/g, ""))} autoCapitalize="characters" maxLength={3} autoFocus />
                </View>
              </View>
              
              <TouchableOpacity style={[s.btnFill, { backgroundColor: colors.purple }, code.length < 3 && s.disabled]} onPress={() => { if (!isConnected) { reconnect(); return; } setJoining(true); joinRoom(code, profile.name.trim()); setMode("private_waiting_joiner"); }} disabled={code.length < 3 || joining} activeOpacity={0.82}>
                {joining ? <ActivityIndicator color="#fff" /> : <Text style={[s.btnFillTitle, { textAlign: "center", flex: 1 }]}>Join Room</Text>}
              </TouchableOpacity>
              
              <View style={s.divider}><View style={[s.divLine, { backgroundColor: colors.border }]} /><Text style={[s.divText, { color: colors.sub }]}>or</Text><View style={[s.divLine, { backgroundColor: colors.border }]} /></View>
              
              <TouchableOpacity style={[s.btnGhost, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { if (!isConnected) { reconnect(); return; } createRoom(profile.name.trim()); setMode("private_waiting_creator"); }} activeOpacity={0.82}>
                <View style={s.btnGhostLeft}><Sparkles size={24} color={colors.sub} /><View><Text style={[s.btnGhostTitle, { color: colors.text }]}>Create New Room</Text><Text style={[s.btnGhostSub, { color: colors.sub }]}>Get a code to share</Text></View></View>
                <ChevronRight size={22} color={colors.purple} />
              </TouchableOpacity>
            </View>
          )}

          {/* CREATOR WAITING */}
          {mode === "private_waiting_creator" && (
            <View style={[s.stateCard, { backgroundColor: colors.card, marginTop: 40, borderColor: colors.border, ...shadows.subtle }]}>
              <View style={s.stateBlock}>
                <PartyPopper size={44} color={colors.purple} />
                <Text style={[s.stateTitle, { color: colors.text }]}>Room Ready!</Text>
                <Text style={[s.stateSub, { color: colors.sub }]}>Share this code with your friend</Text>
                <View style={[s.codeCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  <Text style={[s.codeCardLabel, { color: colors.sub }]}>ROOM CODE</Text>
                  <Text style={[s.codeCardValue, { color: colors.purple }]}>{roomId ?? "···"}</Text>
                </View>
                <View style={s.waitRow}>
                  <ActivityIndicator size="small" color={colors.purple} />
                  <Text style={[s.waitRowText, { color: colors.sub }]}>{players.length === 2 ? "Friend joined! Starting..." : "Waiting for friend..."}</Text>
                </View>
              </View>
              <TouchableOpacity style={[s.btnDanger, { backgroundColor: colors.pinkLight, borderColor: `${colors.pink}66` }]} onPress={() => { quitGame(); setMode("home"); }} activeOpacity={0.82}>
                <Text style={[s.btnDangerText, { color: colors.pink }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* JOINER WAITING */}
          {mode === "private_waiting_joiner" && (
            <View style={[s.stateCard, { backgroundColor: colors.card, marginTop: 40, borderColor: colors.border, ...shadows.subtle }]}>
              <View style={s.stateBlock}>
                <Hourglass size={44} color={colors.purple} />
                <Text style={[s.stateTitle, { color: colors.text }]}>Joining room...</Text>
                <Text style={[s.stateSub, { color: colors.sub }]}>Code: <Text style={{ color: colors.purple, fontWeight: "800" }}>{code}</Text></Text>
                <ActivityIndicator size="large" color={colors.purple} style={{ marginTop: 16 }} />
                <Text style={[s.stateHint, { color: colors.sub }]}>{players.length === 2 ? "✓ Connected! Starting..." : "Connecting..."}</Text>
              </View>
              <TouchableOpacity style={[s.btnDanger, { backgroundColor: colors.pinkLight, borderColor: `${colors.pink}66` }]} onPress={() => { quitGame(); setMode("home"); setJoining(false); setCode(""); }} activeOpacity={0.82}>
                <Text style={[s.btnDangerText, { color: colors.pink }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b081c" },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  disabled: { opacity: 0.4 },

  // ── Home Center ──
  homeCenter: { flex: 1, justifyContent: "center" },

  // ── Background Particles ──

  // ── Header ──
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 16, paddingBottom: 12 },
  logoWrap: {},
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  maskRow: { flexDirection: "row", gap: 2 },
  maskBlue: { fontSize: 28 },
  logoTextCol: { position: "relative", alignItems: "center", justifyContent: "center", paddingVertical: 0 },
  logoTextRow: {},
  logoTruth: { fontSize: 22, fontWeight: "900", color: "#3b82f6", letterSpacing: -0.5, lineHeight: 22, zIndex: 0 },
  logoOr: { position: "absolute", fontSize: 13, fontWeight: "900", color: "#ffffff", opacity: 0.8, letterSpacing: 2, zIndex: 2, alignSelf: "center", top: 14 },
  logoDare: { fontSize: 28, fontWeight: "900", color: "#dc2626", letterSpacing: 1, lineHeight: 28, zIndex: 0 },

  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#dc2626", zIndex: 1, borderWidth: 1.5, borderColor: "#0b081c" },

  // ── Online Players ──
  onlineRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10b981" },
  onlineTxt: { fontSize: 12, color: "#a19bb3", fontWeight: "600", letterSpacing: 0.5 },

  // ── Profile Banner ──
  profileBanner: { backgroundColor: "rgba(59, 130, 246, 0.1)", borderRadius: RADIUS.small, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(59, 130, 246, 0.3)" },
  profileBannerTitle: { color: "#3b82f6", fontSize: 14, fontWeight: "800" },
  profileBannerSub: { color: "#a19bb3", fontSize: 11, marginTop: 2 },

  // ── Match Cards ──
  matchCard: {
    backgroundColor: "rgba(26, 16, 64, 0.85)",
    borderRadius: RADIUS.cardSm,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  matchCardPrivate: { backgroundColor: "rgba(26, 16, 64, 0.85)", borderColor: "rgba(255, 255, 255, 0.08)", paddingVertical: 4 },
  quickMatchCard: { paddingVertical: 6 },
  matchContent: { flexDirection: "row", alignItems: "center", padding: 18 },
  quickMatchContent: { padding: 22 },
  matchIconWrap: { width: 48, height: 48, borderRadius: RADIUS.icon, backgroundColor: "transparent", alignItems: "center", justifyContent: "center", marginRight: 14 },
  quickMatchIcon: { width: 56, height: 56, borderRadius: 20 },
  matchIconWrapPink: { backgroundColor: "transparent" },
  matchIconWrapBlue: { backgroundColor: "transparent" },
  matchTextCol: { flex: 1, paddingRight: 8 },
  matchTitle: { color: "#ffffff", fontSize: 17, fontWeight: "800", marginBottom: 3 },
  quickMatchTitle: { fontSize: 19 },
  matchDesc: { color: "#a19bb3", fontSize: 11, lineHeight: 15 },
  quickMatchDesc: { fontSize: 11, lineHeight: 16 },
  matchBtnPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#3b82f6",
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  matchBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "700", lineHeight: 16 },
  quickMatchPill: { paddingVertical: 12, paddingHorizontal: 22 },
  matchBtnPillPink: { backgroundColor: "#3b82f6" },
  matchBtnPillBlue: { backgroundColor: "#3b82f6" },

  // ── Game Modes ──
  modesSection: { marginTop: 4, marginBottom: 16 },
  modesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modesTitle: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  spicyToggle: { flexDirection: "row", alignItems: "center", gap: 8 },
  spicyLabel: { color: "#a19bb3", fontSize: 12, fontWeight: "600" },

  // ── Feature Cards ──
  featureRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  featureCard: {
    flex: 1,
    backgroundColor: "rgba(23, 19, 50, 0.6)",
    borderRadius: RADIUS.cardSm,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
  },
  featureIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  featureIcon: { fontSize: 16 },
  featureNumber: { color: "#ffffff", fontSize: 20, fontWeight: "900" },
  featureLabel: { color: "#a19bb3", fontSize: 10, fontWeight: "600" },

  // ── Profile Screen ──
  profileContainer: { gap: 16, paddingTop: 24 },

  // Avatar Section
  profileAvatarSection: { alignItems: "center", marginBottom: 8 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    backgroundColor: "rgba(23, 19, 50, 0.95)",
  },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#2a2440", alignItems: "center", justifyContent: "center" },
  cameraBtn: {
    position: "absolute",
    bottom: 2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(23, 19, 50, 0.95)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  editableName: { color: "#ffffff", fontWeight: "900", textAlign: "center", paddingVertical: 6, marginTop: 8, width: "100%", maxWidth: 280 },
  displayNameRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, paddingVertical: 6 },
  displayName: { color: "#ffffff", fontSize: 24, fontWeight: "900", textAlign: "center" },
  // Achievements
  achievementRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  achievementLabel: { color: "#ffffff", fontSize: 12, fontWeight: "700" },

  // Stats Card
  statsCard: {
    flexDirection: "row",
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statColumn: { flex: 1, alignItems: "center", gap: 4 },
  statNumber: { color: "#ffffff", fontSize: 22, fontWeight: "900" },
  statLabel: { color: "#a19bb3", fontSize: 11, fontWeight: "600" },
  statDate: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  statDivider: { width: 1, backgroundColor: "rgba(255, 255, 255, 0.08)", marginVertical: 4 },
  reactionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 10 },
  reactionTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { color: "#a19bb3", fontSize: 11, fontWeight: "700" },

  // Bio Card
  bioCard: {
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bioHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  bioTitle: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  bioInput: { color: "#ffffff", fontSize: 13, fontWeight: "400", lineHeight: 20, minHeight: 36, paddingVertical: 2 },
  bioText: { color: "#ffffff", fontSize: 13, fontWeight: "400", lineHeight: 20 },

  // Interests Card
  interestsCard: {
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  interestsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  interestsTitle: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  interestsChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  interestChipLabel: { fontSize: 12, fontWeight: "600", color: "#a19bb3" },

  // ── State/Waiting Cards ──
  stateCard: { backgroundColor: "rgba(23, 19, 50, 0.85)", borderRadius: RADIUS.cardSm, padding: 24, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  stateBlock: { alignItems: "center", paddingVertical: 16, gap: 10 },
  pulseRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(59, 130, 246, 0.15)", borderWidth: 2, borderColor: "#3b82f6", alignItems: "center", justifyContent: "center" },
  stateTitle: { color: "#ffffff", fontSize: 22, fontWeight: "800" },
  stateSub: { color: "#a19bb3", fontSize: 14 },
  stateHint: { color: "#a19bb3", fontSize: 12, textAlign: "center", marginTop: 4 },
  
  btnDanger: { borderRadius: RADIUS.button, paddingVertical: 16, alignItems: "center", backgroundColor: "rgba(220, 38, 38, 0.15)", borderWidth: 1, borderColor: "rgba(220, 38, 38, 0.4)" },
  btnDangerText: { color: "#dc2626", fontSize: 15, fontWeight: "800" },
  
  backBtn: { alignSelf: "flex-start", paddingBottom: 10 },
  backBtnText: { color: "#a19bb3", fontSize: 14, fontWeight: "700" },
  fieldWrap: { gap: 10 },
  fieldLabel: { fontSize: 11, fontWeight: "800", color: "#a19bb3", letterSpacing: 2 },
  inputBox: { backgroundColor: "#0b081c", borderRadius: RADIUS.small, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", justifyContent: "center" },
  codeInput: { color: "#3b82f6", fontSize: 32, fontWeight: "900", letterSpacing: 14, textAlign: "center" },
  
  btnFill: { backgroundColor: "#3b82f6", borderRadius: RADIUS.button, paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  btnFillTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  btnGhost: { backgroundColor: "rgba(23, 19, 50, 0.85)", borderRadius: RADIUS.button, paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  btnGhostLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  btnGhostTitle: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  btnGhostSub: { color: "#a19bb3", fontSize: 12, marginTop: 2 },
  
  divider: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.08)" },
  divText: { color: "#a19bb3", fontSize: 13, fontWeight: "600" },
  
  codeCard: { backgroundColor: "#0b081c", borderRadius: RADIUS.small, paddingHorizontal: 40, paddingVertical: 20, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  codeCardLabel: { color: "#a19bb3", fontSize: 11, fontWeight: "800", letterSpacing: 3, marginBottom: 8 },
  codeCardValue: { color: "#3b82f6", fontSize: 48, fontWeight: "900", letterSpacing: 12 },
  waitRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  waitRowText: { color: "#a19bb3", fontSize: 14 },

});
