import { useProfile } from "@/contexts/ProfileContext";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS } from "@/constants/design-system";
import { useTheme } from "@/contexts/ThemeContext";
import { FlameBackground } from "@/components/FlameBackground";
import { getHttpBase } from "@/utils/http";
import { timeAgo } from "@/utils/format";
import { ArrowLeft, Bell, Heart, UserPlus, UserX } from "lucide-react-native";

interface NotificationItem {
  id: string;
  type: string;
  from: string;
  fromName: string;
  fromPic: string | null;
  message: string;
  read: boolean;
  createdAt: number;
}

const NOTIF_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  "friend_request": UserPlus,
  "friend_request_accepted": Heart,
  "friend_request_rejected": UserX,
};

export default function NotificationsScreen({ onBack, onNavigateFriends }: { onBack?: () => void; onNavigateFriends?: () => void }) {
  const { playerId } = useProfile();
  const { colors } = useTheme();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const base = getHttpBase();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${base}/notifications/${encodeURIComponent(playerId)}`);
        if (res.ok) {
          const data = await res.json();
          setNotifs(data.notifications ?? []);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const renderItem = ({ item: n }: { item: NotificationItem }) => {
    const Icon = NOTIF_ICONS[n.type] ?? Bell;
    const isFriendRequest = n.type === "friend_request";
    const card = (
      <View style={[s.card, { backgroundColor: colors.glassBg, borderColor: colors.border }]}>
        <View style={[s.iconWrap, { backgroundColor: n.read ? "rgba(255,255,255,0.04)" : `${colors.purple}20` }]}>
          <Icon size={18} color={n.read ? colors.sub : colors.purple} />
        </View>
        <View style={s.cardBody}>
          <Text style={[s.msg, { color: colors.sub }, !n.read && { color: colors.text }]} numberOfLines={2}>{n.message}</Text>
          <Text style={[s.time, { color: colors.subAlt }]}>{timeAgo(n.createdAt)}</Text>
        </View>
        {!n.read && <View style={[s.dot, { backgroundColor: colors.purple }]} />}
      </View>
    );
    if (isFriendRequest && onNavigateFriends) {
      return (
        <TouchableOpacity key={n.id} onPress={onNavigateFriends} activeOpacity={0.7}>
          {card}
        </TouchableOpacity>
      );
    }
    return card;
  };

  const ListEmpty = () => (
    <View style={s.emptyState}>
      <Bell size={40} color={colors.sub} />
      <Text style={[s.emptyText, { color: colors.sub }]}>No notifications yet</Text>
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <FlameBackground />
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={[s.backBtn, { backgroundColor: colors.glassBg, borderColor: colors.border }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.text }]}>Notifications</Text>
          <Text style={[s.subtitle, { color: colors.sub }]}>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={colors.purple} /></View>
        ) : (
          <FlatList
            data={notifs}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            style={{ flex: 1 }}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={ListEmpty}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d10" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  title: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  subtitle: { color: "#a0a0ac", fontSize: 12, marginTop: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { color: "#a0a0ac", fontSize: 14, textAlign: "center" },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: RADIUS.cardSm, padding: 14, borderWidth: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, gap: 2 },
  msg: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  time: { fontSize: 11, fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
