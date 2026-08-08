import { LinearGradient } from "expo-linear-gradient";
import { StyleProp, ViewStyle, ViewProps } from "react-native";
import { GRADIENTS } from "@/constants/design-system";

interface BrandGradientProps {
  children?: React.ReactNode;
  /** Named gradient from GRADIENTS, or explicit colors. */
  variant?: keyof typeof GRADIENTS | "primary" | "hero" | "quickMatch" | "privateGame" | "match";
  colors?: [string, string] | string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  angle?: number;
  pointerEvents?: ViewProps["pointerEvents"];
}

export function BrandGradient({
  children,
  variant = "primary",
  colors,
  start,
  end,
  style,
  pointerEvents,
}: BrandGradientProps) {
  const g = GRADIENTS[variant] ?? GRADIENTS.primary;
  const resolved = (colors ?? [g.start, g.end]) as [string, string, ...string[]];
  return (
    <LinearGradient
      colors={resolved}
      start={start ?? { x: 0, y: 0 }}
      end={end ?? { x: 1, y: 1 }}
      style={style}
      pointerEvents={pointerEvents}
    >
      {children}
    </LinearGradient>
  );
}
