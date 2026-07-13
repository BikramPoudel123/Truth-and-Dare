import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useCallback, useState } from "react";
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

  // Hooks must be called on every render before any early return
  const goHome = useCallback(() => { setScreen("menu"); setMenuTab("home"); setFriendsInitialTab("friends"); }, []);
  const onNav = useCallback((tab: string) => {
    setMenuTab(tab);
    if (tab === "questions" || tab === "community") {
      setScreen(tab as AppScreen);
    } else {
      setScreen("menu");
    }
  }, []);

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
      {/* Tab screens always mounted — only active one is visible/interactive */}
      {!isBackScreen && (
        <View style={{ flex: 1, position: "relative" }}>
          {/* Menu */}
          <View style={[s.screenAbs, { opacity: isActive("menu") ? 1 : 0 }]} pointerEvents={isActive("menu") ? "auto" : "none"}>
            <MenuScreen key={menuTab} onNavigate={(s) => { setMenuTab("home"); setScreen(s); }} initialMode={menuTab} />
          </View>

          {/* Questions */}
          <View style={[s.screenAbs, { opacity: isActive("questions") ? 1 : 0 }]} pointerEvents={isActive("questions") ? "auto" : "none"}>
            <QuestionsScreen />
          </View>

          {/* Community */}
          <View style={[s.screenAbs, { opacity: isActive("community") ? 1 : 0 }]} pointerEvents={isActive("community") ? "auto" : "none"}>
            <CommunityScreen />
          </View>
        </View>
      )}

      {/* Back screens — fill entire space when active */}
      {isActive("friends") && <FriendsScreen key={friendsInitialTab} onBack={goHome} initialTab={friendsInitialTab} />}
      {isActive("notifications") && <NotificationsScreen onBack={goHome} onNavigateFriends={navigateToFriendsRequests} />}
      {isActive("settings") && <SettingsScreen onBack={goHome} />}

      {/* Single BottomNav at the bottom */}
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
