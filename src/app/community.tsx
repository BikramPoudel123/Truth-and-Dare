import { SERVER_URL } from "@/constants/server";
import { useProfile } from "@/contexts/ProfileContext";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { Crown, Eye, Flame, Heart, Inbox, PartyPopper, Skull, SmilePlus, Star, UserPlus, Zap } from "lucide-react-native";

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
  const [filter, setFilter] = useState<"all" | "truth" | "dare">("all");
  const [profileModal, setProfileModal] = useState<{ visible: boolean; authorId: string | null; name: string; bio: string; pic: string | null; interests: string[]; playStyle: string | null; reactions: Record<string, number>; loading: boolean }>({ visible: false, authorId: null, name: "", bio: "", pic: null, interests: [], playStyle: null, reactions: {}, loading: false });
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

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
        setPosts((prev) => [data.post, ...prev]);
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
    setProfileModal({ visible: true, authorId, name: authorName, bio: "", pic: null, interests: [], playStyle: null, reactions: {}, loading: true });
    try {
      const res = await fetch(`${base}/profile/${encodeURIComponent(authorId)}`);
      if (res.ok) {
        const data = await res.json();
        setProfileModal({ visible: true, authorId, name: data.name, bio: data.bio, pic: data.pic, interests: data.interests, playStyle: data.playStyle, reactions: data.reactions ?? {}, loading: false });
      } else {
        setProfileModal(prev => ({ ...prev, authorId, loading: false }));
      }
    } catch {
      setProfileModal(prev => ({ ...prev, authorId, loading: false }));
    }
  };

  const filtered = posts.filter((p) => filter === "all" || p.type === filter);

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <View style={s.postCard}>
      <View style={s.postTop}>
        {item.author_id && item.author_id !== playerId ? (
          <TouchableOpacity onPress={() => openProfile(item.author_id, item.author)} activeOpacity={0.7}>
            {item.profilePic ? (
              <Image source={{ uri: item.profilePic }} style={s.postAvatarImg} />
            ) : (
              <View style={s.postAvatar}>
                <Text style={s.postAvatarTxt}>
                  {item.author.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          item.profilePic ? (
            <Image source={{ uri: item.profilePic }} style={s.postAvatarImg} />
          ) : (
            <View style={s.postAvatar}>
              <Text style={s.postAvatarTxt}>
                {item.author.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.postAuthor}>{item.author}</Text>
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
          {(["all", "truth", "dare"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterBtn, filter === f && { backgroundColor: `${COLORS.purple}20`, borderColor: COLORS.purple }]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              {f === "all" ? (
                <Text style={[s.filterBtnTxt, filter === f && { color: COLORS.text }]}>All</Text>
              ) : (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  {f === "truth" ? <Eye size={12} color={filter === f ? COLORS.text : COLORS.sub} /> : <Flame size={12} color={filter === f ? COLORS.text : COLORS.sub} />}
                  <Text style={[s.filterBtnTxt, filter === f && { color: COLORS.text }]}>{f === "truth" ? "Truth" : "Dare"}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          <Text style={s.postCount}>{filtered.length} posts</Text>
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

      <Modal visible={profileModal.visible} transparent animationType="fade" onRequestClose={() => setProfileModal(prev => ({ ...prev, visible: false }))}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setProfileModal(prev => ({ ...prev, visible: false }))}>
          <TouchableOpacity style={s.modalCard} activeOpacity={1} onPress={() => {}}>
            {profileModal.loading ? (
              <ActivityIndicator size="large" color={COLORS.purple} />
            ) : (
              <ScrollView contentContainerStyle={{ alignItems: "center", gap: 16 }} showsVerticalScrollIndicator={false}>
                {profileModal.pic ? (
                  <Image source={{ uri: profileModal.pic }} style={s.modalAvatar} />
                ) : (
                  <View style={[s.modalAvatar, s.modalAvatarPlaceholder]}>
                    <Text style={s.modalAvatarTxt}>{profileModal.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                )}
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
                {profileModal.authorId && profileModal.authorId !== playerId && !friendIds.has(profileModal.authorId) && (
                  sentIds.has(profileModal.authorId)
                    ? (
                      <View style={[s.addFriendBtn, { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }]}>
                        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "700" }}>Request Sent</Text>
                      </View>
                    )
                    : (
                      <TouchableOpacity
                        style={s.addFriendBtn}
                        onPress={async () => {
                          try {
                            const res = await fetch(`${base}/friends/request`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ from_id: playerId, from_name: profile.name, from_pic: profile.pic, to_id: profileModal.authorId }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              if (data.status === "already_friends") { Alert.alert("Already Friends", "You are already friends with this player."); }
                              else if (data.status === "already_requested") { Alert.alert("Request Pending", "A friend request is already pending."); }
                              else { Alert.alert("Sent", "Friend request sent!"); }
                            }
                          } catch {}
                        }}
                        activeOpacity={0.8}
                      >
                        <UserPlus size={14} color="#fff" />
                        <Text style={s.addFriendTxt}>Add Friend</Text>
                      </TouchableOpacity>
                    )
                )}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
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
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  modalCard: {
    width: "100%",
    maxWidth: 300,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.cardSm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    alignItems: "center",
    ...SHADOWS.glow,
  },
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
  addFriendBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.purple, borderRadius: RADIUS.button, paddingVertical: 10, paddingHorizontal: 20, width: "100%", justifyContent: "center" },
  addFriendTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
