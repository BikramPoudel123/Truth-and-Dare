import { Image, StyleSheet, View } from "react-native";

/**
 * Full-screen background image rendered behind screen content.
 * Place as the first (absolute) child of a screen root.
 */
export function AppBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={require("@/assets/images/Background.png")}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    </View>
  );
}
