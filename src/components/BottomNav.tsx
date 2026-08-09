import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Gamepad2, CircleQuestionMark, MessagesSquare, Settings } from "lucide-react-native";
import { BrandGradient } from "@/components/BrandGradient";

const NAV_TABS = [
  { key: "home",      label: "Game",       icon: "Gamepad2" },
  { key: "questions", label: "Questions",  icon: "CircleQuestionMark" },
  { key: "community", label: "Community",  icon: "MessagesSquare" },
  { key: "settings",  label: "Settings",   icon: "Settings" },
];

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const icons: Record<string, React.ComponentType<{ size: number; color: string }>> = { Gamepad2, CircleQuestionMark, MessagesSquare, Settings };

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
            {isActive ? (
              <BrandGradient variant="primary" style={s.navIconActive}>
                <IconComp size={20} color="#fff" />
              </BrandGradient>
            ) : (
              <View style={s.navIcon}>
                <IconComp size={20} color={colors.sub} />
              </View>
            )}
            <Text style={[s.navLabel, { color: isActive ? colors.text : colors.sub }, isActive && s.navLabelActive]}>
              {tab.label}
            </Text>
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
    paddingTop: 8,
    paddingHorizontal: 6,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  navIcon: {
    width: 44,
    height: 32,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconActive: {
    width: 48,
    height: 32,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  navLabelActive: { fontWeight: "900" },
});
