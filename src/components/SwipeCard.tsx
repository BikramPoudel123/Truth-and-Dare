import { forwardRef, useCallback, useImperativeHandle, useMemo } from "react";
import { StyleSheet, Text, ViewStyle } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

export interface SwipeCardHandle {
  /** Programmatically fling the card in a direction. */
  swipe: (dir: "left" | "right") => void;
}

export interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  leftLabel?: string;
  rightLabel?: string;
  leftColor?: string;
  rightColor?: string;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
}

const THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  {
    children,
    onSwipeLeft,
    onSwipeRight,
    leftLabel = "NOPE",
    rightLabel = "LIKE",
    leftColor = "#ff4d4d",
    rightColor = "#34c271",
    style,
    disabled = false,
  },
  ref,
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const flyOff = useCallback((dir: "left" | "right") => {
    const target = dir === "left" ? -600 : 600;
    translateX.value = withTiming(target, { duration: 220 }, (finished) => {
      if (finished) {
        const cb = dir === "left" ? onSwipeLeft : onSwipeRight;
        runOnJS(cb)();
      }
    });
  }, [onSwipeLeft, onSwipeRight]);

  const reset = useCallback(() => {
    translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
  }, []);

  useImperativeHandle(ref, () => ({
    swipe: (dir) => {
      if (disabled) return;
      flyOff(dir);
    },
  }));

  const pan = useMemo(() => {
    if (disabled) return Gesture.Pan();
    return Gesture.Pan()
      .activeOffsetX([-12, 12])
      .onUpdate((e) => {
        translateX.value = e.translationX;
        translateY.value = Math.max(-60, Math.min(60, e.translationY * 0.35));
      })
      .onEnd((e) => {
        const shouldFling =
          Math.abs(e.translationX) > THRESHOLD || Math.abs(e.velocityX) > VELOCITY_THRESHOLD;
        if (shouldFling) {
          flyOff(e.translationX > 0 ? "right" : "left");
        } else {
          reset();
        }
      });
  }, [disabled, flyOff, reset, translateX, translateY]);

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-350, 0, 350], [-14, 0, 14]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const leftStampStyle = useAnimatedStyle(() => {
    const o = interpolate(
      translateX.value,
      [0, -90],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const r = interpolate(translateX.value, [0, -350], [0, -18], Extrapolation.CLAMP);
    return { opacity: o, transform: [{ rotate: `${r}deg` }] };
  });

  const rightStampStyle = useAnimatedStyle(() => {
    const o = interpolate(translateX.value, [0, 90], [0, 1], Extrapolation.CLAMP);
    const r = interpolate(translateX.value, [0, 350], [0, 18], Extrapolation.CLAMP);
    return { opacity: o, transform: [{ rotate: `${r}deg` }] };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.wrap, style, cardStyle]}>
        {children}

        <Animated.View
          pointerEvents="none"
          style={[styles.stamp, styles.stampLeft, leftStampStyle, { borderColor: leftColor }]}
        >
          <Text style={[styles.stampText, { color: leftColor }]}>{leftLabel}</Text>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.stamp, styles.stampRight, rightStampStyle, { borderColor: rightColor }]}
        >
          <Text style={[styles.stampText, { color: rightColor }]}>{rightLabel}</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
  },
  stamp: {
    position: "absolute",
    top: 18,
    borderWidth: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  stampLeft: { left: 14 },
  stampRight: { right: 14 },
  stampText: { fontSize: 26, fontWeight: "900", letterSpacing: 2 },
});
