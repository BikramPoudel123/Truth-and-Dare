import { memo, useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
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
import { Avatar } from "@/components/Avatar";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { useProfile } from "@/contexts/ProfileContext";
import { fetchProfileCached, getHttpBase } from "@/utils/http";
import {
  CalendarDays,
  Crown,
  Flame,
  Heart,
  PartyPopper,
  Skull,
  SmilePlus,
  Star,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Zap,
} from "lucide-react-native";

const INTEREST_LABEL: Record<string, string> = {
  fun: "fun",
  life: "life",
  hot: "hot",
  connect: "connect",
  spicy: "spicy",
  deep: "deep",
};

const ICON_MAP: Record<string, [React.ComponentType<{ size: number; color: string }>, string]> = {
  "Rising Star":       [Star, COLORS.gold],
  "Hot Player":        [Flame, COLORS.orange],
  "Funny Player":      [SmilePlus, "#facc15"],
  "Heartthrob":        [Heart, COLORS.pink],
  "Shocking Player":   [Zap, COLORS.electricBlue],
  "Savage Player":     [Skull, "#a855f7"],
  "Emotional Player":  [Heart, "#60a5fa"],
  "Life of the Party": [PartyPopper, "#f97316"],
  "Respected Player":  [Crown, COLORS.gold],
};

export interface ProfileModalData {
  visible: boolean;
  authorId: string | null;
  name: string;
  bio: string;
  pic: string | null;
  interests: string[];
  playStyle: string | null;
  reactions: Record<string, number>;
  gamesPlayed: number;
  level: number;
  playedSince: string;
  loading: boolean;
}

export const DEFAULT_MODAL_DATA: ProfileModalData = {
  visible: false,
  authorId: null,
  name: "",
  bio: "",
  pic: null,
  interests: [],
  playStyle: null,
  reactions: {},
  gamesPlayed: 0,
  level: 1,
  playedSince: "",
  loading: false,
};

interface ProfileModalProps {
  data: ProfileModalData;
  onClose: () => void;
  /** Called when the user taps on the profile — parent can update state */
  onSendFriendRequest?: (authorId: string) => Promise<void>;
  onRemoveFriend?: (authorId: string) => Promise<void>;
  /** "friends" shows remove button, anything else shows add/request */
  actionMode?: "friends" | "community";
  /** Externally managed friend state (for community screen) */
  isFriend?: boolean;
  isSent?: boolean;
}

function ProfileModalInner({
  data,
  onClose,
  onSendFriendRequest,
  onRemoveFriend,
  actionMode = "community",
  isFriend = false,
  isSent = false,
}: ProfileModalProps) {
  const { playerId } = useProfile();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const rCardW = useMemo(() => Math.min(screenW * 0.92, 480), [screenW]);
  const rCardMaxH = useMemo(() => Math.min(screenH * 0.85, 600), [screenH]);
  const rHozPad = useMemo(() => Math.max(16, Math.min(24, screenW * 0.065)), [screenW]);
  const rBotPad = useMemo(() => Math.max(16, insets.bottom + 12), [insets.bottom]);
  const rTopRad = screenW < 380 ? 20 : 24;
  const rGrabMarg = useMemo(() => Math.max(12, Math.min(20, screenW * 0.05)), [screenW]);

  const pfScrollY = useRef(0);
  const pfPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10 && gs.vy > 0 && pfScrollY.current <= 1,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100) onClose();
      },
    }),
  ).current;

  const totalReactions = useMemo(() => {
    if (!data.reactions || Object.keys(data.reactions).length === 0) return 0;
    return Object.values(data.reactions).reduce((a, b) => a + b, 0);
  }, [data.reactions]);

  const levelProgress = useMemo(() => {
    if (!data.gamesPlayed) return 0;
    return (data.gamesPlayed % 10) * 10;
  }, [data.gamesPlayed]);

  const playedSinceFormatted = useMemo(() => {
    if (!data.playedSince) return "-";
    return new Date(data.playedSince).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }, [data.playedSince]);

  const handleFriendPress = useCallback(async () => {
    if (actionMode === "friends" && onRemoveFriend && data.authorId) {
      await onRemoveFriend(data.authorId);
    } else if (onSendFriendRequest && data.authorId) {
      await onSendFriendRequest(data.authorId);
    }
  }, [actionMode, onRemoveFriend, onSendFriendRequest, data.authorId]);

  const showFriendAction =
    !data.loading &&
    data.authorId &&
    data.authorId !== playerId;

  const friendActionIcon = useMemo(() => {
    if (actionMode === "friends") return { icon: UserMinus, color: COLORS.red };
    if (isFriend) return { icon: Users, color: COLORS.green };
    if (isSent) return { icon: UserCheck, color: COLORS.blue };
    return { icon: UserPlus, color: COLORS.purple };
  }, [actionMode, isFriend, isSent]);

  return (
    <Modal
      visible={data.visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <View
          style={[
            s.card,
            {
              maxWidth: rCardW,
              maxHeight: rCardMaxH,
              paddingHorizontal: rHozPad,
              paddingBottom: rBotPad,
              borderTopLeftRadius: rTopRad,
              borderTopRightRadius: rTopRad,
            },
          ]}
          {...pfPanResponder.panHandlers}
        >
          <View style={[s.grabber, { marginBottom: rGrabMarg }]} />

          {data.loading ? (
            <ActivityIndicator size="large" color={COLORS.purple} />
          ) : (
            <>
              <ScrollView
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                style={s.stretch}
                bounces
                onScroll={(e) => {
                  pfScrollY.current = e.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
              >
                <Avatar uri={data.pic} name={data.name} size={72} borderWidth={2} borderColor={COLORS.purple} />
                <Text style={s.name}>{data.name}</Text>

                {data.playStyle && (
                  <View style={s.playStyleBadge}>
                    {(() => {
                      const pair = ICON_MAP[data.playStyle] ?? [Star, COLORS.sub];
                      const Icon = pair[0];
                      return (
                        <>
                          <Icon size={13} color={pair[1]} />
                          <Text style={s.playStyleText}>{data.playStyle}</Text>
                        </>
                      );
                    })()}
                  </View>
                )}

                <View style={s.statsCard}>
                  <View style={s.statCol}>
                    <Crown size={18} color={COLORS.gold} />
                    <Text style={s.statNum}>{data.level}</Text>
                    <View style={s.levelBarOuter}>
                      <View style={[s.levelBarInner, { width: `${levelProgress}%` }]} />
                    </View>
                    <Text style={s.statLabel} numberOfLines={1}>Level</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statCol}>
                    <SmilePlus size={18} color={COLORS.sub} />
                    <Text style={s.statNum}>{totalReactions}</Text>
                    <Text style={s.statLabel} numberOfLines={1}>Reactions</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statCol}>
                    <CalendarDays size={18} color={COLORS.sub} />
                    <Text style={s.statDate} numberOfLines={1}>{playedSinceFormatted}</Text>
                    <Text style={s.statLabel} numberOfLines={1}>Played Since</Text>
                  </View>
                </View>

                {totalReactions > 0 && (
                  <View style={s.reactionsWrap}>
                    {Object.entries(data.reactions).map(([emoji, count]) => (
                      <View key={emoji} style={s.reactionTag}>
                        <Text style={s.reactionEmoji}>{emoji}</Text>
                        <Text style={s.reactionCount}>{count}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {data.bio ? <Text style={s.bio}>{data.bio}</Text> : null}

                {data.interests.length > 0 && (
                  <>
                    <Text style={s.interestsLabel}>Interests</Text>
                    <View style={s.interestsWrap}>
                      {data.interests.map((i) => (
                        <View key={i} style={s.interestTag}>
                          <Text style={s.interestTxt}>{INTEREST_LABEL[i] ?? i}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>

              {showFriendAction && (
                <View style={s.friendIconWrap}>
                  {actionMode === "friends" ? (
                    <TouchableOpacity style={s.friendIcon} onPress={handleFriendPress} activeOpacity={0.7}>
                      {(() => {
                        const { icon: Icon, color } = friendActionIcon;
                        return <Icon size={18} color={color} />;
                      })()}
                    </TouchableOpacity>
                  ) : isFriend || isSent ? (
                    <View style={s.friendIcon}>
                      {(() => {
                        const { icon: Icon, color } = friendActionIcon;
                        return <Icon size={18} color={color} />;
                      })()}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={s.friendIcon}
                      onPress={handleFriendPress}
                      activeOpacity={0.7}
                    >
                      <UserPlus size={18} color={COLORS.purple} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

export const ProfileModal = memo(ProfileModalInner);

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.bg,
    paddingTop: 4,
    alignItems: "center",
    alignSelf: "center",
    ...SHADOWS.glow,
  },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center" },
  scrollContent: { alignItems: "center", gap: 16 },
  stretch: { alignSelf: "stretch" },
  name: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  bio: { color: COLORS.sub, fontSize: 13, textAlign: "center", lineHeight: 18 },

  playStyleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playStyleText: { color: COLORS.text, fontSize: 11, fontWeight: "700" },

  statsCard: {
    flexDirection: "row",
    backgroundColor: "rgba(23, 19, 50, 0.7)",
    borderRadius: RADIUS.cardSm,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "100%",
  },
  statCol: { flex: 1, alignItems: "center", gap: 4 },
  statNum: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  statLabel: { color: COLORS.sub, fontSize: 10, fontWeight: "600" },
  statDate: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  levelBarOuter: { width: "100%", height: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginTop: 2 },
  levelBarInner: { height: "100%", backgroundColor: COLORS.gold, borderRadius: 2 },

  reactionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  reactionTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { color: COLORS.sub, fontSize: 11, fontWeight: "700" },

  interestsLabel: { color: COLORS.sub, fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  interestsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  interestTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: `${COLORS.purple}15`,
    borderWidth: 1,
    borderColor: `${COLORS.purple}30`,
  },
  interestTxt: { color: COLORS.purple, fontSize: 11, fontWeight: "700" },

  friendIconWrap: { position: "absolute", top: 4, right: 8, zIndex: 10 },
  friendIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});
