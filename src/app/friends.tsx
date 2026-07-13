import { SERVER_URL } from "@/constants/server";
import { useProfile } from "@/contexts/ProfileContext";
import { Avatar } from "@/components/Avatar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { getLevelProgress } from "@/utils/levels";
import { ArrowLeft, CalendarDays, Check, Crown, Flame, Gamepad2, Heart, PartyPopper, Skull, SmilePlus, Star, Users, UserPlus, UserMinus, X, User, Zap } from "lucide-react-native";

function getHttpBase() {
  return SERVER_URL.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://").replace(/\/$/, "");
}

interface FriendItem { id: string; name: string; pic: string | null; }
interface RequestItem { id: string; from: string; fromName: string; fromPic: string | null; createdAt: number; }

export default function FriendsScreen({ onBack, initialTab }: { onBack?: () => void; initialTab?: "friends" | "requests" }) {
  const { playerId } = useProfile();
  const [tab, setTab] = useState<"friends" | "requests">(initialTab ?? "friends");
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [profileModal, setProfileModal] = useState<{ visible: boolean; id: string; name: string; bio: string; pic: string | null; interests: string[]; playStyle: string | null; reactions: Record<string, number>; gamesPlayed: number; level: number; playedSince: string; loading: boolean }>({ visible: false, id: "", name: "", bio: "", pic: null, interests: [], playStyle: null, reactions: {}, gamesPlayed: 0, level: 1, playedSince: "", loading: false });
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const rCardW = Math.min(screenW * 0.92, 480);
  const rCardMaxH = Math.min(screenH * 0.85, 600);
  const rHozPad = Math.max(16, Math.min(24, screenW * 0.065));
  const rBotPad = Math.max(16, insets.bottom + 12);
  const rTopRad = screenW < 380 ? 20 : 24;
  const rGrabMarg = Math.max(12, Math.min(20, screenW * 0.05));

  const pfScrollY = useRef(0);
  const pfPanDismiss = useCallback(() => setProfileModal(prev => ({ ...prev, visible: false })), []);
  const pfPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10 && gs.vy > 0 && pfScrollY.current <= 1,
    onPanResponderRelease: (_, gs) => { if (gs.dy > 100) pfPanDismiss(); },
  })).current;

  const base = getHttpBase();

  const fetchData = async () => {
    try {
      const res = await fetch(`${base}/friends/${encodeURIComponent(playerId)}`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends ?? []);
        setRequests(data.requests ?? []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAccept = async (reqId: string) => {
    setAccepting(reqId);
    try {
      const res = await fetch(`${base}/friends/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: reqId, actor_id: playerId }),
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== reqId));
        fetchData();
      }
    } catch {}
    setAccepting(null);
  };

  const handleReject = async (reqId: string) => {
    try {
      await fetch(`${base}/friends/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: reqId, actor_id: playerId }),
      });
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch {}
  };

  const openProfile = async (id: string, name: string) => {
    setProfileModal({ visible: true, id, name, bio: "", pic: null, interests: [], playStyle: null, reactions: {}, gamesPlayed: 0, level: 1, playedSince: "", loading: true });
    try {
      const res = await fetch(`${base}/profile/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        setProfileModal({ visible: true, id, name: data.name, bio: data.bio, pic: data.pic, interests: data.interests, playStyle: data.playStyle, reactions: data.reactions ?? {}, gamesPlayed: data.gamesPlayed ?? 0, level: data.level ?? 1, playedSince: data.played_since ?? "", loading: false });
      } else {
        setProfileModal(prev => ({ ...prev, loading: false }));
      }
    } catch {
      setProfileModal(prev => ({ ...prev, loading: false }));
    }
  };

  const renderAvatar = (pic: string | null, name: string, size = 40) =>
    <Avatar uri={pic} name={name} size={size} borderWidth={1.5} borderColor={COLORS.border} />;

  const renderFriend = ({ item }: { item: FriendItem }) => (
    <TouchableOpacity style={s.card} onPress={() => openProfile(item.id, item.name)} activeOpacity={0.7}>
      {renderAvatar(item.pic, item.name)}
      <Text style={s.cardName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderRequest = ({ item }: { item: RequestItem }) => (
    <View style={s.card}>
      {renderAvatar(item.fromPic, item.fromName)}
      <Text style={s.cardName}>{item.fromName}</Text>
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.acceptBtn, accepting === item.id && { opacity: 0.5 }]}
          onPress={() => handleAccept(item.id)}
          disabled={accepting === item.id}
          activeOpacity={0.8}
        >
          {accepting === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(item.id)} activeOpacity={0.8}>
          <X size={16} color={COLORS.red} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListEmpty = ({ icon: Icon, text }: { icon: React.ComponentType<{size: number; color: string}>; text: string }) => (
    <View style={s.emptyState}>
      <Icon size={48} color={COLORS.sub} />
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );

  const data = tab === "friends" ? friends : requests;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Friends</Text>
          <Text style={s.subtitle}>Manage your friends</Text>
        </View>
        {tab === "requests" && requests.length > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{requests.length}</Text>
          </View>
        )}
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === "friends" && s.tabActive]} onPress={() => setTab("friends")} activeOpacity={0.8}>
          <View style={{flexDirection: "row", alignItems: "center", gap: 6}}>
            <Users size={14} color={tab === "friends" ? COLORS.purple : COLORS.sub} />
            <Text style={[s.tabTxt, tab === "friends" && s.tabTxtActive]}>Friends</Text>
          </View>
          {friends.length > 0 && <Text style={[s.tabCount, tab === "friends" && {color: COLORS.purple}]}>{friends.length}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === "requests" && s.tabActive]} onPress={() => setTab("requests")} activeOpacity={0.8}>
          <View style={{flexDirection: "row", alignItems: "center", gap: 6}}>
            <UserPlus size={14} color={tab === "requests" ? COLORS.purple : COLORS.sub} />
            <Text style={[s.tabTxt, tab === "requests" && s.tabTxtActive]}>Requests</Text>
          </View>
          {requests.length > 0 && <Text style={[s.tabCount, tab === "requests" && {color: COLORS.purple}]}>{requests.length}</Text>}
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={COLORS.purple} /></View>
        ) : (
          <FlatList
            data={tab === "friends" ? (friends as any) : (requests as any)}
            keyExtractor={(item: any) => item.id}
            renderItem={(tab === "friends" ? renderFriend : renderRequest) as any}
            style={{ flex: 1 }}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              tab === "friends"
                ? <ListEmpty icon={User} text={"No friends yet\nSend a friend request from someone's profile!"} />
                : <ListEmpty icon={UserPlus} text="No pending requests" />
            }
          />
        )}
      </View>
      <Modal visible={profileModal.visible} transparent animationType="slide" onRequestClose={() => setProfileModal(prev => ({ ...prev, visible: false }))}>
        <Pressable style={s.modalOverlay} onPress={() => setProfileModal(prev => ({ ...prev, visible: false }))}>
          <View style={[s.modalCard, { maxWidth: rCardW, maxHeight: rCardMaxH, paddingHorizontal: rHozPad, paddingBottom: rBotPad, borderTopLeftRadius: rTopRad, borderTopRightRadius: rTopRad }]} {...pfPanResponder.panHandlers}>
            <View style={[s.modalGrabber, { marginBottom: rGrabMarg }]} />
            {profileModal.loading ? (
              <ActivityIndicator size="large" color={COLORS.purple} />
            ) : (
              <ScrollView contentContainerStyle={{ alignItems: "center", gap: 16 }} showsVerticalScrollIndicator={false} style={{ alignSelf: "stretch" }} bounces={true} onScroll={(e) => { pfScrollY.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}>
                <Avatar uri={profileModal.pic} name={profileModal.name} size={72} borderWidth={2} borderColor={COLORS.purple} />
                <Text style={s.modalName}>{profileModal.name}</Text>

                {profileModal.playStyle && (() => {
                  const iconMap: Record<string, [React.ComponentType<{size: number; color: string}>, string]> = {
                    "Rising Star":      [Star, COLORS.gold],
                    "Hot Player":       [Flame, COLORS.orange],
                    "Funny Player":     [SmilePlus, "#facc15"],
                    "Heartthrob":       [Heart, COLORS.pink],
                    "Shocking Player":  [Zap, COLORS.electricBlue],
                    "Savage Player":    [Skull, "#a855f7"],
                    "Emotional Player": [Heart, "#60a5fa"],
                    "Life of the Party":[PartyPopper, "#f97316"],
                    "Respected Player": [Crown, COLORS.gold],
                  };
                  const pair = iconMap[profileModal.playStyle ?? ""] ?? [Star, COLORS.sub];
                  const Icon = pair[0];
                  return (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: RADIUS.pill, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border }}>
                      <Icon size={13} color={pair[1]} />
                      <Text style={{ color: COLORS.text, fontSize: 11, fontWeight: "700" }}>{profileModal.playStyle}</Text>
                    </View>
                  );
                })()}

                {/* Stats Card */}
                <View style={s.modalStatsCard}>
                  <View style={s.modalStatColumn}>
                    <Crown size={18} color={COLORS.gold} />
                    <Text style={s.modalStatNumber}>{profileModal.level}</Text>
                    <View style={{ width: "100%", height: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
                      <View style={{ width: `${(profileModal.gamesPlayed % 10) * 10}%`, height: "100%", backgroundColor: COLORS.gold, borderRadius: 2 }} />
                    </View>
                    <Text style={s.modalStatLabel} numberOfLines={1}>Level</Text>
                  </View>
                  <View style={s.modalStatDivider} />
                  <View style={s.modalStatColumn}>
                    <SmilePlus size={18} color={COLORS.sub} />
                    <Text style={s.modalStatNumber}>{Object.keys(profileModal.reactions).length > 0 ? Object.values(profileModal.reactions).reduce((a, b) => a + b, 0) : 0}</Text>
                    <Text style={s.modalStatLabel} numberOfLines={1}>Reactions</Text>
                  </View>
                  <View style={s.modalStatDivider} />
                  <View style={s.modalStatColumn}>
                    <CalendarDays size={18} color={COLORS.sub} />
                    <Text style={s.modalStatDate} numberOfLines={1}>
                      {profileModal.playedSince
                        ? new Date(profileModal.playedSince).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </Text>
                    <Text style={s.modalStatLabel} numberOfLines={1}>Played Since</Text>
                  </View>
                </View>

                {Object.keys(profileModal.reactions).length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                    {Object.entries(profileModal.reactions).map(([emoji, count]) => (
                      <View key={emoji} style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border }}>
                        <Text style={{ fontSize: 14 }}>{emoji}</Text>
                        <Text style={{ color: COLORS.sub, fontSize: 11, fontWeight: "700" }}>{count}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {profileModal.bio ? <Text style={s.modalBio}>{profileModal.bio}</Text> : null}
                {profileModal.interests.length > 0 && (
                  <>
                    <Text style={{ color: COLORS.sub, fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" }}>Interests</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                      {profileModal.interests.map((i) => (
                        <View key={i} style={s.modalInterestTag}>
                          <Text style={s.modalInterestTxt}>{(i)}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>
              )}
              {!profileModal.loading && profileModal.id && (
                <View style={s.modalFriendIconWrap}>
                  <TouchableOpacity
                    style={s.modalFriendIcon}
                    onPress={async () => {
                      try {
                        const res = await fetch(`${base}/friends/remove`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ player_id: playerId, friend_id: profileModal.id }),
                        });
                        if (res.ok) {
                          setFriends(prev => prev.filter(f => f.id !== profileModal.id));
                          setProfileModal(prev => ({ ...prev, visible: false }));
                        }
                      } catch {}
                    }}
                    activeOpacity={0.7}
                  >
                    <UserMinus size={18} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Pressable>
      </Modal>
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
  badge: { backgroundColor: COLORS.purple, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, minWidth: 24, alignItems: "center" },
  badgeTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },
  tabs: { flexDirection: "row", backgroundColor: "rgba(23, 19, 50, 0.7)", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.purple },
  tabTxt: { fontSize: 13, fontWeight: "700", color: COLORS.sub },
  tabTxtActive: { color: COLORS.purple },
  tabCount: { fontSize: 11, fontWeight: "800", color: COLORS.subAlt, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, overflow: "hidden" },
  content: { flex: 1, justifyContent: "flex-start" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.sub, fontSize: 14, textAlign: "center", lineHeight: 22 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm, padding: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.subtle },
  cardName: { color: COLORS.text, fontSize: 14, fontWeight: "700", flex: 1 },
  actions: { flexDirection: "row", gap: 8 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.green, alignItems: "center", justifyContent: "center" },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.red}20`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${COLORS.red}40` },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    width: "100%",
    backgroundColor: COLORS.bg,
    paddingTop: 4,
    alignItems: "center",
    alignSelf: "center",
    ...SHADOWS.glow,
  },
  modalGrabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center" },
  modalName: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  modalBio: { color: COLORS.sub, fontSize: 13, textAlign: "center", lineHeight: 18 },
  modalInterestTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: `${COLORS.purple}15`,
    borderWidth: 1,
    borderColor: `${COLORS.purple}30`,
  },
  modalInterestTxt: { color: COLORS.purple, fontSize: 11, fontWeight: "700" },
  modalFriendIconWrap: { position: "absolute", top: 4, right: 8, zIndex: 10 },
  modalFriendIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  modalStatsCard: {
    flexDirection: "row",
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "100%",
  },
  modalStatColumn: { flex: 1, alignItems: "center", gap: 4 },
  modalStatNumber: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  modalStatLabel: { color: COLORS.sub, fontSize: 10, fontWeight: "600" },
  modalStatDate: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  modalStatDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
});
