import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "@/contexts/GameContext";
import { RADIUS } from "@/constants/design-system";
import { useTheme } from "@/contexts/ThemeContext";
import { AlertTriangle } from "lucide-react-native";

export default function ErrorScreen() {
  const { error, reset, reconnect, isConnected } = useGame();
  const { colors, shadows } = useTheme();
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <View style={s.center}>
        <View style={[s.iconWrap, { backgroundColor: `${colors.red}15`, borderColor: `${colors.red}30` }]}>
          <AlertTriangle size={38} color={colors.red} />
        </View>

        <Text style={[s.title, { color: colors.text }]}>Something went wrong</Text>

        <View style={[s.card, { borderColor: `${colors.red}30`, backgroundColor: colors.surface, ...shadows.subtle }]}>
          <Text style={[s.errorText, { color: colors.red }]}>{error || "An unexpected error occurred."}</Text>
        </View>

        <Text style={[s.hint, { color: colors.sub }]}>
          {isConnected
            ? "The other player disconnected or the game ended."
            : "Can't reach the server.\n\nMake sure the server is running and both devices are on the same Wi-Fi."}
        </Text>

        <View style={s.btnGroup}>
          {!isConnected && (
            <TouchableOpacity style={[s.btnPrimary, { backgroundColor: colors.purple }]} onPress={reconnect} activeOpacity={0.85}>
              <Text style={s.btnPrimaryText}>Reconnect</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.btnSecondary, { borderColor: colors.border, backgroundColor: colors.glassBg }]} onPress={reset} activeOpacity={0.85}>
            <Text style={[s.btnSecondaryText, { color: colors.text }]}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b081c" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 16 },
  iconWrap: {
    width: 80, height: 80, borderRadius: RADIUS.cardSm,
    backgroundColor: "rgba(220, 38, 38, 0.15)", borderWidth: 1.5, borderColor: "rgba(220, 38, 38, 0.30)",
    alignItems: "center", justifyContent: "center",
  },
  title: { color: "#ffffff", fontSize: 22, fontWeight: "800" },
  card: {
    backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm,
    padding: 20, width: "100%", alignItems: "center",
    borderWidth: 1.5, borderColor: "rgba(220, 38, 38, 0.30)",
  },
  errorText: { color: "#dc2626", fontSize: 15, fontWeight: "600", textAlign: "center", lineHeight: 22 },
  hint: { color: "#a19bb3", fontSize: 13, textAlign: "center", lineHeight: 20 },
  btnGroup: { width: "100%", gap: 10, marginTop: 4 },
  btnPrimary: { backgroundColor: "#3b82f6", borderRadius: RADIUS.button, paddingVertical: 15, alignItems: "center" },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  btnSecondary: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: RADIUS.button, paddingVertical: 15, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255, 255, 255, 0.08)" },
  btnSecondaryText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
