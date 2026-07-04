import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "@/contexts/GameContext";

const BG     = "#f8faff";
const CARD   = "#ffffff";
const BLUE   = "#3b82f6";
const BLUE_D = "#1d4ed8";
const BLUE_L = "#eff6ff";
const BLUE_M = "#bfdbfe";
const TEXT   = "#0f172a";
const SUB    = "#64748b";

export default function ErrorScreen() {
  const { error, reset, reconnect, isConnected } = useGame();
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>

        <View style={s.iconWrap}>
          <Text style={s.icon}>⚠️</Text>
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
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 16 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: "#fef2f2", borderWidth: 1.5, borderColor: "#fecaca",
    alignItems: "center", justifyContent: "center",
  },
  icon: { fontSize: 38 },
  title: { color: TEXT, fontSize: 22, fontWeight: "800" },
  card: {
    backgroundColor: CARD, borderRadius: 14,
    padding: 20, width: "100%", alignItems: "center",
    borderWidth: 1.5, borderColor: "#fecaca",
  },
  errorText: { color: "#dc2626", fontSize: 15, fontWeight: "600", textAlign: "center", lineHeight: 22 },
  hint: { color: SUB, fontSize: 13, textAlign: "center", lineHeight: 20 },
  btnGroup: { width: "100%", gap: 10, marginTop: 4 },
  btnPrimary: { backgroundColor: BLUE, borderRadius: 13, paddingVertical: 15, alignItems: "center" },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  btnSecondary: { backgroundColor: BLUE_L, borderRadius: 13, paddingVertical: 15, alignItems: "center", borderWidth: 1.5, borderColor: BLUE_M },
  btnSecondaryText: { color: BLUE_D, fontSize: 15, fontWeight: "700" },
});
