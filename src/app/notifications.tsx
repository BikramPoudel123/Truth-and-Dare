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
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { getHttpBase } from "@/utils/http";
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

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

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
      <View style={[s.card, !n.read && s.unread]}>
        <View style={[s.iconWrap, { backgroundColor: !n.read ? `${COLORS.purple}20` : "rgba(255,255,255,0.04)" }]}>
          <Icon size={18} color={!n.read ? COLORS.purple : COLORS.sub} />
        </View>
        <View style={s.cardBody}>
          <Text style={[s.msg, !n.read && s.msgUnread]}>{n.message}</Text>
          <Text style={s.time}>{timeAgo(n.createdAt)}</Text>
        </View>
        {!n.read && <View style={s.dot} />}
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
  }, [onNavigateFriends]);

  const ListEmpty = () => (
    <View style={s.emptyState}>
      <Bell size={48} color={COLORS.sub} />
      <Text style={s.emptyText}>No notifications yet</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Notifications</Text>
          <Text style={s.subtitle}>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</Text>
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markRead} style={s.markBtn} activeOpacity={0.8}>
            <CheckCheck size={16} color={COLORS.purple} />
          </TouchableOpacity>
        ) : <View style={{ width: 36 }} />}
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={COLORS.purple} /></View>
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
  markBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.purple}15`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${COLORS.purple}30` },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.sub, fontSize: 14, textAlign: "center" },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm, padding: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.subtle },
  unread: { borderColor: `${COLORS.purple}40`, backgroundColor: `${COLORS.purple}08` },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, gap: 2 },
  msg: { color: COLORS.sub, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  msgUnread: { color: COLORS.text, fontWeight: "700" },
  time: { color: COLORS.subAlt, fontSize: 11, fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.purple },
});
