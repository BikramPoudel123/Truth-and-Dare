import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface FlameBackgroundProps {
  /** Extra opacity factor for light/dark tuning. */
  strength?: number;
  /**
   * "top" = subtle wash that fades out near the bottom (default, other screens).
   * "full" = Tinder flame gradient that tints the entire screen (home page).
   */
  variant?: "top" | "full";
}

/**
 * Tinder-style flame wash (pink -> orange) rendered behind screen content.
 * Place as the first, absolutely positioned child of the screen root.
 */
export function FlameBackground({ strength = 1, variant = "top" }: FlameBackgroundProps) {
  const { isDark } = useTheme();
  const o = (v: number) => (v * strength);
  const colors: [string, string, string] = variant === "full"
    ? isDark
      ? [`rgba(253,38,122,${o(0.30)})`, `rgba(255,96,54,${o(0.20)})`, `rgba(253,38,122,${o(0.12)})`]
      : [`rgba(253,38,122,${o(0.16)})`, `rgba(255,96,54,${o(0.12)})`, `rgba(253,38,122,${o(0.07)})`]
    : isDark
      ? [`rgba(253,38,122,${o(0.22)})`, `rgba(255,96,54,${o(0.12)})`, "rgba(13,13,16,0)"]
      : [`rgba(253,38,122,${o(0.12)})`, `rgba(255,96,54,${o(0.06)})`, "rgba(255,255,255,0)"];
  const locations: [number, number, number] = variant === "full" ? [0, 0.45, 1] : [0, 0.4, 0.8];
  return (
    <LinearGradient
      pointerEvents="none"
      colors={colors}
      locations={locations}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
