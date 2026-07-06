import { useGame } from "@/contexts/GameContext";
import { getMoodConfig, MOODS } from "@/data/moods";
import { QUESTIONS, QCategory, QTag, Question } from "@/data/questions";
import { useState } from "react";
import {
  FlatList, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";

const TAGS: { key: QTag | "all"; label: string; emoji: string }[] = [
  { key: "all",     label: "All",      emoji: "✨" },
  { key: "fun",     label: "Fun",      emoji: "😂" },
  { key: "life",    label: "Life",     emoji: "💬" },
  { key: "hot",     label: "Hot",      emoji: "🔥" },
  { key: "connect", label: "Connect",  emoji: "🤝" },
  { key: "spicy",   label: "Spicy",    emoji: "🌶" },
  { key: "deep",    label: "Deep",     emoji: "🌊" },
];

interface Props { onUse?: (q: Question) => void; }

export default function QuestionsScreen({ onUse }: Props) {
  const { gameMood } = useGame();
  const moodCfg = getMoodConfig(gameMood);
  const [typeFilter, setTypeFilter] = useState<QCategory | "all">("all");
  const [tagFilter,  setTagFilter]  = useState<QTag | "all">("all");
  const [picked, setPicked] = useState<Question | null>(null);

  const filtered = QUESTIONS.filter(q =>
    (typeFilter === "all" || q.type === typeFilter) &&
    (tagFilter  === "all" || q.tags.includes(tagFilter as QTag))
  );

  const renderItem = ({ item }: { item: Question }) => {
    const isTruth = item.type === "truth";
    const isSelected = picked?.id === item.id;
    return (
      <TouchableOpacity
        style={[s.qCard, isSelected && s.qCardSelected, isTruth ? s.qCardTruth : s.qCardDare]}
        onPress={() => setPicked(isSelected ? null : item)}
        activeOpacity={0.8}
      >
        <View style={s.qTop}>
          <View style={[s.typeBadge, isTruth ? s.typeBadgeTruth : s.typeBadgeDare]}>
            <Text style={[s.typeBadgeText, { color: isTruth ? moodCfg.color : "#c2410c" }]}>
              {isTruth ? "👁 TRUTH" : "🔥 DARE"}
            </Text>
          </View>
          <View style={s.tagRow}>
            {item.tags.slice(0, 2).map(t => (
              <Text key={t} style={s.tagPill}>{TAGS.find(x => x.key === t)?.emoji ?? t}</Text>
            ))}
          </View>
        </View>
        <Text style={s.qText}>{item.text}</Text>
        {isSelected && onUse && (
          <TouchableOpacity style={s.useBtn} onPress={() => { onUse(item); }} activeOpacity={0.85}>
            <Text style={s.useBtnText}>Use in Game →</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Question Bank</Text>
          <Text style={s.subtitle}>70 viral truth & dare questions</Text>
        </View>
        <View style={[s.moodBadge, { backgroundColor: `${moodCfg.color}20`, borderColor: `${moodCfg.color}40` }]}>
          <Text style={s.moodBadgeEmoji}>{moodCfg.emoji}</Text>
          <Text style={[s.moodBadgeLabel, { color: moodCfg.color }]}>{moodCfg.label}</Text>
        </View>
      </View>

      <View style={s.typeRow}>
        {(["all", "truth", "dare"] as const).map(t => (
          <TouchableOpacity key={t} style={[s.typeBtn, typeFilter === t && { backgroundColor: COLORS.purple, borderColor: COLORS.purple }]} onPress={() => setTypeFilter(t)} activeOpacity={0.8}>
            <Text style={[s.typeBtnText, typeFilter === t && { color: "#fff" }]}>
              {t === "all" ? "All" : t === "truth" ? "👁 Truth" : "🔥 Dare"}
            </Text>
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
              <Text style={[s.tagChipText, tagFilter === item.key && { color: COLORS.text }]}>{item.emoji} {item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <Text style={s.countText}>{filtered.length} questions</Text>

      <FlatList
        data={filtered} keyExtractor={i => String(i.id)} renderItem={renderItem}
        contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  moodBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: RADIUS.small, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  moodBadgeEmoji: { fontSize: 14 },
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
