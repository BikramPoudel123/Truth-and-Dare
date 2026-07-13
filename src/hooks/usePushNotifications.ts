import { Platform } from "react-native";

let Notifications: typeof import("expo-notifications") | null = null;
let initAttempted = false;

async function ensureInit() {
  if (initAttempted) return !!Notifications;
  initAttempted = true;
  if (Platform.OS !== "ios") return false;
  try {
    const mod = require("expo-notifications");
    await mod.getPermissionsAsync();
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    Notifications = mod;
    return true;
  } catch {
    return false;
  }
}

async function showLocalNotification({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  const ok = await ensureInit();
  if (!ok || !Notifications) return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: null,
    });
  } catch {}
}

const TYPE_MAP: Record<string, { title: string; body: (n: any) => string }> = {
  friend_request: {
    title: "Friend Request",
    body: (n) => `${n.fromName} sent you a friend request`,
  },
  friend_request_accepted: {
    title: "Friend Request Accepted",
    body: (n) => `${n.fromName} accepted your friend request`,
  },
  friend_request_rejected: {
    title: "Friend Request Declined",
    body: (n) => `${n.fromName} declined your friend request`,
  },
};

export async function schedulePushForNotification(notification: {
  type: string;
  fromName: string;
}) {
  try {
    const cfg = TYPE_MAP[notification.type];
    if (!cfg) return;
    await showLocalNotification({
      title: cfg.title,
      body: cfg.body(notification),
      data: { type: notification.type, fromName: notification.fromName },
    });
  } catch {}
}
