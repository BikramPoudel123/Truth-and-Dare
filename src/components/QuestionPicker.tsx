/**
 * QuestionPicker — modal shown to the asker during question_set phase.
 * They can browse the local question bank OR community posts and tap one to fill the input.
 */
import { QUESTIONS, QCategory, QTag, Question } from "@/data/questions";
import { useProfile } from "@/contexts/ProfileContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar } from "@/components/Avatar";
import { ProfileModal, ProfileModalData, DEFAULT_MODAL_DATA } from "@/components/ProfileModal";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, Modal, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { Eye, Heart, Megaphone, Sparkles, UserPlus, UserCheck, X } from "lucide-react-native";

import { getLevelProgress } from "@/utils/levels";
import { getHttpBase, fetchProfileCached, sendFriendRequest as sendFriendRequestApi, fetchFriendIdsAndSent } from "@/utils/http";
import { INTEREST_LABEL } from "@/constants/profile";

interface CommunityPost {
  id: string;
  author: string;
  author_id?: string;
  profilePic?: string | null;
  type: string;
  text: string;
  likes: number;
}

interface Props {
  visible: boolean;
  mode: "truth" | "dare" | null;
  moodTags?: string[];
  onSelect: (text: string) => void;
  onClose: () => void;
}

export function QuestionPicker({ visible, mode, moodTags, onSelect, onClose }: Props) {
  const { playerId, profile } = useProfile();
  const { colors } = useTheme();
  const youSuffix = (name: string, authorId?: string) => (authorId === playerId || name === profile.name) ? " (you)" : "";
  const [tab, setTab] = useState<"bank" | "community">("bank");
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [pfModal, setPfModal] = useState<ProfileModalData>(DEFAULT_MODAL_DATA);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { friendIds, sentIds } = await fetchFriendIdsAndSent(playerId);
      setFriendIds(friendIds);
      setSentIds(sentIds);
    })();
  }, []);

  useEffect(() => {
    if (visible && tab === "community") loadCommunity();
  }, [visible, tab]);

  const loadCommunity = async () => {
    setLoadingCommunity(true);
    try {
      const res = await fetch(`${getHttpBase()}/community/posts`);
      const data = await res.json();
      setCommunityPosts(data.posts ?? []);
    } catch {}
    setLoadingCommunity(false);
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

  // Filter question bank by current mode and mood tags
  const bankQuestions: Question[] = QUESTIONS.filter(
    q => (!mode || q.type === (mode as QCategory)) &&
         (!moodTags || moodTags.length === 0 || q.tags.some(t => moodTags.includes(t)))
  );

  // Filter community by current mode
  const communityFiltered = communityPosts.filter(
    p => !mode || p.type === mode
  );

  const pick = (text: string) => { onSelect(text); onClose(); };

  const renderAvatar = (authorId: string | undefined, name: string, pic: string | null | undefined, size: number = 32) => {
    const isSelf = authorId === playerId;
    const avatar = <Avatar uri={pic} name={name} size={size} borderWidth={1.5} borderColor={colors.border} />;
    if (isSelf) return avatar;
    return (
      <TouchableOpacity onPress={() => openProfile(authorId, name)} activeOpacity={0.7}>
        {avatar}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.text }]}>Pick a Question</Text>
            <Text style={[s.subtitle, { color: colors.sub }]}>{mode ? (mode === "truth" ? "Truth questions" : "Dare challenges") : "All"}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: colors.bg }]}>
            <X size={16} color={colors.sub} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[s.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[s.tab, tab === "bank" && s.tabActive]} onPress={() => setTab("bank")} activeOpacity={0.8}>
            <Sparkles size={14} color={tab === "bank" ? colors.purple : colors.subAlt} />
            <Text style={[s.tabText, { color: colors.subAlt }, tab === "bank" && s.tabTextActive]}> Question Bank</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === "community" && s.tabActive]} onPress={() => setTab("community")} activeOpacity={0.8}>
            <Megaphone size={14} color={tab === "community" ? colors.purple : colors.subAlt} />
            <Text style={[s.tabText, { color: colors.subAlt }, tab === "community" && s.tabTextActive]}> Community</Text>
          </TouchableOpacity>
        </View>

        {/* Bank list */}
        {tab === "bank" && (
          <FlatList
            data={bankQuestions}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews
            renderItem={({ item }) => (
              <TouchableOpacity style={[s.qCard, { backgroundColor: colors.surface, borderColor: colors.border }, item.type === "truth" ? s.qTruth : s.qDare]} onPress={() => pick(item.text)} activeOpacity={0.8}>
                <View style={[s.typeDot, { backgroundColor: item.type === "truth" ? colors.purple : colors.red }]} />
                <Text style={[s.qText, { color: colors.text }]}>{item.text}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Community list */}
        {tab === "community" && (
          loadingCommunity ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={colors.purple} size="large" />
            </View>
          ) : (
            <FlatList
              data={communityFiltered}
              keyExtractor={i => i.id}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={[s.empty, { color: colors.subAlt }]}>No community posts yet for this type.</Text>}
              windowSize={5}
              maxToRenderPerBatch={10}
              removeClippedSubviews
              renderItem={({ item }) => (
                <TouchableOpacity style={[s.postCard, { backgroundColor: colors.surface, borderColor: colors.border }, item.type === "truth" ? s.postTruth : s.postDare]} onPress={() => pick(item.text)} activeOpacity={0.8}>
                  <View style={s.postLeft}>
                    {renderAvatar(item.author_id, item.author, item.profilePic, 36)}
                  </View>
                  <View style={s.postRight}>
                    <View style={s.postTop}>
                      <Text style={[s.postAuthor, { color: colors.text }]}>{item.author}</Text>
                      <View style={[s.typeBadge, { backgroundColor: item.type === "truth" ? `${colors.purple}20` : `${colors.red}20` }]}>
                        <Text style={[s.typeBadgeTxt, { color: item.type === "truth" ? colors.purple : colors.red }]}>
                          {item.type === "truth" ? "Truth" : "Dare"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[s.postText, { color: colors.sub }]}>{item.text}</Text>
                    <View style={s.postMeta}>
                      <Heart size={12} color={colors.subAlt} />
                      <Text style={[s.likeCount, { color: colors.subAlt }]}>{item.likes}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )
        )}
      </View>

      {/* Profile modal */}
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
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", borderBottomWidth: 1, gap: 0 },
  tab: { flex: 1, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.purple },
  tabText: { fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: COLORS.purple },
  list: { padding: 16, gap: 10 },
  qCard: { borderRadius: 14, padding: 14, borderWidth: 1.5, flexDirection: "row", alignItems: "flex-start", gap: 10, ...SHADOWS.subtle },
  qTruth: { borderLeftWidth: 4, borderLeftColor: COLORS.purple },
  qDare:  { borderLeftWidth: 4, borderLeftColor: COLORS.red },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  qText: { fontSize: 14, fontWeight: "600", lineHeight: 21, flex: 1 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },

  postCard: { borderRadius: 14, padding: 12, borderWidth: 1, flexDirection: "row", gap: 10, ...SHADOWS.subtle },
  postTruth: {},
  postDare: {},
  postLeft: { paddingTop: 2 },
  postRight: { flex: 1, gap: 6 },
  postTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  postAuthor: { fontSize: 13, fontWeight: "700", flex: 1 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeTxt: { fontSize: 10, fontWeight: "800" },
  postText: { fontSize: 13, fontWeight: "500", lineHeight: 19 },
  postMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  likeCount: { fontSize: 11, fontWeight: "600" },

});
