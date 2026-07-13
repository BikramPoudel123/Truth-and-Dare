/**
 * QuestionPicker — modal shown to the asker during question_set phase.
 * They can browse the local question bank OR community posts and tap one to fill the input.
 */
import { QUESTIONS, QCategory, QTag, Question } from "@/data/questions";
import { SERVER_URL } from "@/constants/server";
import { useProfile } from "@/contexts/ProfileContext";
import { Avatar } from "@/components/Avatar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, Modal, PanResponder, Pressable, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, Alert, useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS as APP_COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { CalendarDays, Crown, Eye, Flame, Gamepad2, Heart, PartyPopper, Skull, SmilePlus, Sparkles, Star, UserPlus, UserMinus, UserCheck, Users, Zap, Megaphone, X } from "lucide-react-native";

import { getLevelProgress } from "@/utils/levels";

const BG = APP_COLORS.bg;
const CARD = "rgba(23, 19, 50, 0.7)";
const BORDER = APP_COLORS.border;
const TEXT = APP_COLORS.text;
const SUB = APP_COLORS.sub;
const HINT = APP_COLORS.subAlt;

function getHttpBase() {
  return SERVER_URL.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://").replace(/\/$/, "");
}

const INTEREST_LABEL: Record<string, string> = {
  "fun": "fun",
  "life": "life",
  "hot": "hot",
  "connect": "connect",
  "spicy": "spicy",
  "deep": "deep",
};

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
  const youSuffix = (name: string, authorId?: string) => (authorId === playerId || name === profile.name) ? " (you)" : "";
  const [tab, setTab] = useState<"bank" | "community">("bank");
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [pfModal, setPfModal] = useState<{ visible: boolean; authorId: string | null; name: string; bio: string; pic: string | null; interests: string[]; playStyle: string | null; reactions: Record<string, number>; gamesPlayed: number; level: number; playedSince: string; loading: boolean }>({ visible: false, authorId: null, name: "", bio: "", pic: null, interests: [], playStyle: null, reactions: {}, gamesPlayed: 0, level: 1, playedSince: "", loading: false });
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
  const pfPanDismiss = useCallback(() => setPfModal(prev => ({ ...prev, visible: false })), []);
  const pfPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10 && gs.vy > 0 && pfScrollY.current <= 1,
    onPanResponderRelease: (_, gs) => { if (gs.dy > 100) pfPanDismiss(); },
  })).current;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getHttpBase()}/friends/${playerId}`);
        if (res.ok) {
          const data = await res.json();
          setFriendIds(new Set(data.friends.map((f: { id: string }) => f.id)));
          setSentIds(new Set(data.sent ?? []));
        }
      } catch {}
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
    setPfModal({ visible: true, authorId, name: authorName, bio: "", pic: null, interests: [], playStyle: null, reactions: {}, gamesPlayed: 0, level: 1, playedSince: "", loading: true });
    try {
      await fetch(`${getHttpBase()}/friends/${encodeURIComponent(playerId)}`).then(async r => {
        if (r.ok) { const d = await r.json(); setFriendIds(new Set(d.friends.map((f: { id: string }) => f.id))); setSentIds(new Set(d.sent ?? [])); }
      });
    } catch {}
    try {
      const res = await fetch(`${getHttpBase()}/profile/${encodeURIComponent(authorId)}`);
      if (res.ok) {
        const data = await res.json();
        setPfModal({ visible: true, authorId, name: data.name, bio: data.bio, pic: data.pic, interests: data.interests, playStyle: data.playStyle, reactions: data.reactions ?? {}, gamesPlayed: data.gamesPlayed ?? 0, level: data.level ?? 1, playedSince: data.played_since ?? "", loading: false });
      } else {
        setPfModal(prev => ({ ...prev, authorId, loading: false }));
      }
    } catch {
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

  const playStyleIcon = (style: string | null): [React.ComponentType<{size: number; color: string}>, string] => {
    const map: Record<string, [React.ComponentType<{size: number; color: string}>, string]> = {
      "Rising Star":      [Star, APP_COLORS.gold],
      "Hot Player":       [Flame, APP_COLORS.orange],
      "Funny Player":     [SmilePlus, "#facc15"],
      "Heartthrob":       [Heart, APP_COLORS.pink],
      "Shocking Player":  [Zap, APP_COLORS.electricBlue],
      "Savage Player":    [Skull, "#a855f7"],
      "Emotional Player": [Heart, "#60a5fa"],
      "Life of the Party":[PartyPopper, "#f97316"],
      "Respected Player": [Crown, APP_COLORS.gold],
    };
    return map[style ?? ""] ?? [Star, SUB];
  };

  const renderAvatar = (authorId: string | undefined, name: string, pic: string | null | undefined, size: number = 32) => {
    const isSelf = authorId === playerId;
    const avatar = <Avatar uri={pic} name={name} size={size} borderWidth={1.5} borderColor={BORDER} />;
    if (isSelf) return avatar;
    return (
      <TouchableOpacity onPress={() => openProfile(authorId, name)} activeOpacity={0.7}>
        {avatar}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Pick a Question</Text>
            <Text style={s.subtitle}>{mode ? (mode === "truth" ? "Truth questions" : "Dare challenges") : "All"}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={16} color={SUB} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab === "bank" && s.tabActive]} onPress={() => setTab("bank")} activeOpacity={0.8}>
            <Sparkles size={14} color={tab === "bank" ? APP_COLORS.purple : HINT} />
            <Text style={[s.tabText, tab === "bank" && s.tabTextActive]}> Question Bank</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === "community" && s.tabActive]} onPress={() => setTab("community")} activeOpacity={0.8}>
            <Megaphone size={14} color={tab === "community" ? APP_COLORS.purple : HINT} />
            <Text style={[s.tabText, tab === "community" && s.tabTextActive]}> Community</Text>
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
              <TouchableOpacity style={[s.qCard, item.type === "truth" ? s.qTruth : s.qDare]} onPress={() => pick(item.text)} activeOpacity={0.8}>
                <View style={[s.typeDot, { backgroundColor: item.type === "truth" ? APP_COLORS.purple : APP_COLORS.red }]} />
                <Text style={s.qText}>{item.text}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Community list */}
        {tab === "community" && (
          loadingCommunity ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={APP_COLORS.purple} size="large" />
            </View>
          ) : (
            <FlatList
              data={communityFiltered}
              keyExtractor={i => i.id}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={s.empty}>No community posts yet for this type.</Text>}
              windowSize={5}
              maxToRenderPerBatch={10}
              removeClippedSubviews
              renderItem={({ item }) => (
                <TouchableOpacity style={[s.postCard, item.type === "truth" ? s.postTruth : s.postDare]} onPress={() => pick(item.text)} activeOpacity={0.8}>
                  <View style={s.postLeft}>
                    {renderAvatar(item.author_id, item.author, item.profilePic, 36)}
                  </View>
                  <View style={s.postRight}>
                    <View style={s.postTop}>
                      <Text style={s.postAuthor}>{item.author}</Text>
                      <View style={[s.typeBadge, { backgroundColor: item.type === "truth" ? `${APP_COLORS.purple}20` : `${APP_COLORS.red}20` }]}>
                        <Text style={[s.typeBadgeTxt, { color: item.type === "truth" ? APP_COLORS.purple : APP_COLORS.red }]}>
                          {item.type === "truth" ? "Truth" : "Dare"}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.postText}>{item.text}</Text>
                    <View style={s.postMeta}>
                      <Heart size={12} color={HINT} />
                      <Text style={s.likeCount}>{item.likes}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )
        )}
      </View>

      {/* Profile modal — bottom sheet */}
      <Modal visible={pfModal.visible} transparent animationType="slide" onRequestClose={() => setPfModal(prev => ({ ...prev, visible: false }))}>
        <Pressable style={s.pfOverlay} onPress={() => setPfModal(prev => ({ ...prev, visible: false }))}>
          <View style={[s.pfCard, { maxWidth: rCardW, maxHeight: rCardMaxH, paddingHorizontal: rHozPad, paddingBottom: rBotPad, borderTopLeftRadius: rTopRad, borderTopRightRadius: rTopRad }]} {...pfPanResponder.panHandlers}>
            <View style={[s.pfGrabber, { marginBottom: rGrabMarg }]} />
            {pfModal.loading ? (
              <ActivityIndicator size="large" color={APP_COLORS.purple} />
            ) : (
              <ScrollView contentContainerStyle={{ alignItems: "center", gap: 16 }} showsVerticalScrollIndicator={false} style={{ alignSelf: "stretch" }} bounces={true} onScroll={(e) => { pfScrollY.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}>
                <Avatar uri={pfModal.pic} name={pfModal.name} size={72} borderWidth={2} borderColor={APP_COLORS.purple} />
                <Text style={s.pfName}>{pfModal.name}{youSuffix(pfModal.name, pfModal.authorId ?? undefined)}</Text>

                {pfModal.playStyle && (() => {
                  const [Icon, color] = playStyleIcon(pfModal.playStyle);
                  return (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: RADIUS.pill, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: BORDER }}>
                      <Icon size={13} color={color} />
                      <Text style={{ color: APP_COLORS.text, fontSize: 11, fontWeight: "700" }}>{pfModal.playStyle}</Text>
                    </View>
                  );
                })()}

                {/* Stats Card */}
                <View style={s.pfStatsCard}>
                  <View style={s.pfStatColumn}>
                    <Crown size={18} color={APP_COLORS.gold} />
                    <Text style={s.pfStatNumber}>{pfModal.level}</Text>
                    <View style={{ width: "100%", height: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
                      <View style={{ width: `${(pfModal.gamesPlayed % 10) * 10}%`, height: "100%", backgroundColor: APP_COLORS.gold, borderRadius: 2 }} />
                    </View>
                    <Text style={s.pfStatLabel} numberOfLines={1}>Level</Text>
                  </View>
                  <View style={s.pfStatDivider} />
                  <View style={s.pfStatColumn}>
                    <SmilePlus size={18} color={SUB} />
                    <Text style={s.pfStatNumber}>{Object.keys(pfModal.reactions).length > 0 ? Object.values(pfModal.reactions).reduce((a, b) => a + b, 0) : 0}</Text>
                    <Text style={s.pfStatLabel} numberOfLines={1}>Reactions</Text>
                  </View>
                  <View style={s.pfStatDivider} />
                  <View style={s.pfStatColumn}>
                    <CalendarDays size={18} color={SUB} />
                    <Text style={s.pfStatDate} numberOfLines={1}>
                      {pfModal.playedSince
                        ? new Date(pfModal.playedSince).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </Text>
                    <Text style={s.pfStatLabel} numberOfLines={1}>Played Since</Text>
                  </View>
                </View>

                {Object.keys(pfModal.reactions).length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                    {Object.entries(pfModal.reactions).map(([emoji, count]) => (
                      <View key={emoji} style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: BORDER }}>
                        <Text style={{ fontSize: 14 }}>{emoji}</Text>
                        <Text style={{ color: SUB, fontSize: 11, fontWeight: "700" }}>{count}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {pfModal.bio ? <Text style={s.pfBio}>{pfModal.bio}</Text> : null}
                {pfModal.interests.length > 0 && (
                  <>
                    <Text style={{ color: SUB, fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" }}>Interests</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                      {pfModal.interests.map((i) => (
                        <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: `${APP_COLORS.purple}15`, borderWidth: 1, borderColor: `${APP_COLORS.purple}30` }}>
                          <Text style={{ color: APP_COLORS.purple, fontSize: 11, fontWeight: "700" }}>{INTEREST_LABEL[i] ?? i}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>
              )}
              {!pfModal.loading && pfModal.authorId && pfModal.authorId !== playerId && (
                <View style={s.pfFriendIconWrap}>
                  {friendIds.has(pfModal.authorId) ? (
                    <View style={s.pfFriendIcon}>
                      <Users size={18} color={APP_COLORS.green} />
                    </View>
                  ) : sentIds.has(pfModal.authorId) ? (
                    <View style={s.pfFriendIcon}>
                      <UserCheck size={18} color={APP_COLORS.blue} />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={s.pfFriendIcon}
                      onPress={async () => {
                        try {
                          const res = await fetch(`${getHttpBase()}/friends/request`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ from_id: playerId, from_name: profile.name, from_pic: profile.pic, to_id: pfModal.authorId }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            if (data.status !== "already_friends" && data.status !== "already_requested") { setSentIds(prev => new Set(prev).add(pfModal.authorId!)); }
                          }
                        } catch {}
                      }}
                      activeOpacity={0.7}
                    >
                      <UserPlus size={18} color={APP_COLORS.purple} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
          </View>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { color: TEXT, fontSize: 18, fontWeight: "900" },
  subtitle: { color: SUB, fontSize: 12, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: BG, alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 0 },
  tab: { flex: 1, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: APP_COLORS.purple },
  tabText: { fontSize: 13, fontWeight: "700", color: HINT },
  tabTextActive: { color: APP_COLORS.purple },
  list: { padding: 16, gap: 10 },
  qCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: BORDER, flexDirection: "row", alignItems: "flex-start", gap: 10, ...SHADOWS.subtle },
  qTruth: { borderLeftWidth: 4, borderLeftColor: APP_COLORS.purple },
  qDare:  { borderLeftWidth: 4, borderLeftColor: APP_COLORS.red },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  qText: { color: TEXT, fontSize: 14, fontWeight: "600", lineHeight: 21, flex: 1 },
  empty: { color: HINT, textAlign: "center", marginTop: 40, fontSize: 14 },

  // Community post cards
  postCard: { backgroundColor: CARD, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BORDER, flexDirection: "row", gap: 10, ...SHADOWS.subtle },
  postTruth: {},
  postDare: {},
  postLeft: { paddingTop: 2 },
  postRight: { flex: 1, gap: 6 },
  postTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  postAuthor: { color: TEXT, fontSize: 13, fontWeight: "700", flex: 1 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeTxt: { fontSize: 10, fontWeight: "800" },
  postText: { color: SUB, fontSize: 13, fontWeight: "500", lineHeight: 19 },
  postMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  likeCount: { color: HINT, fontSize: 11, fontWeight: "600" },

  // Profile modal (bottom sheet)
  pfOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  pfCard: { width: "100%", backgroundColor: BG, paddingTop: 4, alignItems: "center", alignSelf: "center", ...SHADOWS.glow },
  pfGrabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center" },
  pfAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: APP_COLORS.purple },
  pfName: { color: TEXT, fontSize: 18, fontWeight: "800" },
  pfBio: { color: SUB, fontSize: 13, textAlign: "center", lineHeight: 18 },
  pfFriendIconWrap: { position: "absolute", top: 4, right: 8, zIndex: 10 },
  pfFriendIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  pfStatsCard: { flexDirection: "row", backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BORDER, width: "100%" },
  pfStatColumn: { flex: 1, alignItems: "center", gap: 4 },
  pfStatNumber: { color: TEXT, fontSize: 18, fontWeight: "900" },
  pfStatLabel: { color: SUB, fontSize: 10, fontWeight: "600" },
  pfStatDate: { color: TEXT, fontSize: 12, fontWeight: "800" },
  pfStatDivider: { width: 1, backgroundColor: BORDER, marginVertical: 4 },
});
