import { ActivityIndicator, Animated, StyleSheet, View } from "react-native";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useCallback, useRef, useState } from "react";
import MenuScreen from "./menu";
import GameScreen from "./game";
import ErrorScreen from "./error";
import QuestionsScreen from "./questions";
import CommunityScreen from "./community";
import FriendsScreen from "./friends";
import NotificationsScreen from "./notifications";
import SettingsScreen from "./settings";
import { COLORS } from "@/constants/design-system";
import BottomNav from "@/components/BottomNav";

type AppScreen = "menu" | "questions" | "community" | "friends" | "notifications" | "settings";

function AppContent() {
  const { phase, isConnected } = useGame();
  const [screen, setScreen] = useState<AppScreen>("menu");
  const [menuTab, setMenuTab] = useState("home");
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

  if (!isConnected && phase === "connecting") {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={COLORS.purple} />
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

  const isBackScreen = screen === "friends" || screen === "notifications" || screen === "settings";

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {!isBackScreen && (
        <View style={{ flex: 1, position: "relative" }}>
          <Animated.View style={[s.screenAbs, { opacity: menuOpacity }]} pointerEvents={isActive("menu") ? "auto" : "none"}>
            <MenuScreen onNavigate={(s) => { setMenuTab("home"); setScreen(s); }} initialMode={menuTab} />
          </Animated.View>

          <Animated.View style={[s.screenAbs, { opacity: questionsOpacity }]} pointerEvents={isActive("questions") ? "auto" : "none"}>
            <QuestionsScreen />
          </Animated.View>

          <Animated.View style={[s.screenAbs, { opacity: communityOpacity }]} pointerEvents={isActive("community") ? "auto" : "none"}>
            <CommunityScreen />
          </Animated.View>
        </View>
      )}

      {isActive("friends") && <FriendsScreen key={friendsInitialTab} onBack={goHome} initialTab={friendsInitialTab} />}
      {isActive("notifications") && <NotificationsScreen onBack={goHome} onNavigateFriends={navigateToFriendsRequests} />}
      {isActive("settings") && <SettingsScreen onBack={goHome} />}

      {!isBackScreen && (
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
  return (
    <ProfileProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </ProfileProvider>
  );
}
