// This screen is not used in the main app flow (index.tsx handles routing).
// Kept as a safe placeholder to avoid build errors.
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.text}>Truth or Dare</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1a0a2e" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { color: "#e879f9", fontSize: 32, fontWeight: "900" },
});
