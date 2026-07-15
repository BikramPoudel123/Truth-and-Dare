import { useGame } from "@/contexts/GameContext";
import { Interest, useProfile } from "@/contexts/ProfileContext";
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
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { getHttpBase } from "@/utils/http";
import { getLevelProgress } from "@/utils/levels";
import { PLAY_STYLE_ICON_MAP } from "@/constants/profile";

import { Users, Settings, Bell, AlertTriangle, Zap, Gamepad2, Camera, Pencil, Flame, Crown, Sparkles, Search, PartyPopper, Hourglass, SmilePlus, MessageCircle, Handshake, Waves, Star, Skull, Heart, CalendarDays } from "lucide-react-native";
import { ParticleBurst } from "@/components/ParticleBurst";

const ICON_MAP: Record<string, any> = { SmilePlus, MessageCircle, Flame, Handshake, Waves };

const INTEREST_META: { key: Interest; label: string; emoji: string; icon: string; gradient: string[] }[] = [
  { key: "fun",     label: "fun",     emoji: "😂", icon: "SmilePlus",     gradient: ["#8b5cf6", "#a78bfa"] },
  { key: "life",    label: "life",    emoji: "💬", icon: "MessageCircle", gradient: ["#3b82f6", "#60a5fa"] },
  { key: "hot",     label: "hot",     emoji: "🔥", icon: "Flame",         gradient: ["#ec4899", "#f472b6"] },
  { key: "connect", label: "connect", emoji: "🤝", icon: "Handshake",     gradient: ["#f97316", "#fb923c"] },
  { key: "spicy",   label: "spicy",   emoji: "🌶", icon: "Flame",         gradient: ["#ef4444", "#f87171"] },
  { key: "deep",    label: "deep",    emoji: "🌊", icon: "Waves",         gradient: ["#06b6d4", "#22d3ee"] },
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
          width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.pink,
          opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] }) }],
        }} />
      ))}
    </View>
  );
}

function GlowParticles() {
  const particles = useRef(Array.from({ length: 12 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    opacity: new Animated.Value(Math.random() * 0.5 + 0.1),
    anim: null as Animated.CompositeAnimation | null,
  }))).current;

  useEffect(() => {
    particles.forEach(p => {
      p.anim = Animated.loop(
        Animated.sequence([
          Animated.timing(p.opacity, { toValue: 0.6, duration: 2000 + Math.random() * 3000, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0.1, duration: 2000 + Math.random() * 3000, easing: Easing.ease, useNativeDriver: true }),
        ])
      );
      p.anim.start();
    });
    return () => particles.forEach(p => p.anim?.stop());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: i % 3 === 0 ? COLORS.purple : i % 3 === 1 ? COLORS.pink : COLORS.electricBlue,
            opacity: p.opacity,
          }}
        />
      ))}
    </View>
  );
}

function FloatingBlob({ color, top, left, size }: { color: string; top: number; left: number; size: number }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const dur = 8000 + Math.random() * 6000;
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateX, { toValue: 20 + Math.random() * 20, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(translateX, { toValue: -(20 + Math.random() * 20), duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(translateY, { toValue: 15 + Math.random() * 20, duration: dur * 1.2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -(15 + Math.random() * 20), duration: dur * 1.2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} pointerEvents="none">
      <Animated.View style={{ position: "absolute", top, left, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: 0.3, transform: [{ translateX }, { translateY }] }} />
    </Animated.View>
  );
}

type ScreenMode = "home" | "profile" | "random_waiting" | "private_join" | "private_waiting_creator" | "private_waiting_joiner";

export default function MenuScreen({ onNavigate, initialMode }: { onNavigate?: (screen: "questions" | "community" | "friends" | "notifications" | "settings") => void; initialMode?: string }) {
  const { createRoom, autoJoin, joinRoom, roomId, players, isConnected, phase, reconnect, error, quitGame, setInterests, gameMood, setGameMood, playersOnline, notificationCount } = useGame();
  const { profile, isProfileReady, setName, setBio, setPic, toggleInterest, reactions, playedSince, playerId } = useProfile();
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

  // ── Home entrance animations ──
  const logoAnim       = useRef(new Animated.Value(0)).current;
  const headerIconsAnim = useRef(new Animated.Value(0)).current;
  const onlineAnim     = useRef(new Animated.Value(0)).current;
  const heroAnim       = useRef(new Animated.Value(0)).current;
  const quickAnim      = useRef(new Animated.Value(0)).current;
  const privateAnim    = useRef(new Animated.Value(0)).current;
  const onlineDotScale = useRef(new Animated.Value(1)).current;
  const pillGlow       = useRef(new Animated.Value(0.3)).current;
  const logoFloat      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode !== "home") return;
    [logoAnim, headerIconsAnim, onlineAnim, heroAnim, quickAnim, privateAnim].forEach(v => v.setValue(0));
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(logoAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.timing(headerIconsAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.timing(onlineAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(heroAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(quickAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(privateAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    // Online dot pulse
    const dotPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(onlineDotScale, { toValue: 1.5, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(onlineDotScale, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    dotPulse.start();

    // Quick Match pill glow pulse
    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pillGlow, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pillGlow, { toValue: 0.3, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    glowPulse.start();

    // Logo gentle float
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: -4, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 4, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatAnim.start();

    return () => { dotPulse.stop(); glowPulse.stop(); floatAnim.stop(); };
  }, [mode]);

  const homeEntrance = (anim: Animated.Value, translateY = 30) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [translateY, 0] }) }],
  });

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
    <SafeAreaView style={s.safe}>
      {mode === "home" && <GlowParticles />}
      <FloatingBlob color={COLORS.purple} top={-80} left={-60} size={200} />
      <FloatingBlob color={COLORS.pink} top={200} left={260} size={160} />
      <FloatingBlob color={COLORS.electricBlue} top={400} left={-40} size={140} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 110 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {mode === "home" && (
              <View style={s.homeCenter}>
                {/* Header with Logo */}
                <Animated.View style={[s.header, homeEntrance(logoAnim, -20)]}>
                  <View style={s.logoWrap}>
                  <View style={s.logoRow}>
                    <Animated.View style={s.maskRow}>
                      <Animated.Text style={[s.maskBlue, { transform: [{ translateY: logoFloat }] }]}>🎭</Animated.Text>
                    </Animated.View>
                <View style={s.logoTextCol}>
                  <Text style={s.logoTruth}>Truth</Text>
                  <Text style={s.logoDare}>Dare</Text>
                  <Text style={s.logoOr}>or</Text>
                </View>
                  </View>
                </View>
                <Animated.View style={[s.headerRight, { opacity: headerIconsAnim, transform: [{ translateX: headerIconsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
                  <TouchableOpacity style={s.iconBtn} activeOpacity={0.8} onPress={() => onNavigate?.("friends")}>
                    <Users size={18} color={COLORS.sub} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.notifBtn} activeOpacity={0.8} onPress={() => onNavigate?.("notifications")}>
                    {notificationCount > 0 && <View style={s.notifDot} />}
                    <Bell size={18} color={notificationCount > 0 ? COLORS.purple : COLORS.sub} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.iconBtn} activeOpacity={0.8} onPress={() => onNavigate?.("settings")}>
                    <Settings size={18} color={COLORS.sub} />
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>

              {/* Online Players */}
              <Animated.View style={[s.onlineRow, homeEntrance(onlineAnim, 15)]}>
                <Animated.View style={[s.onlineDot, { transform: [{ scale: onlineDotScale }]}]} />
                <Text style={s.onlineTxt}>{isConnected ? `${playersOnline.toLocaleString()} Players Online` : "Connecting..."}</Text>
              </Animated.View>

              {/* Profile missing warning */}
              {!isProfileReady && (
                <TouchableOpacity style={s.profileBanner} onPress={() => setMode("profile")} activeOpacity={0.85}>
                  <AlertTriangle size={24} color={COLORS.pink} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.profileBannerTitle}>Profile needs setup</Text>
                    <Text style={s.profileBannerSub}>Tap here to set your name before playing</Text>
                  </View>
                  <Text style={s.profileBannerArrow}>›</Text>
                </TouchableOpacity>
              )}

              {/* Hero Card */}
              <Animated.View style={[s.matchCard, { backgroundColor: "#29002b", borderColor: "rgba(255, 0, 110, 0.25)" }, homeEntrance(heroAnim)]}>
                <View style={s.matchContent}>
                  <View style={[s.matchIconWrap, s.matchIconWrapPink]}>
                    <Image source={require("../../assets/images/fun.png")} style={{ width: 36, height: 36 }} />
                  </View>
                  <View style={s.matchTextCol}>
                    <Text style={s.matchTitle}>Ready for the <Text style={{ color: COLORS.pink }}>fun?</Text></Text>
                    <Text style={s.matchDesc}>Truth reveals. Dare dares. Let the game begin!</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Quick Match Card */}
              <Animated.View style={homeEntrance(quickAnim)}>
              <TouchableOpacity
                style={[s.matchCard, (!isProfileReady) && s.disabled]}
                onPress={() => { setQuickMatchBurst(true); setTimeout(() => setQuickMatchBurst(false), 100); guard(() => { setJoining(true); autoJoin(profile.name.trim()); setMode("random_waiting"); }); }}
                activeOpacity={0.85}
              >
                <ParticleBurst trigger={quickMatchBurst} count={12} colors={[COLORS.purple, COLORS.pink, COLORS.electricBlue, "#a78bfa"]} spread={80} />
                <View style={s.matchContent}>
                  <View style={s.matchIconWrap}>
                    <Zap size={24} color={COLORS.purple} />
                  </View>
                  <View style={s.matchTextCol}>
                    <Text style={s.matchTitle}>Quick Match</Text>
                    <Text style={s.matchDesc}>Find a random player{"\n"}and start instantly</Text>
                  </View>
                  <Animated.View style={[s.matchBtnPill, { opacity: pillGlow }]}>
                    <Text style={s.matchBtnText}>Play Now</Text>
                    <Text style={s.matchBtnArrow}>→</Text>
                  </Animated.View>
                </View>
              </TouchableOpacity>
              </Animated.View>

              {/* Private Game Card */}
              <Animated.View style={homeEntrance(privateAnim)}>
              <TouchableOpacity
                style={[s.matchCard, s.matchCardPrivate, (!isProfileReady) && s.disabled]}
                onPress={() => { setPrivateGameBurst(true); setTimeout(() => setPrivateGameBurst(false), 100); guard(() => setMode("private_join")); }}
                activeOpacity={0.85}
              >
                <ParticleBurst trigger={privateGameBurst} count={10} colors={[COLORS.pink, COLORS.orange, COLORS.purple, "#f472b6"]} spread={70} />
                <View style={s.matchContent}>
                  <View style={[s.matchIconWrap, s.matchIconWrapPink]}>
                    <Users size={24} color={COLORS.pink} />
                  </View>
                  <View style={s.matchTextCol}>
                    <Text style={s.matchTitle}>Private Game</Text>
                    <Text style={s.matchDesc}>Invite a friend and play together</Text>
                  </View>
                  <View style={[s.matchBtnPill, s.matchBtnPillPink]}>
                    <Text style={s.matchBtnText}>Create Room</Text>
                    <Text style={s.matchBtnArrow}>→</Text>
                  </View>
                </View>
              </TouchableOpacity>
              </Animated.View>


            </View>
          )}

          {/* PROFILE SCREEN */}
          {mode === "profile" && (
            <View style={s.profileContainer}>
              {/* Profile Avatar */}
              <View style={s.profileAvatarSection}>
                <TouchableOpacity onPress={pickPic} activeOpacity={0.8}>
                  <View style={[s.avatarRing, { width: isSmall ? 80 : 96, height: isSmall ? 80 : 96, borderRadius: isSmall ? 40 : 48 }]}>
                    <View style={[s.avatarGlow, { width: isSmall ? 72 : 88, height: isSmall ? 72 : 88, borderRadius: isSmall ? 36 : 44 }]}>
                      {profile.pic && !avatarFailed ? (
                        <Image source={{ uri: profile.pic }} style={[s.avatarImage, { width: isSmall ? 72 : 88, height: isSmall ? 72 : 88, borderRadius: isSmall ? 36 : 44 }]} onError={() => setAvatarFailed(true)} />
                      ) : (
                        <View style={[s.avatarPlaceholder, { width: isSmall ? 72 : 88, height: isSmall ? 72 : 88, borderRadius: isSmall ? 36 : 44 }]}>
                          <Gamepad2 size={isSmall ? 26 : 32} color={COLORS.sub} />
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={[s.cameraBtn, { width: isSmall ? 24 : 28, height: isSmall ? 24 : 28, borderRadius: isSmall ? 12 : 14 }]}>
                    <Camera size={isSmall ? 10 : 12} color={COLORS.sub} />
                  </View>
                </TouchableOpacity>

                {/* Editable Name */}
                {editingName ? (
                  <TextInput
                    style={[s.editableName, { fontSize: isSmall ? 20 : 24 }]}
                    placeholder="Your Name"
                    placeholderTextColor={COLORS.sub}
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
                    <Text style={[s.displayName, { fontSize: isSmall ? 20 : 24 }]}>{profile.name || "Your Name"}</Text>
                    <Pencil size={14} color={COLORS.sub} />
                  </TouchableOpacity>
                )}

                {/* Play Style & Level Badges */}
                <View style={s.achievementRow}>
                  <View style={s.achievementBadge}>
                    {(() => {
                      const pair = PLAY_STYLE_ICON_MAP[playStyle ?? ""] ?? [Star, COLORS.sub];
                      const Icon = pair[0];
                      return <Icon size={14} color={pair[1]} />;
                    })()}
                    <Text style={s.achievementLabel}>{playStyle ?? "Rising Star"}</Text>
                  </View>
                  <View style={s.achievementBadge}>
                    <Crown size={14} color={COLORS.gold} />
                    <Text style={s.achievementLabel}>Level {profile.stats.level}</Text>
                  </View>
                </View>
                {(() => {
                  const gp = getLevelProgress(profile.stats.gamesPlayed);
                  return (
                    <View style={{ width: "100%", marginTop: 8 }}>
                      <View style={{ width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                        <View style={{ width: `${gp.progress * 100}%`, height: "100%", backgroundColor: COLORS.gold, borderRadius: 2 }} />
                      </View>
                      <Text style={{ color: COLORS.sub, fontSize: 9, fontWeight: "600", textAlign: "center", marginTop: 4 }}>{gp.current} / {gp.needed} XP to next level</Text>
                    </View>
                  );
                })()}
              </View>

              {/* Stats Card */}
              <View style={s.statsCard}>
                <View style={s.statColumn}>
                  <Gamepad2 size={isSmall ? 16 : 20} color={COLORS.sub} />
                  <Text style={[s.statNumber, { fontSize: isSmall ? 18 : 22 }]}>{profile.stats.gamesPlayed}</Text>
                  <Text style={s.statLabel}>Games Played</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statColumn}>
                  <SmilePlus size={isSmall ? 16 : 20} color={COLORS.sub} />
                  <Text style={[s.statNumber, { fontSize: isSmall ? 18 : 22 }]}>{Object.values(reactions).reduce((a, b) => a + b, 0)}</Text>
                  <Text style={s.statLabel}>Reactions</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statColumn}>
                  <CalendarDays size={isSmall ? 16 : 20} color={COLORS.sub} />
                  <Text style={[s.statDate, { fontSize: isSmall ? 12 : 14 }]}>
                    {playedSince
                      ? new Date(playedSince).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </Text>
                  <Text style={s.statLabel}>Played Since</Text>
                </View>
              </View>

              {/* Bio Card */}
              <View style={s.bioCard}>
                <View style={s.bioHeader}>
                  <Text style={s.bioTitle}>Your Bio</Text>
                  <TouchableOpacity onPress={() => setEditingBio(!editingBio)} activeOpacity={0.7}>
                    <Pencil size={16} color={COLORS.sub} />
                  </TouchableOpacity>
                </View>
                {editingBio ? (
                  <TextInput
                    style={s.bioInput}
                    placeholder="Here for fun, laughs and deep talks. Let's play!"
                    placeholderTextColor={COLORS.sub}
                    value={profile.bio}
                    onChangeText={setBio}
                    multiline
                    maxLength={80}
                    onBlur={() => setEditingBio(false)}
                    autoFocus
                  />
                ) : (
                  <Text style={s.bioText}>{profile.bio || "Here for fun, laughs and deep talks. Let's play!"}</Text>
                )}
              </View>

              {/* Interests Card */}
              <View style={s.interestsCard}>
                <View style={s.interestsHeader}>
                  <Text style={s.interestsTitle}>Your Interests</Text>
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
                          active && { backgroundColor: "#22c55e" },
                          active && { borderColor: "#22c55e" },
                        ]}
                        onPress={() => toggleInterest(key)}
                        activeOpacity={0.7}
                      >
                        {IconComp && <IconComp size={13} color={active ? "#fff" : COLORS.sub} />}
                        <Text style={[s.interestChipLabel, active && { color: "#fff" }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {Object.keys(reactions).length > 0 && (
                <View style={s.reactionsWrap}>
                  {Object.entries(reactions).filter(([, c]) => c > 0).map(([emoji, count]) => (
                    <View key={emoji} style={s.reactionTag}>
                      <Text style={s.reactionEmoji}>{emoji}</Text>
                      <Text style={s.reactionCount}>{count}</Text>
                    </View>
                  ))}
                </View>
              )}

            </View>
          )}

          {/* RANDOM SEARCHING */}
          {mode === "random_waiting" && (
            <View style={[s.stateCard, { marginTop: 40 }]}>
              <View style={s.stateBlock}>
                <View style={s.pulseRing}><Search size={36} color={COLORS.pink} /></View>
                <Text style={s.stateTitle}>Finding opponent...</Text>
                <Text style={s.stateSub}>Playing as <Text style={{ color: COLORS.pink, fontWeight: 'bold' }}>{profile.name}</Text></Text>

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
            <View style={[s.stateCard, { marginTop: 20 }]}>
              <TouchableOpacity onPress={() => setMode("home")} style={s.backBtn}><Text style={s.backBtnText}>← Back</Text></TouchableOpacity>
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>ENTER ROOM CODE</Text>
                <View style={s.inputBox}>
                  <TextInput style={s.codeInput} placeholder="A B C" placeholderTextColor={COLORS.sub} value={code} onChangeText={t => setCode(t.toUpperCase().replace(/[^A-Z]/g, ""))} autoCapitalize="characters" maxLength={3} autoFocus />
                </View>
              </View>
              
              <TouchableOpacity style={[s.btnFill, code.length < 3 && s.disabled]} onPress={() => { if (!isConnected) { reconnect(); return; } setJoining(true); joinRoom(code, profile.name.trim()); setMode("private_waiting_joiner"); }} disabled={code.length < 3 || joining} activeOpacity={0.82}>
                {joining ? <ActivityIndicator color="#fff" /> : <Text style={[s.btnFillTitle, { textAlign: "center", flex: 1 }]}>Join Room</Text>}
              </TouchableOpacity>
              
              <View style={s.divider}><View style={s.divLine} /><Text style={s.divText}>or</Text><View style={s.divLine} /></View>
              
              <TouchableOpacity style={s.btnGhost} onPress={() => { if (!isConnected) { reconnect(); return; } createRoom(profile.name.trim()); setMode("private_waiting_creator"); }} activeOpacity={0.82}>
                <View style={s.btnGhostLeft}><Sparkles size={24} color={COLORS.sub} /><View><Text style={s.btnGhostTitle}>Create New Room</Text><Text style={s.btnGhostSub}>Get a code to share</Text></View></View>
                <Text style={[s.btnArrow, { color: COLORS.purple }]}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CREATOR WAITING */}
          {mode === "private_waiting_creator" && (
            <View style={[s.stateCard, { marginTop: 40 }]}>
              <View style={s.stateBlock}>
                <PartyPopper size={44} color={COLORS.pink} />
                <Text style={s.stateTitle}>Room Ready!</Text>
                <Text style={s.stateSub}>Share this code with your friend</Text>
                <View style={s.codeCard}>
                  <Text style={s.codeCardLabel}>ROOM CODE</Text>
                  <Text style={s.codeCardValue}>{roomId ?? "···"}</Text>
                </View>
                <View style={s.waitRow}>
                  <ActivityIndicator size="small" color={COLORS.pink} />
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
            <View style={[s.stateCard, { marginTop: 40 }]}>
              <View style={s.stateBlock}>
                <Hourglass size={44} color={COLORS.purple} />
                <Text style={s.stateTitle}>Joining room...</Text>
                <Text style={s.stateSub}>Code: <Text style={{ color: COLORS.pink, fontWeight: "800" }}>{code}</Text></Text>
                <ActivityIndicator size="large" color={COLORS.purple} style={{ marginTop: 16 }} />
                <Text style={s.stateHint}>{players.length === 2 ? "✓ Connected! Starting..." : "Connecting..."}</Text>
              </View>
              <TouchableOpacity style={s.btnDanger} onPress={() => { quitGame(); setMode("home"); setJoining(false); setCode(""); }} activeOpacity={0.82}>
                <Text style={s.btnDangerText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
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
  logoTruth: { fontSize: 22, fontWeight: "900", color: COLORS.electricBlue, letterSpacing: -0.5, lineHeight: 22, zIndex: 0 },
  logoOr: { position: "absolute", fontSize: 13, fontWeight: "900", color: COLORS.text, opacity: 0.8, letterSpacing: 2, zIndex: 2, alignSelf: "center", top: 14 },
  logoDare: { fontSize: 28, fontWeight: "900", color: COLORS.pink, letterSpacing: 1, lineHeight: 28, zIndex: 0 },

  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.pink, zIndex: 1, borderWidth: 1.5, borderColor: COLORS.bg },

  // ── Online Players ──
  onlineRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green },
  onlineTxt: { fontSize: 12, color: COLORS.sub, fontWeight: "600", letterSpacing: 0.5 },

  // ── Profile Banner ──
  profileBanner: { backgroundColor: "rgba(255, 0, 110, 0.1)", borderRadius: RADIUS.small, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255, 0, 110, 0.3)" },
  profileBannerTitle: { color: COLORS.pink, fontSize: 14, fontWeight: "800" },
  profileBannerSub: { color: COLORS.sub, fontSize: 11, marginTop: 2 },
  profileBannerArrow: { color: COLORS.pink, fontSize: 20, fontWeight: "300" },

  // ── Match Cards ──
  matchCard: {
    backgroundColor: "rgba(26, 16, 64, 0.85)",
    borderRadius: RADIUS.cardSm,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    overflow: "hidden",
    ...SHADOWS.subtle,
  },
  matchCardPrivate: { backgroundColor: "rgba(26, 10, 18, 0.85)", borderColor: "rgba(255, 0, 110, 0.3)" },
  matchContent: { flexDirection: "row", alignItems: "center", padding: 18 },
  matchIconWrap: { width: 48, height: 48, borderRadius: RADIUS.icon, backgroundColor: "rgba(139, 92, 246, 0.15)", alignItems: "center", justifyContent: "center", marginRight: 14 },
  matchIconWrapPink: { backgroundColor: "rgba(255, 0, 110, 0.15)" },
  matchTextCol: { flex: 1, paddingRight: 8 },
  matchTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginBottom: 3 },
  matchDesc: { color: COLORS.sub, fontSize: 11, lineHeight: 15 },
  matchBtnPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  matchBtnText: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  matchBtnArrow: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  matchBtnPillPink: { backgroundColor: COLORS.pink },

  // ── Game Modes ──
  modesSection: { marginTop: 4, marginBottom: 16 },
  modesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modesTitle: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  spicyToggle: { flexDirection: "row", alignItems: "center", gap: 8 },
  spicyLabel: { color: COLORS.sub, fontSize: 12, fontWeight: "600" },

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
  featureNumber: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  featureLabel: { color: COLORS.sub, fontSize: 10, fontWeight: "600" },

  // ── Profile Screen ──
  profileContainer: { gap: 16, paddingTop: 24 },

  // Avatar Section
  profileAvatarSection: { alignItems: "center", marginBottom: 8 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.pinkGlow,
  },
  avatarGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    backgroundColor: COLORS.cardDark,
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
    backgroundColor: COLORS.cardDark,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  editableName: { color: COLORS.text, fontWeight: "900", textAlign: "center", paddingVertical: 6, marginTop: 8, width: "100%", maxWidth: 280 },
  displayNameRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, paddingVertical: 6 },
  displayName: { color: COLORS.text, fontSize: 24, fontWeight: "900", textAlign: "center" },
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
    borderColor: COLORS.border,
  },
  achievementLabel: { color: COLORS.text, fontSize: 12, fontWeight: "700" },

  // Stats Card
  statsCard: {
    flexDirection: "row",
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  statColumn: { flex: 1, alignItems: "center", gap: 4 },
  statNumber: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  statLabel: { color: COLORS.sub, fontSize: 11, fontWeight: "600" },
  statDate: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
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
    borderColor: COLORS.border,
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { color: COLORS.sub, fontSize: 11, fontWeight: "700" },

  // Bio Card
  bioCard: {
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  bioHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  bioTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  bioInput: { color: COLORS.text, fontSize: 13, fontWeight: "400", lineHeight: 20, minHeight: 36, paddingVertical: 2 },
  bioText: { color: COLORS.text, fontSize: 13, fontWeight: "400", lineHeight: 20 },

  // Interests Card
  interestsCard: {
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  interestsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  interestsTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
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
    borderColor: COLORS.border,
  },
  interestChipLabel: { fontSize: 12, fontWeight: "600", color: COLORS.sub },

  // ── State/Waiting Cards ──
  stateCard: { backgroundColor: "rgba(23, 19, 50, 0.85)", borderRadius: RADIUS.cardSm, padding: 24, borderWidth: 1, borderColor: COLORS.border, gap: 14, ...SHADOWS.subtle },
  stateBlock: { alignItems: "center", paddingVertical: 16, gap: 10 },
  pulseRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.pinkLight, borderWidth: 2, borderColor: COLORS.pink, alignItems: "center", justifyContent: "center" },
  stateTitle: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  stateSub: { color: COLORS.sub, fontSize: 14 },
  stateHint: { color: COLORS.sub, fontSize: 12, textAlign: "center", marginTop: 4 },
  
  btnDanger: { borderRadius: RADIUS.button, paddingVertical: 16, alignItems: "center", backgroundColor: COLORS.pinkLight, borderWidth: 1, borderColor: `${COLORS.pink}66` },
  btnDangerText: { color: COLORS.pink, fontSize: 15, fontWeight: "800" },
  
  backBtn: { alignSelf: "flex-start", paddingBottom: 10 },
  backBtnText: { color: COLORS.sub, fontSize: 14, fontWeight: "700" },
  fieldWrap: { gap: 10 },
  fieldLabel: { fontSize: 11, fontWeight: "800", color: COLORS.sub, letterSpacing: 2 },
  inputBox: { backgroundColor: COLORS.bg, borderRadius: RADIUS.small, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center" },
  codeInput: { color: COLORS.pink, fontSize: 32, fontWeight: "900", letterSpacing: 14, textAlign: "center" },
  
  btnFill: { backgroundColor: COLORS.pink, borderRadius: RADIUS.button, paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  btnFillTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  btnGhost: { backgroundColor: "rgba(23, 19, 50, 0.85)", borderRadius: RADIUS.button, paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: COLORS.border },
  btnGhostLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  btnGhostTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  btnGhostSub: { color: COLORS.sub, fontSize: 12, marginTop: 2 },
  btnArrow: { color: "rgba(255,255,255,0.8)", fontSize: 22, fontWeight: "300" },
  
  divider: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  divText: { color: COLORS.sub, fontSize: 13, fontWeight: "600" },
  
  codeCard: { backgroundColor: COLORS.bg, borderRadius: RADIUS.small, paddingHorizontal: 40, paddingVertical: 20, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  codeCardLabel: { color: COLORS.sub, fontSize: 11, fontWeight: "800", letterSpacing: 3, marginBottom: 8 },
  codeCardValue: { color: COLORS.pink, fontSize: 48, fontWeight: "900", letterSpacing: 12 },
  waitRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  waitRowText: { color: COLORS.sub, fontSize: 14 },

});
