import { memo, useEffect, useMemo } from "react";
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BrandGradient } from "@/components/BrandGradient";

interface MatchOverlayProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  leftAvatar?: React.ReactNode;
  rightAvatar?: React.ReactNode;
  ctaLabel: string;
  onCta: () => void;
  onClose?: () => void;
}

function MatchOverlayInner({
  visible,
  title,
  subtitle,
  leftAvatar,
  rightAvatar,
  ctaLabel,
  onCta,
  onClose,
}: MatchOverlayProps) {
  const scale = useMemo(() => new Animated.Value(0.6), []);
  const opacity = useMemo(() => new Animated.Value(0), []);
  const drift = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (visible) {
      scale.setValue(0.6);
      opacity.setValue(0);
      drift.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(drift, { toValue: -8, duration: 900, useNativeDriver: true }),
            Animated.timing(drift, { toValue: 8, duration: 900, useNativeDriver: true }),
            Animated.timing(drift, { toValue: 0, duration: 900, useNativeDriver: true }),
          ]),
        ),
      ]).start();
    }
  }, [visible, scale, opacity, drift]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BrandGradient variant="match" style={styles.root}>
        <Animated.View style={[styles.content, { opacity, transform: [{ scale }, { translateY: drift }] }]}>
          <Text style={styles.emoji}>🔥</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {(leftAvatar || rightAvatar) && (
            <View style={styles.avatarRow}>
              {leftAvatar}
              <Text style={styles.vs}>VS</Text>
              {rightAvatar}
            </View>
          )}

          <TouchableOpacity style={styles.cta} onPress={onCta} activeOpacity={0.85}>
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </TouchableOpacity>

          {onClose ? (
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeWrap}>
              <Text style={[styles.close, { color: "rgba(255,255,255,0.85)" }]}>Close</Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </BrandGradient>
    </Modal>
  );
}

export const MatchOverlay = memo(MatchOverlayInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    width: "100%",
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 32,
    marginBottom: 40,
  },
  vs: { color: "#fff", fontSize: 20, fontWeight: "900", opacity: 0.9 },
  cta: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 40,
    minWidth: 220,
    alignItems: "center",
  },
  ctaText: {
    color: "#fd267a",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  closeWrap: { marginTop: 20, padding: 8 },
  close: { fontSize: 13, fontWeight: "700" },
});
