import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useState } from "react";
import MenuScreen from "./menu";
import GameScreen from "./game";
import ErrorScreen from "./error";
import QuestionsScreen from "./questions";
import CommunityScreen from "./community";
import { COLORS } from "@/constants/design-system";
import BottomNav from "@/components/BottomNav";

type AppScreen = "menu" | "questions" | "community";

function AppContent() {
  const { phase, isConnected } = useGame();
  const [screen, setScreen] = useState<AppScreen>("menu");

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
        <BottomNav activeTab="questions" onNavigate={(tab) => setScreen(tab === "home" || tab === "profile" ? "menu" : tab as AppScreen)} />
      </View>
    );
  }
  if (screen === "community") {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <CommunityScreen />
        <BottomNav activeTab="community" onNavigate={(tab) => setScreen(tab === "home" || tab === "profile" ? "menu" : tab as AppScreen)} />
      </View>
    );
  }

  return <MenuScreen onNavigate={(s) => setScreen(s)} />;
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
