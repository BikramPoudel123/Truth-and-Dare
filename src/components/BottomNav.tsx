import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants/design-system";

const NAV_TABS = [
  { key: "home",      label: "Home",      icon: "🏠" },
  { key: "profile",   label: "Profile",   icon: "👤" },
  { key: "questions", label: "Questions", icon: "❓" },
  { key: "community", label: "Community", icon: "👥" },
];

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export default function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  return (
    <View style={s.bottomNav}>
      {NAV_TABS.map(tab => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={s.navItem}
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.85}
          >
            <View style={s.navIconWrap}>
              <Text style={[s.navIcon, isActive && s.navIconActive]}>{tab.icon}</Text>
            </View>
            <Text style={[s.navLabel, isActive && s.navLabelActive]}>{tab.label}</Text>
            {isActive && <View style={s.navUnderline} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#060411",
    paddingTop: 2,
    paddingBottom: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    borderRadius: 20,
    position: "relative",
  },
  navIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  navIcon: { fontSize: 18, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navLabel: { color: COLORS.sub, fontSize: 9, fontWeight: "700" },
  navLabelActive: { color: COLORS.text },
  navUnderline: {
    position: "absolute",
    bottom: 2,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.purple,
  },
});
