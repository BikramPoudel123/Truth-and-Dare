import { ActivityIndicator, Animated, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import MenuScreen from "./menu";
import GameScreen from "./game";
import ErrorScreen from "./error";
import QuestionsScreen from "./questions";
import CommunityScreen from "./community";
import FriendsScreen from "./friends";
import NotificationsScreen from "./notifications";
import SettingsScreen from "./settings";
import BottomNav from "@/components/BottomNav";
import { AppBackground } from "@/components/AppBackground";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync().catch(() => {});

type AppScreen = "menu" | "questions" | "community" | "friends" | "notifications" | "settings";

function AppContent() {
  const { phase, isConnected } = useGame();
  const { colors } = useTheme();
  const [screen, setScreen] = useState<AppScreen>("menu");
  const [menuTab, setMenuTab] = useState("home");
  const [menuMode, setMenuMode] = useState("home");
  const [friendsInitialTab, setFriendsInitialTab] = useState<"friends" | "requests">("friends");

  const menuOpacity = useRef(new Animated.Value(1)).current;
  const questionsOpacity = useRef(new Animated.Value(0)).current;
  const communityOpacity = useRef(new Animated.Value(0)).current;

  const prevScreen = useRef<AppScreen>("menu");

  const animateTransition = useCallback((next: AppScreen) => {
    const screens: { key: AppScreen; opacity: Animated.Value }[] = [
      { key: "menu", opacity: menuOpacity },
      { key: "questions", opacity: questionsOpacity },
      { key: "community", opacity: communityOpacity },
    ];
    const outgoing = screens.find(s => s.key === prevScreen.current);
    const incoming = screens.find(s => s.key === next);
    if (!outgoing || !incoming || prevScreen.current === next) return;

    Animated.parallel([
      Animated.timing(outgoing.opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(incoming.opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    prevScreen.current = next;
  }, [menuOpacity, questionsOpacity, communityOpacity]);

  const goHome = useCallback(() => { setScreen("menu"); setMenuTab("home"); setFriendsInitialTab("friends"); }, []);
  const onNav = useCallback((tab: string) => {
    setMenuTab(tab);
    if (tab === "questions" || tab === "community") {
      const next = tab as AppScreen;
      animateTransition(next);
      setScreen(next);
    } else if (tab === "settings") {
      setScreen("settings");
    } else {
      animateTransition("menu");
      setScreen("menu");
    }
  }, [animateTransition]);

  const navigateToFriendsRequests = useCallback(() => {
    setFriendsInitialTab("requests");
    setScreen("friends");
  }, []);

  const isActive = (s: AppScreen) => screen === s;
  const activeTab = screen === "menu" ? menuTab : screen;

  const isBackScreen = screen === "friends" || screen === "notifications";
  const isProfileMode = screen === "menu" && menuMode === "profile";
  const showNav = !isBackScreen && !isProfileMode;

  if (!isConnected && phase === "connecting") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <AppBackground />
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  if (phase === "error") return <ErrorScreen />;

  if (!isConnected && phase !== "menu" && phase !== "waiting" && phase !== "connecting") {
    return <ErrorScreen />;
  }

  if (phase !== "menu" && phase !== "waiting") {
    return <GameScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <AppBackground />
      {!isBackScreen && (
        <View style={{ flex: 1, position: "relative" }}>
          <Animated.View style={[s.screenAbs, { opacity: menuOpacity }]} pointerEvents={isActive("menu") ? "auto" : "none"}>
            <MenuScreen onNavigate={(s) => { setMenuTab("home"); setScreen(s); }} initialMode={menuTab} onModeChange={setMenuMode} />
          </Animated.View>

          <Animated.View style={[s.screenAbs, { opacity: questionsOpacity }]} pointerEvents={isActive("questions") ? "auto" : "none"}>
            <QuestionsScreen />
          </Animated.View>

          <Animated.View style={[s.screenAbs, { opacity: communityOpacity }]} pointerEvents={isActive("community") ? "auto" : "none"}>
            <CommunityScreen />
          </Animated.View>

          {isActive("settings") && (
            <View style={s.screenAbs}>
              <SettingsScreen />
            </View>
          )}
        </View>
      )}

      {isActive("friends") && <FriendsScreen key={friendsInitialTab} onBack={goHome} initialTab={friendsInitialTab} />}
      {isActive("notifications") && <NotificationsScreen onBack={goHome} onNavigateFriends={navigateToFriendsRequests} />}

      {showNav && (
        <BottomNav activeTab={activeTab} onNavigate={onNav} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screenAbs: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    "BarlowCondensed-Bold": require("@/assets/fonts/BarlowCondensed-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <ThemeProvider>
        <ProfileProvider>
          <GameProvider>
            <AppContent />
          </GameProvider>
        </ProfileProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
