import { SERVER_URL } from "@/constants/server";
import { useProfile } from "@/contexts/ProfileContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar } from "@/components/Avatar";
import { ProfileModal, ProfileModalData, DEFAULT_MODAL_DATA } from "@/components/ProfileModal";
import { useCallback, useEffect, useRef, useState, memo, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RADIUS } from "@/constants/design-system";
import { getHttpBase, fetchProfileCached, sendFriendRequest as sendFriendRequestApi } from "@/utils/http";
import { ArrowLeft, Check, Users, UserPlus, UserMinus, UserCheck, X, User, Search, Loader2 } from "lucide-react-native";

interface FriendItem { id: string; name: string; pic: string | null; }
interface RequestItem { id: string; from: string; fromName: string; fromPic: string | null; createdAt: number; }
interface SearchResult { id: string; name: string; pic: string | null; isFriend: boolean; requestSent: boolean; }

function AnimatedListItemInner({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-15)).current;

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
const AnimatedListItem = memo(AnimatedListItemInner);

const SearchResultItem = memo(function SearchResultItemInner({
  item,
  sending,
  onSend,
  onViewProfile,
}: {
  item: SearchResult;
  sending: boolean;
  onSend: (id: string) => void;
  onViewProfile: (id: string, name: string, pic: string | null) => void;
}) {
  const { colors, shadows } = useTheme();

  const status = useMemo(() => {
    if (item.isFriend) return { icon: Users, color: colors.green, disabled: true };
    if (item.requestSent) return { icon: UserCheck, color: colors.blue, disabled: true };
    return { icon: UserPlus, color: colors.purple, disabled: false };
  }, [item.isFriend, item.requestSent, colors.green, colors.blue, colors.purple]);

  const Icon = status.icon;

  return (
    <View style={[ss.resultCard, { borderColor: colors.border, backgroundColor: colors.surface, ...shadows.subtle }]}>
      <TouchableOpacity onPress={() => onViewProfile(item.id, item.name, item.pic)} activeOpacity={0.7}>
        <Avatar uri={item.pic} name={item.name} size={40} borderWidth={1.5} borderColor={colors.border} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onViewProfile(item.id, item.name, item.pic)} activeOpacity={0.7} style={{ flex: 1 }}>
        <Text style={[ss.resultName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[ss.iconBtn, { backgroundColor: `${status.color}18`, borderColor: `${status.color}40` }, status.disabled && { opacity: 0.7 }]}
        onPress={() => !status.disabled && onSend(item.id)}
        disabled={status.disabled || sending}
        activeOpacity={0.7}
      >
        {sending ? (
          <ActivityIndicator size="small" color={status.color} />
        ) : (
          <Icon size={18} color={status.color} />
        )}
      </TouchableOpacity>
    </View>
  );
});

export default function FriendsScreen({ onBack, initialTab }: { onBack?: () => void; initialTab?: "friends" | "requests" }) {
  const { playerId, profile } = useProfile();
  const { colors, shadows } = useTheme();
  const [tab, setTab] = useState<"friends" | "requests">(initialTab ?? "friends");
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [pfModal, setPfModal] = useState<ProfileModalData>(DEFAULT_MODAL_DATA);
  const { width: screenW } = useWindowDimensions();

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
    setPfModal({ visible: true, authorId: id, name, bio: "", pic: null, interests: [], playStyle: null, reactions: {}, gamesPlayed: 0, level: 1, playedSince: "", loading: true });
    const data = await fetchProfileCached(id);
    if (data) {
      setPfModal({ visible: true, authorId: id, name: data.name, bio: data.bio, pic: data.pic, interests: data.interests, playStyle: data.playStyle, reactions: data.reactions ?? {}, gamesPlayed: data.gamesPlayed ?? 0, level: data.level ?? 1, playedSince: data.play_since ?? "", loading: false });
    } else {
      setPfModal(prev => ({ ...prev, loading: false }));
    }
  };

  const renderFriend = useCallback(({ item }: { item: FriendItem }) => (
    <AnimatedListItem>
    <TouchableOpacity style={[s.card, { borderColor: colors.border, backgroundColor: colors.surface, ...shadows.subtle }]} onPress={() => openProfile(item.id, item.name)} activeOpacity={0.7}>
      <Avatar uri={item.pic} name={item.name} size={40} borderWidth={1.5} borderColor={colors.border} />
      <Text style={[s.cardName, { color: colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
    </AnimatedListItem>
  ), [openProfile, colors.border, colors.text]);

  const renderRequest = useCallback(({ item }: { item: RequestItem }) => (
    <AnimatedListItem>
    <View style={[s.card, { borderColor: colors.border, backgroundColor: colors.surface, ...shadows.subtle }]}>
      <Avatar uri={item.fromPic} name={item.fromName} size={40} borderWidth={1.5} borderColor={colors.border} />
      <Text style={[s.cardName, { color: colors.text }]}>{item.fromName}</Text>
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.acceptBtn, { backgroundColor: colors.green }, accepting === item.id && { opacity: 0.5 }]}
          onPress={() => handleAccept(item.id)}
          disabled={accepting === item.id}
          activeOpacity={0.8}
        >
          {accepting === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity style={[s.rejectBtn, { backgroundColor: `${colors.red}20`, borderColor: `${colors.red}40` }]} onPress={() => handleReject(item.id)} activeOpacity={0.8}>
          <X size={16} color={colors.red} />
        </TouchableOpacity>
      </View>
    </View>
    </AnimatedListItem>
  ), [accepting, handleAccept, handleReject, colors.border, colors.text, colors.green, colors.red]);

  const ListEmpty = ({ icon: Icon, text }: { icon: React.ComponentType<{size: number; color: string}>; text: string }) => (
    <View style={s.emptyState}>
      <Icon size={48} color={colors.sub} />
      <Text style={[s.emptyText, { color: colors.sub }]}>{text}</Text>
    </View>
  );

  const data = tab === "friends" ? friends : requests;

  // ─── Search state ────────────────────────────────────────────────────────
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`${base}/players/search?query=${encodeURIComponent(trimmed)}&player_id=${encodeURIComponent(playerId)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results ?? []);
      }
    } catch {}
    setSearchLoading(false);
  }, [base, playerId]);

  const onSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 300);
  }, [doSearch]);

  const openSearch = useCallback(() => {
    setSearchVisible(true);
    setSearchQuery("");
    setSearchResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchVisible(false);
    setSearchQuery("");
    setSearchResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const sendFriendRequest = useCallback(async (targetId: string) => {
    setSendingTo(targetId);
    const result = await sendFriendRequestApi(playerId, profile.name, profile.pic, targetId);
    if (result.ok) {
      setSearchResults(prev => prev.map(r => {
        if (r.id !== targetId) return r;
        if (result.status === "already_friends") return { ...r, isFriend: true };
        return { ...r, requestSent: true };
      }));
    }
    setSendingTo(null);
  }, [playerId, profile.name, profile.pic]);

  const viewSearchProfile = useCallback(async (id: string, name: string, pic: string | null) => {
    setPfModal({ visible: true, authorId: id, name, bio: "", pic, interests: [], playStyle: null, reactions: {}, gamesPlayed: 0, level: 1, playedSince: "", loading: true });
    const data = await fetchProfileCached(id);
    if (data) {
      setPfModal({ visible: true, authorId: id, name: data.name, bio: data.bio, pic: data.pic, interests: data.interests, playStyle: data.playStyle, reactions: data.reactions ?? {}, gamesPlayed: data.gamesPlayed ?? 0, level: data.level ?? 1, playedSince: data.play_since ?? "", loading: false });
    } else {
      setPfModal(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const renderSearchResult = useCallback(({ item }: { item: SearchResult }) => (
    <SearchResultItem item={item} sending={sendingTo === item.id} onSend={sendFriendRequest} onViewProfile={viewSearchProfile} />
  ), [sendingTo, sendFriendRequest, viewSearchProfile]);

  const searchKeyExtractor = useCallback((item: SearchResult) => item.id, []);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={[s.backBtn, { borderColor: colors.border, backgroundColor: colors.glassBg }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.text }]}>Friends</Text>
          <Text style={[s.subtitle, { color: colors.sub }]}>Manage your friends</Text>
        </View>
        <TouchableOpacity style={[s.searchBtn, { backgroundColor: `${colors.purple}18`, borderColor: `${colors.purple}40` }]} onPress={openSearch} activeOpacity={0.7}>
          <UserPlus size={18} color={colors.purple} />
        </TouchableOpacity>
        {tab === "requests" && requests.length > 0 && (
          <View style={[s.badge, { backgroundColor: colors.purple }]}>
            <Text style={s.badgeTxt}>{requests.length}</Text>
          </View>
        )}
      </View>

      <View style={[s.tabs, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[s.tab, tab === "friends" && [s.tabActive, { borderBottomColor: colors.purple }]]} onPress={() => setTab("friends")} activeOpacity={0.8}>
          <View style={{flexDirection: "row", alignItems: "center", gap: 6}}>
            <Users size={14} color={tab === "friends" ? colors.purple : colors.sub} />
            <Text style={[s.tabTxt, { color: colors.sub }, tab === "friends" && [s.tabTxtActive, { color: colors.purple }]]}>Friends</Text>
          </View>
          {friends.length > 0 && <Text style={[s.tabCount, { color: colors.subAlt, backgroundColor: colors.glassBg }, tab === "friends" && {color: colors.purple}]}>{friends.length}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === "requests" && [s.tabActive, { borderBottomColor: colors.purple }]]} onPress={() => setTab("requests")} activeOpacity={0.8}>
          <View style={{flexDirection: "row", alignItems: "center", gap: 6}}>
            <UserPlus size={14} color={tab === "requests" ? colors.purple : colors.sub} />
            <Text style={[s.tabTxt, { color: colors.sub }, tab === "requests" && [s.tabTxtActive, { color: colors.purple }]]}>Requests</Text>
          </View>
          {requests.length > 0 && <Text style={[s.tabCount, { color: colors.subAlt, backgroundColor: colors.glassBg }, tab === "requests" && {color: colors.purple}]}>{requests.length}</Text>}
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={colors.purple} /></View>
        ) : (
          <FlatList
            data={tab === "friends" ? (friends as any) : (requests as any)}
            keyExtractor={(item: any) => item.id}
            renderItem={(tab === "friends" ? renderFriend : renderRequest) as any}
            style={{ flex: 1 }}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews
            ListEmptyComponent={
              tab === "friends"
                ? <ListEmpty icon={User} text={"No friends yet\nTap + to search for players!"} />
                : <ListEmpty icon={UserPlus} text="No pending requests" />
            }
          />
        )}
      </View>
      <ProfileModal
        data={pfModal}
        onClose={() => setPfModal(prev => ({ ...prev, visible: false }))}
        actionMode="friends"
        onRemoveFriend={async (friendId) => {
          try {
            const res = await fetch(`${base}/friends/remove`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ player_id: playerId, friend_id: friendId }),
            });
            if (res.ok) {
              setFriends(prev => prev.filter(f => f.id !== friendId));
              setPfModal(prev => ({ ...prev, visible: false }));
            }
          } catch {}
        }}
      />

      {/* ─── Search overlay ────────────────────────────────────────────── */}
      <Modal visible={searchVisible} animationType="slide" onRequestClose={closeSearch}>
        <SafeAreaView style={[ss.safe, { backgroundColor: colors.bg }]}>
          <View style={[ss.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={closeSearch} style={[ss.backBtn, { borderColor: colors.border, backgroundColor: colors.glassBg }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ArrowLeft size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={[ss.inputWrap, { borderColor: colors.border, backgroundColor: colors.glassBg }]}>
              <Search size={16} color={colors.sub} />
              <TextInput
                ref={searchInputRef}
                style={[ss.input, { color: colors.text }]}
                placeholder="Search players by name..."
                placeholderTextColor={colors.subAlt}
                value={searchQuery}
                onChangeText={onSearchChange}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="words"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => onSearchChange("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <X size={16} color={colors.sub} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {searchLoading ? (
            <View style={ss.center}><ActivityIndicator size="large" color={colors.purple} /></View>
          ) : searchQuery.trim().length === 0 ? (
            <View style={ss.center}>
              <Search size={48} color={colors.subAlt} />
              <Text style={[ss.emptyTxt, { color: colors.sub }]}>Search for players by name</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={ss.center}>
              <User size={48} color={colors.subAlt} />
              <Text style={[ss.emptyTxt, { color: colors.sub }]}>No players found</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={searchKeyExtractor}
              renderItem={renderSearchResult}
              contentContainerStyle={ss.list}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            />
          )}
        </SafeAreaView>
        <ProfileModal
          data={pfModal}
          onClose={() => setPfModal(prev => ({ ...prev, visible: false }))}
          actionMode="community"
          isFriend={pfModal.authorId ? (searchResults.find(r => r.id === pfModal.authorId)?.isFriend ?? false) : false}
          isSent={pfModal.authorId ? (searchResults.find(r => r.id === pfModal.authorId)?.requestSent ?? false) : false}
          onSendFriendRequest={async (authorId) => {
            const result = await sendFriendRequestApi(playerId, profile.name, profile.pic, authorId);
            if (result.ok) {
              if (result.status === "already_friends") {
                setSearchResults(prev => prev.map(r => r.id === authorId ? { ...r, isFriend: true } : r));
              } else if (result.status !== "already_requested") {
                setSearchResults(prev => prev.map(r => r.id === authorId ? { ...r, requestSent: true } : r));
              }
            }
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 18, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 1 },
  searchBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, minWidth: 24, alignItems: "center" },
  badgeTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },
  tabs: { flexDirection: "row", backgroundColor: "rgba(23, 19, 50, 0.7)", borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  tabActive: { borderBottomWidth: 2.5 },
  tabTxt: { fontSize: 13, fontWeight: "700" },
  tabTxtActive: {},
  tabCount: { fontSize: 11, fontWeight: "800", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, overflow: "hidden" },
  content: { flex: 1, justifyContent: "flex-start" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm, padding: 14, borderWidth: 1 },
  cardName: { fontSize: 14, fontWeight: "700", flex: 1 },
  actions: { flexDirection: "row", gap: 8 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});

const ss = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", borderWidth: 1 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontWeight: "600", paddingVertical: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTxt: { fontSize: 14, textAlign: "center" },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 14,
    borderWidth: 1,
  },
  resultName: { fontSize: 14, fontWeight: "700", flex: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
