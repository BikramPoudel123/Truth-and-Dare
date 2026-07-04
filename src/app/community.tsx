import { SERVER_URL } from "@/constants/server";
import { useProfile } from "@/contexts/ProfileContext";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BG = "#f8faff",
  CARD = "#ffffff",
  BLUE = "#3b82f6";
const BLUE_D = "#1d4ed8",
  BLUE_L = "#eff6ff",
  BLUE_M = "#bfdbfe";
const TEXT = "#0f172a",
  SUB = "#64748b",
  HINT = "#94a3b8",
  BORDER = "#e2e8f0";

// Derive HTTP base from SERVER_URL (ws:// → http://)
function getHttpBase() {
  return SERVER_URL.replace(/^ws:\/\//, "http://")
    .replace(/^wss:\/\//, "https://")
    .replace(/\/$/, "");
}

export interface CommunityPost {
  id: string;
  author: string;
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

  const base = getHttpBase();

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

  const filtered = posts.filter((p) => filter === "all" || p.type === filter);

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <View style={s.postCard}>
      <View style={s.postTop}>
        <View style={s.postAvatar}>
          <Text style={s.postAvatarTxt}>
            {item.author.slice(0, 2).toUpperCase()}
          </Text>
        </View>
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
          <Text
            style={[
              s.postTypeText,
              { color: item.type === "truth" ? BLUE_D : "#c2410c" },
            ]}
          >
            {item.type === "truth" ? "👁 TRUTH" : "🔥 DARE"}
          </Text>
        </View>
      </View>
      <Text style={s.postText}>{item.text}</Text>
      <View style={s.postActions}>
        <TouchableOpacity
          style={[s.likeBtn, item.likedByMe && s.likeBtnActive]}
          onPress={() => likePost(item.id)}
          activeOpacity={0.8}
        >
          <Text style={s.likeBtnText}>
            {item.likedByMe ? "❤️" : "🤍"} {item.likes}
          </Text>
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
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Community</Text>
            <Text style={s.subtitle}>Share & discover questions</Text>
          </View>
        </View>

        {/* Compose */}
        <View style={s.compose}>
          <View style={s.composeTypeRow}>
            {(["truth", "dare"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  s.composeTypeBtn,
                  postType === t &&
                    (t === "truth" ? s.composeTruth : s.composeDare),
                ]}
                onPress={() => setPostType(t)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.composeTypeTxt,
                    postType === t && { color: "#fff" },
                  ]}
                >
                  {t === "truth" ? "👁 Truth" : "🔥 Dare"}
                </Text>
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
              placeholderTextColor={HINT}
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

        {/* Filter */}
        <View style={s.filterRow}>
          {(["all", "truth", "dare"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterBtn, filter === f && s.filterBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text
                style={[s.filterBtnTxt, filter === f && s.filterBtnTxtActive]}
              >
                {f === "all" ? "All" : f === "truth" ? "👁 Truth" : "🔥 Dare"}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          <Text style={s.postCount}>{filtered.length} posts</Text>
        </View>

        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={{ color: HINT, marginTop: 12 }}>Loading posts...</Text>
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
                <Text style={s.emptyIcon}>📭</Text>
                <Text style={s.emptyText}>
                  No posts yet. Be the first to share!
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  title: { color: TEXT, fontSize: 18, fontWeight: "900" },
  subtitle: { color: SUB, fontSize: 12, marginTop: 1 },
  compose: {
    backgroundColor: CARD,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 8,
  },
  composeTypeRow: { flexDirection: "row", gap: 8 },
  composeTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  composeTruth: { backgroundColor: BLUE, borderColor: BLUE },
  composeDare: { backgroundColor: "#f97316", borderColor: "#f97316" },
  composeTypeTxt: { fontSize: 13, fontWeight: "700", color: SUB },
  composeRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  composeInput: {
    flex: 1,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BLUE_M,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT,
    fontSize: 14,
    minHeight: 44,
    textAlignVertical: "top",
  },
  composeBtn: {
    backgroundColor: BLUE,
    borderRadius: 12,
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
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterBtnActive: { backgroundColor: BLUE_L, borderColor: BLUE_M },
  filterBtnTxt: { fontSize: 12, fontWeight: "700", color: SUB },
  filterBtnTxtActive: { color: BLUE_D },
  postCount: { color: HINT, fontSize: 11, fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  postCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 10,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  postTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BLUE_L,
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarTxt: { color: BLUE_D, fontSize: 13, fontWeight: "800" },
  postAuthor: { color: TEXT, fontSize: 13, fontWeight: "700" },
  postTime: { color: HINT, fontSize: 11 },
  postTypeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  postTypeTruth: {
    backgroundColor: BLUE_L,
    borderWidth: 1,
    borderColor: BLUE_M,
  },
  postTypeDare: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  postTypeText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  postText: { color: TEXT, fontSize: 14, lineHeight: 21, fontWeight: "500" },
  postActions: { flexDirection: "row", alignItems: "center" },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  likeBtnActive: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  likeBtnText: { fontSize: 13, fontWeight: "700", color: TEXT },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: HINT, fontSize: 14, textAlign: "center" },
});
