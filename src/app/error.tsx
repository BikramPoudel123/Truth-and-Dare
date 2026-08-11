import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "@/contexts/GameContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AlertTriangle, WifiOff, RefreshCw, Home } from "lucide-react-native";
import { AppBackground } from "@/components/AppBackground";

export default function ErrorScreen() {
  const { error, reset, reconnect, isConnected } = useGame();
  const { colors } = useTheme();

  const opponentLeft =
    isConnected && !!error && /(quit|disconnected|left)/i.test(error);

  const title = opponentLeft
    ? "Your opponent left"
    : isConnected
      ? "Game interrupted"
      : "No connection";

  const message = opponentLeft
    ? "Start a new game whenever you're ready."
    : isConnected
      ? (error ?? "Something went wrong during the game.")
      : "Check that the server is running and both devices are on the same network.";

  const accent = opponentLeft ? colors.gold : colors.red;

  return (
    <SafeAreaView style={s.safe}>
      <AppBackground />
      <View style={s.center}>
        <View style={[s.iconWrap, { borderColor: accent }]}>
          {opponentLeft ? <AlertTriangle size={40} color={accent} /> : <WifiOff size={40} color={accent} />}
        </View>

        <Text style={[s.title, { color: colors.text }]}>{title}</Text>
        <Text style={[s.message, { color: colors.sub }]}>{message}</Text>

        <TouchableOpacity style={[s.btn, { backgroundColor: colors.purple }]} onPress={reset} activeOpacity={0.85}>
          <Text style={s.btnText}>Back to Menu</Text>
        </TouchableOpacity>

        {!isConnected && (
          <TouchableOpacity onPress={reconnect} activeOpacity={0.7} style={s.reconnectRow}>
            <RefreshCw size={14} color={colors.sub} />
            <Text style={[s.reconnectText, { color: colors.sub }]}>Reconnect</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  title: { color: "#1c1c1e", fontSize: 22, fontWeight: "800" },
  message: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  btn: { borderRadius: 14, paddingVertical: 14, width: "100%", alignItems: "center" },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  reconnectRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  reconnectText: { fontSize: 14, fontWeight: "600" },
});
