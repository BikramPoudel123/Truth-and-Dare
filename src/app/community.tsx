import { Avatar } from "@/components/Avatar";
import { SERVER_URL } from "@/constants/server";
import { useProfile } from "@/contexts/ProfileContext";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { getLevelProgress } from "@/utils/levels";
import { CalendarDays, Crown, Eye, Flame, Gamepad2, Heart, Inbox, PartyPopper, Skull, SmilePlus, Star, UserPlus, UserMinus, UserCheck, Users, Zap } from "lucide-react-native";

function getHttpBase() {
  return SERVER_URL.replace(/^ws:\/\//, "http://")
    .replace(/^wss:\/\//, "https://")
    .replace(/\/$/, "");
}

const INTEREST_LABEL: Record<string, string> = {
  fun: "fun",
  life: "life",
  hot: "hot",
  connect: "connect",
  spicy: "spicy",
  deep: "deep",
};

export interface CommunityPost {
  id: string;
  author: string;
  author_id?: string;
  profilePic?: string | null;
  type: "truth" | "dare";
  text: string;
  likes: number;
  likedByMe?: boolean;
  createdAt: number;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function CommunityScreen() {
  const { profile, playerId } = useProfile();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postType, setPostType] = useState<"truth" | "dare">("truth");
  const [postText, setPostText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [profileModal, setProfileModal] = useState<{ visible: boolean; authorId: string | null; name: string; bio: string; pic: string | null; interests: string[]; playStyle: string | null; reactions: Record<string, number>; gamesPlayed: number; level: number; playedSince: string; loading: boolean }>({ visible: false, authorId: null, name: "", bio: "", pic: null, interests: [], playStyle: null, reactions: {}, gamesPlayed: 0, level: 1, playedSince: "", loading: false });
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${base}/friends/${playerId}`);
        if (res.ok) {
          const data = await res.json();
          setFriendIds(new Set(data.friends.map((f: { id: string }) => f.id)));
          setSentIds(new Set(data.sent ?? []));
        }
      } catch {}
    })();
  }, []);

  const fetchPosts = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${base}/community/posts?player_id=${encodeURIComponent(playerId)}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      if (!quiet)
        Alert.alert("Error", "Could not load posts. Is the server running?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const submitPost = async () => {
    if (!postText.trim()) return;
    if (!profile.name.trim()) {
      Alert.alert("Set up your profile first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${base}/community/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: profile.name.trim(),
          type: postType,
          text: postText.trim(),
          author_id: playerId,
        }),
      });
      const data = await res.json();
      if (data.post) {
        setPosts((prev) => [{ ...data.post, profilePic: data.post.profilePic ?? profile.pic }, ...prev]);
        setPostText("");
      }
    } catch {
      Alert.alert("Error", "Could not submit post.");
    } finally {
      setSubmitting(false);
    }
  };

  const likePost = async (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              likes: p.likedByMe ? p.likes - 1 : p.likes + 1,
              likedByMe: !p.likedByMe,
            }
          : p,
      ),
    );
    try {
      await fetch(`${base}/community/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId }),
      });
    } catch {}
  };

  const openProfile = async (authorId: string | undefined, authorName: string) => {
    if (!authorId) return;
    setProfileModal({ visible: true, authorId, name: authorName, bio: "", pic: null, interests: [], playStyle: null, reactions: {}, gamesPlayed: 0, level: 1, playedSince: "", loading: true });
    try {
      await fetch(`${base}/friends/${encodeURIComponent(playerId)}`).then(async r => {
        if (r.ok) { const d = await r.json(); setFriendIds(new Set(d.friends.map((f: { id: string }) => f.id))); setSentIds(new Set(d.sent ?? [])); }
      });
    } catch {}
    try {
      const res = await fetch(`${base}/profile/${encodeURIComponent(authorId)}`);
      if (res.ok) {
        const data = await res.json();
        setProfileModal({ visible: true, authorId, name: data.name, bio: data.bio, pic: data.pic, interests: data.interests, playStyle: data.playStyle, reactions: data.reactions ?? {}, gamesPlayed: data.gamesPlayed ?? 0, level: data.level ?? 1, playedSince: data.played_since ?? "", loading: false });
      } else {
        setProfileModal(prev => ({ ...prev, authorId, loading: false }));
      }
    } catch {
      setProfileModal(prev => ({ ...prev, authorId, loading: false }));
    }
  };

  const filtered = posts.filter((p) => p.type === postType);

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <View style={s.postCard}>
      <View style={s.postTop}>
        {item.author_id && item.author_id !== playerId ? (
          <TouchableOpacity onPress={() => openProfile(item.author_id, item.author)} activeOpacity={0.7}>
            <Avatar uri={item.profilePic} name={item.author} size={36} borderWidth={1.5} borderColor={COLORS.border} />
          </TouchableOpacity>
        ) : (
          <Avatar uri={item.profilePic} name={item.author} size={36} borderWidth={1.5} borderColor={COLORS.border} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.postAuthor}>{item.author}{item.author_id === playerId ? " (you)" : ""}</Text>
          <Text style={s.postTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <View
          style={[
            s.postTypeBadge,
            item.type === "truth" ? s.postTypeTruth : s.postTypeDare,
          ]}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            {item.type === "truth" ? <Eye size={12} color={COLORS.purple} /> : <Flame size={12} color={COLORS.orange} />}
            <Text
              style={[
                s.postTypeText,
                { color: item.type === "truth" ? COLORS.purple : COLORS.orange },
              ]}
            >
              {item.type === "truth" ? "TRUTH" : "DARE"}
            </Text>
          </View>
        </View>
      </View>
      <Text style={s.postText}>{item.text}</Text>
      <View style={s.postActions}>
        <TouchableOpacity
          style={[s.likeBtn, item.likedByMe && s.likeBtnActive]}
          onPress={() => likePost(item.id)}
          activeOpacity={0.8}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            <Heart size={14} color={item.likedByMe ? COLORS.pink : COLORS.sub} fill={item.likedByMe ? COLORS.pink : "transparent"} />
            <Text style={s.likeBtnText}>{item.likes}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Community</Text>
            <Text style={s.subtitle}>Share & discover questions</Text>
          </View>
        </View>

        <View style={s.compose}>
          <View style={s.composeTypeRow}>
            {(["truth", "dare"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  s.composeTypeBtn,
                  postType === t &&
                    { backgroundColor: t === "truth" ? COLORS.purple : COLORS.orange, borderColor: t === "truth" ? COLORS.purple : COLORS.orange },
                ]}
                onPress={() => setPostType(t)}
                activeOpacity={0.8}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  {t === "truth" ? <Eye size={14} color={postType === t ? "#fff" : COLORS.sub} /> : <Flame size={14} color={postType === t ? "#fff" : COLORS.sub} />}
                  <Text
                    style={[
                      s.composeTypeTxt,
                      postType === t && { color: "#fff" },
                    ]}
                  >
                    {t === "truth" ? "Truth" : "Dare"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.composeRow}>
            <TextInput
              style={s.composeInput}
              placeholder={
                postType === "truth"
                  ? "Share a truth question..."
                  : "Share a dare..."
              }
              placeholderTextColor={COLORS.subAlt}
              value={postText}
              onChangeText={setPostText}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[s.composeBtn, !postText.trim() && s.composeBtnDisabled]}
              onPress={submitPost}
              disabled={!postText.trim() || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.composeBtnTxt}>POST</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.filterRow}>
          <Text style={s.postCount}>{filtered.length} {postType} posts</Text>
        </View>

        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color={COLORS.purple} />
            <Text style={{ color: COLORS.sub, marginTop: 12 }}>Loading posts...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            renderItem={renderPost}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => fetchPosts(true)}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews
            ListEmptyComponent={
              <View style={s.empty}>
                <Inbox size={48} color={COLORS.sub} />
                <Text style={s.emptyText}>
                  No posts yet. Be the first to share!
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>

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
                    <View style={s.modalInterestsWrap}>
                      {profileModal.interests.map((i) => (
                        <View key={i} style={s.modalInterestTag}>
                          <Text style={s.modalInterestTxt}>{INTEREST_LABEL[i] ?? i}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>
              )}
              {!profileModal.loading && profileModal.authorId && profileModal.authorId !== playerId && (
                <View style={s.modalFriendIconWrap}>
                  {friendIds.has(profileModal.authorId!) ? (
                    <View style={s.modalFriendIcon}>
                      <Users size={18} color={COLORS.green} />
                    </View>
                  ) : sentIds.has(profileModal.authorId!) ? (
                    <View style={s.modalFriendIcon}>
                      <UserCheck size={18} color={COLORS.blue} />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={s.modalFriendIcon}
                      onPress={async () => {
                        try {
                          const res = await fetch(`${base}/friends/request`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ from_id: playerId, from_name: profile.name, from_pic: profile.pic, to_id: profileModal.authorId }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            if (data.status !== "already_friends" && data.status !== "already_requested") { setSentIds(prev => new Set(prev).add(profileModal.authorId!)); }
                          }
                        } catch {}
                      }}
                      activeOpacity={0.7}
                    >
                      <UserPlus size={18} color={COLORS.purple} />
                    </TouchableOpacity>
                  )}
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
  },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  subtitle: { color: COLORS.sub, fontSize: 12, marginTop: 1 },
  compose: {
    padding: 14,
    gap: 8,
  },
  composeTypeRow: { flexDirection: "row", gap: 8 },
  composeTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.small,
    alignItems: "center",
    backgroundColor: "rgba(23, 19, 50, 0.6)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  composeTypeTxt: { fontSize: 13, fontWeight: "700", color: COLORS.sub },
  composeRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  composeInput: {
    flex: 1,
    backgroundColor: "rgba(23, 19, 50, 0.5)",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.small,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 44,
    textAlignVertical: "top",
  },
  composeBtn: {
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.small,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  composeBtnDisabled: { opacity: 0.35 },
  composeBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.small,
    backgroundColor: "rgba(23, 19, 50, 0.6)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnTxt: { fontSize: 12, fontWeight: "700", color: COLORS.sub },
  postCount: { color: COLORS.subAlt, fontSize: 11, fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  postCard: {
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    ...SHADOWS.subtle,
  },
  postTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.purple}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  postAvatarTxt: { color: COLORS.purple, fontSize: 13, fontWeight: "800" },
  postAuthor: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  postTime: { color: COLORS.subAlt, fontSize: 11 },
  postTypeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  postTypeTruth: {
    backgroundColor: `${COLORS.purple}15`,
    borderWidth: 1,
    borderColor: `${COLORS.purple}30`,
  },
  postTypeDare: {
    backgroundColor: `${COLORS.orange}15`,
    borderWidth: 1,
    borderColor: `${COLORS.orange}30`,
  },
  postTypeText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  postText: { color: COLORS.text, fontSize: 14, lineHeight: 21, fontWeight: "500" },
  postActions: { flexDirection: "row", alignItems: "center" },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  likeBtnActive: { backgroundColor: `${COLORS.pink}20`, borderColor: `${COLORS.pink}40` },
  likeBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { color: COLORS.sub, fontSize: 14, textAlign: "center" },
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
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.purple,
  },
  modalAvatarPlaceholder: {
    backgroundColor: `${COLORS.purple}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarTxt: { color: COLORS.purple, fontSize: 24, fontWeight: "800" },
  modalName: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  modalBio: { color: COLORS.sub, fontSize: 13, textAlign: "center", lineHeight: 18 },
  modalInterestsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
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
