import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const DIMS = {
  sm: { icon: 30, text: 19, gap: 7 },
  md: { icon: 40, text: 25, gap: 8 },
  lg: { icon: 52, text: 30, gap: 10 },
} as const;

/** Bundled condensed font (loaded in src/app/index.tsx) — identical on every device. */
const WORDMARK_FONT = "BarlowCondensed-Bold";

/**
 * Brand logo: pill icon image + "Truth or Dare" wordmark.
 * The icon (assets/images/logo-icon.png) mirrors the store-listing app pill.
 */
export function Logo({ size = "md" }: LogoProps) {
  const { colors } = useTheme();
  const d = DIMS[size];
  const orColor = "rgba(28,28,30,0.8)";

  return (
    <View style={[styles.row, { gap: d.gap }]}>
      <Image
        source={require("@/assets/images/logo.png")}
        style={{ width: d.icon, height: d.icon }}
      />
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
