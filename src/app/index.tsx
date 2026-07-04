import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useState } from "react";
import MenuScreen from "./menu";
import GameScreen from "./game";
import ErrorScreen from "./error";
import QuestionsScreen from "./questions";
import CommunityScreen from "./community";

type AppScreen = "menu" | "questions" | "community";

const BG = "#f8faff", CARD = "#ffffff", BLUE = "#3b82f6";
const BLUE_D = "#1d4ed8", BLUE_L = "#eff6ff";
const SUB = "#64748b", BORDER = "#e2e8f0";

const NAV_TABS = [
  { key: "home",      label: "Home",      emoji: "🏠" },
  { key: "profile",   label: "Profile",   emoji: "👤" },
  { key: "questions", label: "Questions", emoji: "🃏" },
  { key: "community", label: "Community", emoji: "📣" },
];

function BottomNav({ current, onNavigate }: { current: AppScreen; onNavigate: (s: AppScreen) => void }) {
  return (
    <View style={s.bottomNav}>
      {NAV_TABS.map(tab => {
        const isActive = (tab.key === "home" || tab.key === "profile") ? current === "menu" : current === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[s.navItem, isActive && s.navItemActive]}
            onPress={() => onNavigate(tab.key === "home" || tab.key === "profile" ? "menu" : tab.key as AppScreen)}
            activeOpacity={0.85}
          >
            <Text style={s.navIcon}>{tab.emoji}</Text>
            <Text style={[s.navLabel, isActive && s.navLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AppContent() {
  const { phase, isConnected } = useGame();
  const [screen, setScreen] = useState<AppScreen>("menu");

  // Connecting spinner
  if (!isConnected && phase === "connecting") {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

  // Error screen
  if (phase === "error") return <ErrorScreen />;

  // Disconnected mid-game → error
  if (!isConnected && phase !== "menu" && phase !== "waiting" && phase !== "connecting") {
    return <ErrorScreen />;
  }

  // Game is active
  if (phase !== "menu" && phase !== "waiting") {
    return <GameScreen />;
  }

  // Sub-screens with bottom nav
  if (screen === "questions") {
    return (
      <View style={{ flex: 1 }}>
        <QuestionsScreen />
        <BottomNav current={screen} onNavigate={setScreen} />
      </View>
    );
  }
  if (screen === "community") {
    return (
      <View style={{ flex: 1 }}>
        <CommunityScreen />
        <BottomNav current={screen} onNavigate={setScreen} />
      </View>
    );
  }

  // Menu / Lobby
  return <MenuScreen onNavigate={(s) => setScreen(s)} />;
}

const s = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 12,
  },
  navItemActive: { backgroundColor: BLUE_L },
  navIcon: { fontSize: 18, marginBottom: 2 },
  navLabel: { color: SUB, fontSize: 10, fontWeight: "700" },
  navLabelActive: { color: BLUE_D },
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
