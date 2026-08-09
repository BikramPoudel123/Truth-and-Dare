import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { BrandGradient } from "@/components/BrandGradient";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const DIMS = {
  sm: { icon: 30, radius: 10, emoji: 16, text: 19, gap: 7 },
  md: { icon: 40, radius: 12, emoji: 22, text: 25, gap: 8 },
  lg: { icon: 52, radius: 15, emoji: 28, text: 30, gap: 10 },
} as const;

/** Bundled condensed font (loaded in src/app/index.tsx) — identical on every device. */
const WORDMARK_FONT = "BarlowCondensed-Bold";

/**
 * Brand logo: gradient rounded-square with 🎭 + "Truth or Dare" wordmark.
 * Mirrors the store-listing app pill. All words share the same font size.
 */
export function Logo({ size = "md" }: LogoProps) {
  const { colors, isDark } = useTheme();
  const d = DIMS[size];
  const orColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(28,28,30,0.8)";

  return (
    <View style={[styles.row, { gap: d.gap }]}>
      <BrandGradient
        variant="primary"
        style={{ width: d.icon, height: d.icon, borderRadius: d.radius, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ fontSize: d.emoji, lineHeight: d.emoji + 2 }}>🎭</Text>
      </BrandGradient>
      <Text
        style={{
          color: colors.text,
          fontSize: d.text,
          fontFamily: WORDMARK_FONT,
          letterSpacing: 0,
          lineHeight: d.text + 2,
        }}
      >
        <Text style={{ color: colors.truth }}>Truth </Text>
        <Text style={{ color: orColor }}>or </Text>
        <Text style={{ color: colors.dare }}>Dare</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});
