import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { ArrowLeft, Bell, Moon, Volume2, Info, Shield } from "lucide-react-native";

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
  const [sound, setSoundState] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [darkMode] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("settings:sound").then(v => setSoundState(v !== "false"));
  }, []);

  const setSound = (val: boolean) => {
    setSoundState(val);
    AsyncStorage.setItem("settings:sound", val ? "true" : "false");
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Settings</Text>
          <Text style={s.subtitle}>App preferences</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>

          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={s.iconBox}><Volume2 size={16} color={COLORS.sub} /></View>
              <Text style={s.rowLabel}>Sound Effects</Text>
            </View>
            <Toggle value={sound} onChange={setSound} />
          </View>

          <View style={s.divider} />

          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={s.iconBox}><Bell size={16} color={COLORS.sub} /></View>
              <Text style={s.rowLabel}>Vibrate</Text>
            </View>
            <Toggle value={vibrate} onChange={setVibrate} />
          </View>

          <View style={s.divider} />

          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.iconBox, { backgroundColor: `${COLORS.purple}15` }]}><Moon size={16} color={COLORS.purple} /></View>
              <View>
                <Text style={s.rowLabel}>Dark Mode</Text>
                <Text style={s.rowHint}>Always enabled</Text>
              </View>
            </View>
            <Toggle value={darkMode} disabled />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Privacy</Text>

          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={s.iconBox}><Shield size={16} color={COLORS.sub} /></View>
              <Text style={s.rowLabel}>Profile Visibility</Text>
            </View>
            <Text style={s.rowValue}>Public</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>

          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={s.iconBox}><Info size={16} color={COLORS.sub} /></View>
              <Text style={s.rowLabel}>Version</Text>
            </View>
            <Text style={s.rowValue}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  subtitle: { color: COLORS.sub, fontSize: 12, marginTop: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  section: { backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.subtle, gap: 4 },
  sectionTitle: { color: COLORS.sub, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  rowLabel: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  rowHint: { color: COLORS.subAlt, fontSize: 11, marginTop: 1 },
  rowValue: { color: COLORS.sub, fontSize: 13, fontWeight: "600" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    padding: 2,
    justifyContent: "center",
  },
  toggleTrackOn: {
    backgroundColor: COLORS.purple,
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
