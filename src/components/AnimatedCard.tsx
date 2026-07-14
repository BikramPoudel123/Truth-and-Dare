import { useRef } from "react";
import { Animated, TouchableOpacity, ViewStyle } from "react-native";

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle[];
  activeOpacity?: number;
  scaleTo?: number;
  disabled?: boolean;
}

export function AnimatedCard({ children, onPress, style, activeOpacity = 0.92, scaleTo = 0.96, disabled }: AnimatedCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, friction: 8, tension: 200 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 150 }).start();
  };

  if (!onPress) {
    return <Animated.View style={[{ transform: [{ scale }] }, ...(style || [])]}>{children}</Animated.View>;
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, ...(style || [])]}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={activeOpacity} disabled={disabled}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
