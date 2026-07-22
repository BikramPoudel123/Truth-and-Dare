import { SERVER_URL } from "@/constants/server";
import { useProfile } from "@/contexts/ProfileContext";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS } from "@/constants/design-system";
import { useTheme } from "@/contexts/ThemeContext";
import { getHttpBase } from "@/utils/http";
import { timeAgo } from "@/utils/format";
import { ArrowLeft, Bell, CheckCheck, Heart, UserPlus, UserX } from "lucide-react-native";

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

const NOTIF_ICONS: Record<string, React.ComponentType<{size: number; color: string}>> = {
  "friend_request": UserPlus,
  "friend_request_accepted": Heart,
  "friend_request_rejected": UserX,
};

function AnimatedNotificationItemInner({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8, tension: 80 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}
const AnimatedNotificationItem = memo(AnimatedNotificationItemInner);

export default function NotificationsScreen({ onBack, onNavigateFriends }: { onBack?: () => void; onNavigateFriends?: () => void }) {
  const { playerId } = useProfile();
  const { colors, shadows } = useTheme();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const base = getHttpBase();

  const fetchNotifs = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${base}/notifications/${encodeURIComponent(playerId)}`);
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notifications ?? []);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async () => {
    try {
      await fetch(`${base}/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId }),
      });
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = useMemo(() => notifs.filter(n => !n.read).length, [notifs]);

  const renderItem = useCallback(({ item: n }: { item: NotificationItem }) => {
    const Icon = NOTIF_ICONS[n.type] ?? Bell;
    const isFriendRequest = n.type === "friend_request";
    const card = (
      <AnimatedNotificationItem>
      <View style={[s.card, { backgroundColor: colors.glassBg, borderColor: colors.border, ...shadows.subtle }, !n.read && { borderColor: `${colors.purple}40`, backgroundColor: `${colors.purple}08` }]}>
        <View style={[s.iconWrap, { backgroundColor: !n.read ? `${colors.purple}20` : "rgba(255,255,255,0.04)" }]}>
          <Icon size={18} color={!n.read ? colors.purple : colors.sub} />
        </View>
        <View style={s.cardBody}>
          <Text style={[s.msg, { color: colors.sub }, !n.read && [s.msgUnread, { color: colors.text }]]}>{n.message}</Text>
          <Text style={[s.time, { color: colors.subAlt }]}>{timeAgo(n.createdAt)}</Text>
        </View>
        {!n.read && <View style={[s.dot, { backgroundColor: colors.purple }]} />}
      </View>
      </AnimatedNotificationItem>
    );
    if (isFriendRequest && onNavigateFriends) {
      return (
        <TouchableOpacity key={n.id} onPress={onNavigateFriends} activeOpacity={0.7}>
          {card}
        </TouchableOpacity>
      );
    }
    return card;
  }, [onNavigateFriends, colors]);

  const ListEmpty = () => (
    <View style={s.emptyState}>
      <Bell size={48} color={colors.sub} />
      <Text style={[s.emptyText, { color: colors.sub }]}>No notifications yet</Text>
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={[s.backBtn, { backgroundColor: colors.glassBg, borderColor: colors.border }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.text }]}>Notifications</Text>
          <Text style={[s.subtitle, { color: colors.sub }]}>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</Text>
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markRead} style={[s.markBtn, { backgroundColor: `${colors.purple}15`, borderColor: `${colors.purple}30` }]} activeOpacity={0.8}>
            <CheckCheck size={16} color={colors.purple} />
          </TouchableOpacity>
        ) : <View style={{ width: 36 }} />}
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
            refreshing={refreshing}
            onRefresh={() => fetchNotifs(true)}
            ListEmptyComponent={ListEmpty}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b081c" },
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
  subtitle: { color: "#a19bb3", fontSize: 12, marginTop: 1 },
  markBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(59, 130, 246, 0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(59, 130, 246, 0.30)" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { color: "#a19bb3", fontSize: 14, textAlign: "center" },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm, padding: 14, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  unread: { borderColor: "rgba(59, 130, 246, 0.40)", backgroundColor: "rgba(59, 130, 246, 0.08)" },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, gap: 2 },
  msg: { color: "#a19bb3", fontSize: 13, fontWeight: "500", lineHeight: 18 },
  msgUnread: { color: "#ffffff", fontWeight: "700" },
  time: { color: "#7c7890", fontSize: 11, fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3b82f6" },
});
