import { memo } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { BrandGradient } from "@/components/BrandGradient";

export interface GamepadAction {
  key: string;
  icon: React.ReactNode;
  color: string;
  onPress?: () => void;
  label?: string;
  disabled?: boolean;
  active?: boolean;
  /** Render as a filled gradient circle instead of a bordered glass circle. */
  fill?: boolean;
  /** Suffix appended to the label (e.g. attachment count). */
  badge?: string;
}

interface GamepadProps {
  actions: GamepadAction[];
  size?: number;
  /** Make this index's button larger (Tinder-style center action). -1 = none. */
  centerIndex?: number;
  style?: ViewStyle | ViewStyle[];
}

function GamepadInner({ actions, size = 56, centerIndex = -1, style }: GamepadProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, style]}>
      {actions.map((a, i) => {
        const isCenter = centerIndex === i;
        const btnSize = isCenter ? size * 1.2 : size;
        const Icon = a.icon;
        const circleStyle = [
          styles.circle,
          {
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
          },
        ];
        return (
          <TouchableOpacity
            key={a.key}
            onPress={a.onPress}
            disabled={a.disabled}
            activeOpacity={0.75}
            style={[styles.item, a.disabled && styles.disabled]}
          >
            {a.fill ? (
              <BrandGradient
                colors={[a.color, "#ff6036"]}
                style={[circleStyle, { overflow: "hidden" }, { ...(a.active ? styles.glowOn : {}) }]}
              >
                <View style={{ alignItems: "center", justifyContent: "center" }} pointerEvents="none">
                  {typeof Icon === "string" ? <Text style={{ fontSize: btnSize * 0.5 }}>{Icon}</Text> : Icon}
                </View>
              </BrandGradient>
            ) : (
              <View
                style={[
                  circleStyle,
                  {
                    borderColor: a.active ? a.color : colors.borderLight,
                    backgroundColor: a.active ? `${a.color}22` : colors.glassBg,
                  },
                  { ...(a.active ? { shadowColor: a.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 } : {}) },
                ]}
              >
                {typeof Icon === "string" ? <Text style={{ fontSize: btnSize * 0.5 }}>{Icon}</Text> : Icon}
              </View>
            )}
            {a.label ? (
              <Text style={[styles.label, { color: a.active ? a.color : colors.sub }]}>{a.label}{a.badge ? a.badge : ""}</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const Gamepad = memo(GamepadInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  item: {
    alignItems: "center",
    gap: 4,
  },
  disabled: {
    opacity: 0.45,
  },
  glowOn: {
    shadowColor: "#fd267a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  circle: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
