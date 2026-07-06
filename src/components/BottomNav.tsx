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
            style={[s.navItem, isActive && s.navItemActive]}
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.85}
          >
            <View style={[s.navIconWrap, isActive && s.navIconWrapActive]}>
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
    paddingTop: 4,
    paddingBottom: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 20,
    position: "relative",
  },
  navItemActive: {
    backgroundColor: "rgba(131, 56, 236, 0.15)",
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  navIconWrapActive: {
    backgroundColor: "rgba(131, 56, 236, 0.2)",
    marginTop: -8,
  },
  navIcon: { fontSize: 18, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navLabel: { color: COLORS.sub, fontSize: 9, fontWeight: "700" },
  navLabelActive: { color: COLORS.text },
  navUnderline: {
    position: "absolute",
    bottom: 4,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.purple,
  },
});
