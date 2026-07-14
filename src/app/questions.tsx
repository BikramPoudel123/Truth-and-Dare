import { useGame } from "@/contexts/GameContext";
import { getMoodConfig } from "@/data/moods";
import { QCategory, QTag, Question } from "@/data/questions";
import { useQuestions } from "@/stores/questionBankStore";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Eye, Flame, Sparkles, SmilePlus, MessageCircle, Handshake, Waves, Balloon, Heart, Skull } from "lucide-react-native";
import {
  Animated,
  FlatList, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";

const iconMap: Record<string, any> = { Sparkles, SmilePlus, MessageCircle, Flame, Handshake, Waves, Balloon, Heart, Skull };

const TAGS: { key: QTag | "all"; label: string; emoji: string; icon: string }[] = [
  { key: "all",     label: "All",      emoji: "✨", icon: "Sparkles" },
  { key: "fun",     label: "Fun",      emoji: "😂", icon: "SmilePlus" },
  { key: "life",    label: "Life",     emoji: "💬", icon: "MessageCircle" },
  { key: "hot",     label: "Hot",      emoji: "🔥", icon: "Flame" },
  { key: "connect", label: "Connect",  emoji: "🤝", icon: "Handshake" },
  { key: "spicy",   label: "Spicy",    emoji: "🌶", icon: "Flame" },
  { key: "deep",    label: "Deep",     emoji: "🌊", icon: "Waves" },
];

interface Props { onUse?: (q: Question) => void; }

const QuestionCard = memo(function QuestionCard({ item, picked, onUse, onPress }: { item: Question; picked: Question | null; onUse?: (q: Question) => void; onPress: () => void }) {
  const isTruth = item.type === "truth";
  const isSelected = picked?.id === item.id;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 80 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
    <TouchableOpacity
      style={[s.qCard, isSelected && s.qCardSelected, isTruth ? s.qCardTruth : s.qCardDare]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={s.qTop}>
        <View style={[s.typeBadge, isTruth ? s.typeBadgeTruth : s.typeBadgeDare]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            {isTruth ? <Eye size={12} color={COLORS.purple} /> : <Flame size={12} color="#c2410c" />}
            <Text style={[s.typeBadgeText, { color: isTruth ? COLORS.purple : "#c2410c" }]}>
              {isTruth ? "TRUTH" : "DARE"}
            </Text>
          </View>
        </View>
        <View style={s.tagRow}>
          {item.tags.slice(0, 2).map(t => {
            const tag = TAGS.find(x => x.key === t);
            const IconComp = tag ? iconMap[tag.icon] : null;
            return IconComp ? <IconComp key={t} size={16} color={COLORS.sub} /> : <Text key={t} style={s.tagPill}>{t}</Text>;
          })}
        </View>
      </View>
      <Text style={s.qText}>{item.text}</Text>
      {isSelected && onUse && (
        <TouchableOpacity style={s.useBtn} onPress={() => { onUse(item); }} activeOpacity={0.85}>
          <Text style={s.useBtnText}>Use in Game →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
    </Animated.View>
  );
});

function MoodBadge() {
  const { gameMood } = useGame();
  const moodCfg = getMoodConfig(gameMood);
  const IconComp = iconMap[moodCfg.icon];
  return (
    <View style={[s.moodBadge, { backgroundColor: `${moodCfg.color}20`, borderColor: `${moodCfg.color}40` }]}>
      <IconComp size={14} color={moodCfg.color} />
      <Text style={[s.moodBadgeLabel, { color: moodCfg.color }]}>{moodCfg.label}</Text>
    </View>
  );
}

export default function QuestionsScreen({ onUse }: Props) {
  const [typeFilter, setTypeFilter] = useState<QCategory | "all">("all");
  const [tagFilter,  setTagFilter]  = useState<QTag | "all">("all");
  const [picked, setPicked] = useState<Question | null>(null);

  const filtered = useQuestions(typeFilter, tagFilter);

  const handlePick = useCallback((item: Question) => {
    setPicked(prev => prev?.id === item.id ? null : item);
  }, []);

  const renderItem = useCallback(({ item }: { item: Question }) => (
    <QuestionCard item={item} picked={picked} onUse={onUse} onPress={() => handlePick(item)} />
  ), [picked, onUse, handlePick]);

  const keyExtractor = useCallback((i: Question) => String(i.id), []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Question Bank</Text>
          <Text style={s.subtitle}>Truth & dare questions</Text>
        </View>
        <MoodBadge />
      </View>

      <View style={s.typeRow}>
        {(["all", "truth", "dare"] as const).map(t => (
          <TouchableOpacity key={t} style={[s.typeBtn, typeFilter === t && { backgroundColor: COLORS.purple, borderColor: COLORS.purple }]} onPress={() => setTypeFilter(t)} activeOpacity={0.8}>
            {t === "all" ? (
              <Text style={[s.typeBtnText, typeFilter === t && { color: "#fff" }]}>All</Text>
            ) : (
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                {t === "truth" ? <Eye size={14} color={typeFilter === t ? "#fff" : COLORS.sub} /> : <Flame size={14} color={typeFilter === t ? "#fff" : COLORS.sub} />}
                <Text style={[s.typeBtnText, typeFilter === t && { color: "#fff" }]}>{t === "truth" ? "Truth" : "Dare"}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.tagScrollWrap}>
        <FlatList
          horizontal data={TAGS} keyExtractor={i => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.tagChip, tagFilter === item.key && { backgroundColor: `${COLORS.purple}20`, borderColor: COLORS.purple }]} onPress={() => setTagFilter(item.key as QTag | "all")} activeOpacity={0.8}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                {(() => { const IconComp = iconMap[item.icon]; return <IconComp size={14} color={tagFilter === item.key ? COLORS.text : COLORS.sub} />; })()}
                <Text style={[s.tagChipText, tagFilter === item.key && { color: COLORS.text }]}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <Text style={s.countText}>{filtered.length} questions</Text>

      <FlatList
        data={filtered} keyExtractor={keyExtractor} renderItem={renderItem}
        contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  moodBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: RADIUS.small, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  moodBadgeLabel: { fontSize: 11, fontWeight: "800" },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  subtitle: { color: COLORS.sub, fontSize: 12, marginTop: 1 },
  typeRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.small, alignItems: "center", backgroundColor: "rgba(23, 19, 50, 0.6)", borderWidth: 1, borderColor: COLORS.border },
  typeBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.sub },
  tagScrollWrap: { height: 52, justifyContent: "center" },
  tagChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(23, 19, 50, 0.6)", borderWidth: 1, borderColor: COLORS.border },
  tagChipText: { fontSize: 12, fontWeight: "700", color: COLORS.sub },
  countText: { color: COLORS.subAlt, fontSize: 11, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 6 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  qCard: { backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.subtle },
  qCardSelected: { borderColor: COLORS.purple, ...SHADOWS.glow },
  qCardTruth: { borderLeftWidth: 4, borderLeftColor: COLORS.purple },
  qCardDare:  { borderLeftWidth: 4, borderLeftColor: COLORS.orange },
  qTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeTruth: { backgroundColor: `${COLORS.purple}20`, borderWidth: 1, borderColor: `${COLORS.purple}40` },
  typeBadgeDare:  { backgroundColor: `${COLORS.orange}20`, borderWidth: 1, borderColor: `${COLORS.orange}40` },
  typeBadgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  tagRow: { flexDirection: "row", gap: 4 },
  tagPill: { fontSize: 16 },
  qText: { color: COLORS.text, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  useBtn: { marginTop: 12, backgroundColor: COLORS.purple, borderRadius: RADIUS.small, paddingVertical: 10, alignItems: "center" },
  useBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
