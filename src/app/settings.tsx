import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS } from "@/constants/design-system";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, Bell, Moon, Volume2, Info } from "lucide-react-native";

function Toggle({ value, onChange, disabled }: { value: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[s.toggleTrack, value && s.toggleTrackOn, disabled && s.toggleDisabled]}
      onPress={() => onChange?.(!value)}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={[s.toggleThumb, value && s.toggleThumbOn]} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ onBack }: { onBack?: () => void }) {
  const { colors, shadows, isDark, toggleTheme } = useTheme();
  const [sound, setSoundState] = useState(true);
  const [vibrate, setVibrate] = useState(true);

  useEffect(() => {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    AsyncStorage.getItem("settings:sound").then((v: string | null) => setSoundState(v !== "false"));
  }, []);

  const setSound = (val: boolean) => {
    setSoundState(val);
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    AsyncStorage.setItem("settings:sound", val ? "true" : "false");
  };

  const c = colors;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.bg }]}>
      <View style={[s.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={onBack} style={[s.backBtn, { backgroundColor: c.glassBg, borderColor: c.border }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={18} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: c.text }]}>Settings</Text>
          <Text style={[s.subtitle, { color: c.sub }]}>App preferences</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }, shadows.subtle]}>
          <Text style={[s.sectionTitle, { color: c.sub }]}>Preferences</Text>

          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.iconBox, { backgroundColor: c.glassBg }]}><Volume2 size={16} color={c.sub} /></View>
              <Text style={[s.rowLabel, { color: c.text }]}>Sound Effects</Text>
            </View>
            <Toggle value={sound} onChange={setSound} />
          </View>

          <View style={[s.divider, { backgroundColor: c.border }]} />

          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.iconBox, { backgroundColor: c.glassBg }]}><Bell size={16} color={c.sub} /></View>
              <Text style={[s.rowLabel, { color: c.text }]}>Vibrate</Text>
            </View>
            <Toggle value={vibrate} onChange={setVibrate} />
          </View>

          <View style={[s.divider, { backgroundColor: c.border }]} />

          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.iconBox, { backgroundColor: c.purpleLight }]}><Moon size={16} color={c.purple} /></View>
              <View>
                <Text style={[s.rowLabel, { color: c.text }]}>Dark Mode</Text>
                <Text style={[s.rowHint, { color: c.subAlt }]}>{isDark ? "On" : "Off"}</Text>
              </View>
            </View>
            <Toggle value={isDark} onChange={() => toggleTheme()} />
          </View>
        </View>

        <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }, shadows.subtle]}>
          <Text style={[s.sectionTitle, { color: c.sub }]}>About</Text>

          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.iconBox, { backgroundColor: c.glassBg }]}><Info size={16} color={c.sub} /></View>
              <Text style={[s.rowLabel, { color: c.text }]}>Version</Text>
            </View>
            <Text style={[s.rowValue, { color: c.sub }]}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 18, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  section: { borderRadius: RADIUS.cardSm, padding: 16, borderWidth: 1, gap: 4 },
  sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowHint: { fontSize: 11, marginTop: 1 },
  rowValue: { fontSize: 13, fontWeight: "600" },
  divider: { height: 1, marginVertical: 2 },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.12)",
    padding: 2,
    justifyContent: "center",
  },
  toggleTrackOn: {
    backgroundColor: "#3b82f6",
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  toggleThumbOn: {
    alignSelf: "flex-end",
  },
});
