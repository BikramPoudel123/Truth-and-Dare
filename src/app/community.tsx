import { Avatar } from "@/components/Avatar";
import { ProfileModal, ProfileModalData, DEFAULT_MODAL_DATA } from "@/components/ProfileModal";
import { useProfile } from "@/contexts/ProfileContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RADIUS } from "@/constants/design-system";
import { getHttpBase, fetchProfileCached, sendFriendRequest as sendFriendRequestApi, fetchFriendIdsAndSent } from "@/utils/http";
import { timeAgo } from "@/utils/format";
import { Eye, Flame, Heart, Inbox } from "lucide-react-native";

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

function LikeButtonInner({ liked, count, onPress }: { liked: boolean; count: number; onPress: () => void }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, friction: 4, tension: 300 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 200 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      style={[s.likeBtn, { backgroundColor: colors.glassBg, borderColor: colors.border }, liked && { backgroundColor: `${colors.red}20`, borderColor: `${colors.red}40` }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
          <Heart size={18} color={liked ? colors.red : colors.sub} fill={liked ? colors.red : "transparent"} />
        <Text style={[s.likeBtnText, { color: colors.text }]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}
const LikeButton = memo(LikeButtonInner);

function AnimatedPostCardInner({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 80 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
const AnimatedPostCard = memo(AnimatedPostCardInner);

export default function CommunityScreen() {
  const { colors, shadows } = useTheme();
  const { profile, playerId } = useProfile();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postType, setPostType] = useState<"truth" | "dare">("truth");
  const [postText, setPostText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [pfModal, setPfModal] = useState<ProfileModalData>(DEFAULT_MODAL_DATA);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { width: screenW } = useWindowDimensions();
  const base = getHttpBase();

  useEffect(() => {
    (async () => {
      const { friendIds, sentIds } = await fetchFriendIdsAndSent(playerId);
      setFriendIds(friendIds);
      setSentIds(sentIds);
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
    setPfModal({ ...DEFAULT_MODAL_DATA, visible: true, authorId, name: authorName, loading: true });
    const { friendIds: fIds, sentIds: sIds } = await fetchFriendIdsAndSent(playerId);
    setFriendIds(fIds);
    setSentIds(sIds);
    const data = await fetchProfileCached(authorId);
    if (data) {
      setPfModal({ ...DEFAULT_MODAL_DATA, visible: true, authorId, name: data.name, bio: data.bio, pic: data.pic, interests: data.interests, playStyle: data.playStyle, reactions: data.reactions ?? {}, gamesPlayed: data.gamesPlayed ?? 0, level: data.level ?? 1, playedSince: data.played_since ?? "", loading: false });
    } else {
      setPfModal(prev => ({ ...prev, authorId, loading: false }));
    }
  };

  const filtered = useMemo(() => posts.filter((p) => p.type === postType), [posts, postType]);

  const sorted = useMemo(() => {
    if (filtered.length <= 3) return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    const now = Date.now();
    const scored = filtered.map(p => {
      const ageH = (now - p.createdAt) / 3600000;
      const velocity = p.likes / (ageH + 1);
      return { p, velocity, ageH };
    });
    scored.sort((a, b) => b.velocity - a.velocity);
    const mid = Math.ceil(scored.length / 2);
    const popular = scored.slice(0, mid);
    const recent = scored.slice(mid).sort((a, b) => a.ageH - b.ageH);
    const result: typeof filtered = [];
    let pi = 0, ri = 0;
    for (let i = 0; i < scored.length; i++) {
      if (i % 2 === 0 && pi < popular.length) {
        result.push(popular[pi++].p);
      } else if (ri < recent.length) {
        result.push(recent[ri++].p);
      } else {
        result.push(popular[pi++].p);
      }
    }
    return result;
  }, [filtered]);

  const renderPost = useCallback(({ item, index }: { item: CommunityPost; index: number }) => (
    <AnimatedPostCard index={index}>
    <View style={[s.postCard, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.subtle }]}>
      <View style={s.postTop}>
        {item.author_id && item.author_id !== playerId ? (
          <TouchableOpacity onPress={() => openProfile(item.author_id, item.author)} activeOpacity={0.7}>
            <Avatar uri={item.profilePic} name={item.author} size={36} borderWidth={1.5} borderColor={colors.border} />
          </TouchableOpacity>
        ) : (
          <Avatar uri={item.profilePic} name={item.author} size={36} borderWidth={1.5} borderColor={colors.border} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.postAuthor, { color: colors.text }]}>{item.author}{item.author_id === playerId ? " (you)" : ""}</Text>
          <Text style={[s.postTime, { color: colors.subAlt }]}>{timeAgo(item.createdAt)}</Text>
        </View>
        <View
          style={[
            s.postTypeBadge,
            item.type === "truth" ? s.postTypeTruth : s.postTypeDare,
            item.type === "truth"
              ? { backgroundColor: `${colors.purple}15`, borderColor: `${colors.purple}30` }
              : { backgroundColor: `${colors.red}15`, borderColor: `${colors.red}30` },
          ]}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            {item.type === "truth" ? <Eye size={12} color={colors.purple} /> : <Flame size={12} color={colors.red} />}
            <Text
              style={[
                s.postTypeText,
                { color: item.type === "truth" ? colors.purple : colors.red },
              ]}
            >
              {item.type === "truth" ? "TRUTH" : "DARE"}
            </Text>
          </View>
        </View>
      </View>
      <Text style={[s.postText, { color: colors.text }]}>{item.text}</Text>
      <View style={s.postActions}>
        <LikeButton liked={!!item.likedByMe} count={item.likes} onPress={() => likePost(item.id)} />
      </View>
      </View>
    </AnimatedPostCard>
  ), [playerId, likePost, openProfile, colors, shadows]);

  return (
    <SafeAreaView edges={["top"]} style={[s.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.text }]}>Community</Text>
            <Text style={[s.subtitle, { color: colors.sub }]}>Share & discover questions</Text>
          </View>
        </View>

        <View style={s.compose}>
          <View style={s.composeTypeRow}>
            {(["truth", "dare"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  s.composeTypeBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  postType === t &&
                    { backgroundColor: t === "truth" ? colors.purple : colors.red, borderColor: t === "truth" ? colors.purple : colors.red },
                ]}
                onPress={() => setPostType(t)}
                activeOpacity={0.8}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  {t === "truth" ? <Eye size={14} color={postType === t ? "#fff" : colors.sub} /> : <Flame size={14} color={postType === t ? "#fff" : colors.sub} />}
                  <Text
                    style={[
                      s.composeTypeTxt,
                      { color: colors.sub },
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
              style={[s.composeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={
                postType === "truth"
                  ? "Share a truth question..."
                  : "Share a dare..."
              }
              placeholderTextColor={colors.subAlt}
              value={postText}
              onChangeText={setPostText}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[s.composeBtn, { backgroundColor: colors.purple }, !postText.trim() && s.composeBtnDisabled]}
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
          <Text style={[s.postCount, { color: colors.subAlt }]}>{filtered.length} {postType} posts</Text>
        </View>

        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color={colors.purple} />
            <Text style={{ color: colors.sub, marginTop: 12 }}>Loading posts...</Text>
          </View>
        ) : (
          <FlatList
            data={sorted}
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
                <Inbox size={48} color={colors.sub} />
                <Text style={[s.emptyText, { color: colors.sub }]}>
                  No posts yet. Be the first to share!
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>

      <ProfileModal
        data={pfModal}
        onClose={() => setPfModal(prev => ({ ...prev, visible: false }))}
        actionMode="community"
        isFriend={pfModal.authorId ? friendIds.has(pfModal.authorId) : false}
        isSent={pfModal.authorId ? sentIds.has(pfModal.authorId) : false}
        onSendFriendRequest={async (authorId) => {
          const result = await sendFriendRequestApi(playerId, profile.name, profile.pic, authorId);
          if (result.ok && result.status !== "already_friends" && result.status !== "already_requested") {
            setSentIds(prev => new Set(prev).add(authorId));
          }
        }}
      />
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
  },
  title: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  subtitle: { color: "#a19bb3", fontSize: 12, marginTop: 1 },
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
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  composeTypeTxt: { fontSize: 13, fontWeight: "700", color: "#a19bb3" },
  composeRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  composeInput: {
    flex: 1,
    backgroundColor: "rgba(23, 19, 50, 0.5)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: RADIUS.small,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 14,
    minHeight: 44,
    textAlignVertical: "top",
  },
  composeBtn: {
    backgroundColor: "#3b82f6",
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
    justifyContent: "space-between",
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
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  filterBtnTxt: { fontSize: 12, fontWeight: "700", color: "#a19bb3" },
  postCount: { color: "#7c7890", fontSize: 11, fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  postCard: {
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 10,
  },
  postTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3b82f620",
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  postAvatarTxt: { color: "#3b82f6", fontSize: 13, fontWeight: "800" },
  postAuthor: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  postTime: { color: "#7c7890", fontSize: 11 },
  postTypeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  postTypeTruth: {
    backgroundColor: "#3b82f615",
    borderWidth: 1,
    borderColor: "#3b82f630",
  },
  postTypeDare: {
    backgroundColor: "#dc262615",
    borderWidth: 1,
    borderColor: "#dc262630",
  },
  postTypeText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  postText: { color: "#ffffff", fontSize: 14, lineHeight: 21, fontWeight: "500" },
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
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  likeBtnActive: { backgroundColor: "#dc262620", borderColor: "#dc262640" },
  likeBtnText: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { color: "#a19bb3", fontSize: 14, textAlign: "center" },
});
