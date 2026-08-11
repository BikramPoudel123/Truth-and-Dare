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
  safe: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { color: "#fd267a", fontSize: 32, fontWeight: "900" },
});
