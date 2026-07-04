import Constants from "expo-constants";
import { Platform } from "react-native";

function getServerUrl(): string {
  // On web: always use same-origin so browser doesn't block ws:// to external IPs
  if (Platform.OS === "web") {
    const host =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `ws://${host}:5000`;
  }

  // On native: explicit env override (set in .env.local as EXPO_PUBLIC_SERVER_URL=ws://YOUR_IP:5000)
  const envUrl = process.env.EXPO_PUBLIC_SERVER_URL;
  if (envUrl) {
    return envUrl
      .replace(/^http:\/\//, "ws://")
      .replace(/^https:\/\//, "wss://");
  }

  // Derive from Metro bundler host
  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    return `ws://${host}:5000`;
  }

  return "ws://localhost:5000";
}

export const SERVER_URL = getServerUrl();
