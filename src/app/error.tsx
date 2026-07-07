import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "@/contexts/GameContext";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { AlertTriangle } from "lucide-react-native";

export default function ErrorScreen() {
  const { error, reset, reconnect, isConnected } = useGame();
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <View style={s.iconWrap}>
          <AlertTriangle size={38} color={COLORS.red} />
        </View>

        <Text style={s.title}>Something went wrong</Text>

        <View style={s.card}>
          <Text style={s.errorText}>{error || "An unexpected error occurred."}</Text>
        </View>

        <Text style={s.hint}>
          {isConnected
            ? "The other player disconnected or the game ended."
            : "Can't reach the server.\n\nMake sure the server is running and both devices are on the same Wi-Fi."}
        </Text>

        <View style={s.btnGroup}>
          {!isConnected && (
            <TouchableOpacity style={s.btnPrimary} onPress={reconnect} activeOpacity={0.85}>
              <Text style={s.btnPrimaryText}>Reconnect</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.btnSecondary} onPress={reset} activeOpacity={0.85}>
            <Text style={s.btnSecondaryText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 16 },
  iconWrap: {
    width: 80, height: 80, borderRadius: RADIUS.cardSm,
    backgroundColor: `${COLORS.red}15`, borderWidth: 1.5, borderColor: `${COLORS.red}30`,
    alignItems: "center", justifyContent: "center",
  },
  title: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  card: {
    backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm,
    padding: 20, width: "100%", alignItems: "center",
    borderWidth: 1.5, borderColor: `${COLORS.red}30`,
    ...SHADOWS.subtle,
  },
  errorText: { color: COLORS.red, fontSize: 15, fontWeight: "600", textAlign: "center", lineHeight: 22 },
  hint: { color: COLORS.sub, fontSize: 13, textAlign: "center", lineHeight: 20 },
  btnGroup: { width: "100%", gap: 10, marginTop: 4 },
  btnPrimary: { backgroundColor: COLORS.purple, borderRadius: RADIUS.button, paddingVertical: 15, alignItems: "center" },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  btnSecondary: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: RADIUS.button, paddingVertical: 15, alignItems: "center", borderWidth: 1.5, borderColor: COLORS.border },
  btnSecondaryText: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
});
