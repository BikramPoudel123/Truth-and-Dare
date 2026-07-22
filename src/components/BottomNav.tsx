import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Home, User, HelpCircle, Users } from "lucide-react-native";

const NAV_TABS = [
  { key: "home",      label: "Home",      icon: "Home" },
  { key: "profile",   label: "Profile",   icon: "User" },
  { key: "questions", label: "Questions", icon: "HelpCircle" },
  { key: "community", label: "Community", icon: "Users" },
];

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const icons: Record<string, React.ComponentType<{ size: number; color: string }>> = { Home, User, HelpCircle, Users };

function BottomNavInner({ activeTab, onNavigate }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View style={[s.bottomNav, { paddingBottom: insets.bottom || 8, backgroundColor: colors.navBg, borderTopColor: colors.border }]}>
      {NAV_TABS.map(tab => {
        const isActive = tab.key === activeTab;
        const IconComp = icons[tab.icon];
        return (
          <TouchableOpacity
            key={tab.key}
            style={s.navItem}
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.85}
          >
            <View style={s.navIconWrap}>
              {IconComp && <IconComp size={18} color={isActive ? colors.text : colors.sub} />}
            </View>
            <View style={[s.navLabelWrap, isActive && { backgroundColor: colors.navActiveBg }]}>
              <Text style={[s.navLabel, isActive && s.navLabelActive, { color: isActive ? colors.text : colors.sub }]}>{tab.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default memo(BottomNavInner);

const s = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    paddingTop: 2,
    paddingHorizontal: 4,
    borderTopWidth: 1,
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
  navLabel: { fontSize: 9, fontWeight: "700" },
  navLabelActive: {},
  navLabelWrap: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
});
