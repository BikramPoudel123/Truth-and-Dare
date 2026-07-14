import { useEffect, useRef } from "react";
import { Animated, View, ViewStyle } from "react-native";

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

interface ParticleBurstProps {
  trigger: boolean;
  count?: number;
  colors?: string[];
  origin?: { x: number; y: number };
  spread?: number;
  style?: ViewStyle;
}

export function ParticleBurst({ trigger, count = 8, colors = ["#8338ec", "#ff006e", "#3a86ff", "#ffbe0b", "#fb5607"], spread = 60, style }: ParticleBurstProps) {
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    particles.current = Array.from({ length: count }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }));
  }, [count]);

  useEffect(() => {
    if (!trigger || particles.current.length === 0) return;

    particles.current.forEach((p, i) => {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
      const dist = spread * (0.5 + Math.random() * 0.5);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(1);
      p.scale.setValue(0);

      Animated.parallel([
        Animated.spring(p.x, { toValue: dx, useNativeDriver: true, friction: 6, tension: 80 }),
        Animated.spring(p.y, { toValue: dy, useNativeDriver: true, friction: 6, tension: 80 }),
        Animated.sequence([
          Animated.spring(p.scale, { toValue: 1.2, useNativeDriver: true, friction: 4, tension: 200 }),
          Animated.timing(p.scale, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
        Animated.timing(p.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    });
  }, [trigger, count, spread]);

  return (
    <View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }, style]} collapsable={false}>
      {particles.current.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors[i % colors.length],
            left: "50%",
            top: "50%",
            marginLeft: -3,
            marginTop: -3,
            opacity: p.opacity,
            transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
          }}
        />
      ))}
    </View>
  );
}
