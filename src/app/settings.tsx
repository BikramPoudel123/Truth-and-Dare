import { useRef, useState } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { ArrowLeft, Bell, Moon, Volume2 } from "lucide-react-native";

export default function SettingsScreen({ onBack }: { onBack?: () => void }) {
  const [sound, setSound] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [darkMode] = useState(true);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.content}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>

          <View style={s.row}>
            <View style={s.rowLeft}>
              <Volume2 size={18} color={COLORS.sub} />
              <Text style={s.rowLabel}>Sound Effects</Text>
            </View>
            <Switch value={sound} onValueChange={setSound} trackColor={{ false: COLORS.border, true: COLORS.purple }} thumbColor="#fff" />
          </View>

          <View style={s.divider} />

          <View style={s.row}>
            <View style={s.rowLeft}>
              <Bell size={18} color={COLORS.sub} />
              <Text style={s.rowLabel}>Vibrate</Text>
            </View>
            <Switch value={vibrate} onValueChange={setVibrate} trackColor={{ false: COLORS.border, true: COLORS.purple }} thumbColor="#fff" />
          </View>

          <View style={s.divider} />

          <View style={s.row}>
            <View style={s.rowLeft}>
              <Moon size={18} color={COLORS.sub} />
              <Text style={s.rowLabel}>Dark Mode</Text>
            </View>
            <Switch value={darkMode} onValueChange={() => {}} trackColor={{ false: COLORS.border, true: COLORS.purple }} thumbColor="#fff" disabled />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Version</Text>
            <Text style={s.rowValue}>1.0.0</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  content: { padding: 16, gap: 24 },
  section: { backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.subtle, gap: 4 },
  sectionTitle: { color: COLORS.sub, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  rowValue: { color: COLORS.sub, fontSize: 13, fontWeight: "600" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },
});
