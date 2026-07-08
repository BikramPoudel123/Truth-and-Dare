import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useState } from "react";
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

  if (screen === "questions") {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <QuestionsScreen />
        <BottomNav activeTab="questions" onNavigate={(tab) => { setMenuTab(tab); setScreen(tab === "home" || tab === "profile" ? "menu" : tab as AppScreen); }} />
      </View>
    );
  }
  if (screen === "community") {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <CommunityScreen />
        <BottomNav activeTab="community" onNavigate={(tab) => { setMenuTab(tab); setScreen(tab === "home" || tab === "profile" ? "menu" : tab as AppScreen); }} />
      </View>
    );
  }

  if (screen === "friends") {
    return <FriendsScreen onBack={() => { setScreen("menu"); setMenuTab("home"); }} />;
  }
  if (screen === "notifications") {
    return <NotificationsScreen onBack={() => { setScreen("menu"); setMenuTab("home"); }} />;
  }
  if (screen === "settings") {
    return <SettingsScreen onBack={() => { setScreen("menu"); setMenuTab("home"); }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <MenuScreen key={menuTab} onNavigate={(s) => { setMenuTab("home"); setScreen(s); }} initialMode={menuTab} />
      <BottomNav
        activeTab={menuTab}
        onNavigate={(tab) => {
          setMenuTab(tab);
          if (tab === "questions" || tab === "community") {
            setScreen(tab as AppScreen);
          }
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({});

export default function App() {
  return (
    <ProfileProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </ProfileProvider>
  );
}
