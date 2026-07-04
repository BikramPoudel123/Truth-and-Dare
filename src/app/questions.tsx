import { QUESTIONS, QCategory, QTag, Question } from "@/data/questions";
import { useState } from "react";
import {
  FlatList, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#f8faff", CARD = "#ffffff", BLUE = "#3b82f6";
const BLUE_D = "#1d4ed8", BLUE_L = "#eff6ff", BLUE_M = "#bfdbfe";
const TEXT = "#0f172a", SUB = "#64748b", HINT = "#94a3b8", BORDER = "#e2e8f0";

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
            <Text style={[s.typeBadgeText, { color: isTruth ? BLUE_D : "#c2410c" }]}>
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
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Question Bank</Text>
          <Text style={s.subtitle}>70 viral truth & dare questions</Text>
        </View>
      </View>

      {/* Type filter */}
      <View style={s.typeRow}>
        {(["all", "truth", "dare"] as const).map(t => (
          <TouchableOpacity key={t} style={[s.typeBtn, typeFilter === t && s.typeBtnActive]} onPress={() => setTypeFilter(t)} activeOpacity={0.8}>
            <Text style={[s.typeBtnText, typeFilter === t && s.typeBtnTextActive]}>
              {t === "all" ? "All" : t === "truth" ? "👁 Truth" : "🔥 Dare"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tag filter — fixed height, never shrinks */}
      <View style={s.tagScrollWrap}>
        <FlatList
          horizontal data={TAGS} keyExtractor={i => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.tagChip, tagFilter === item.key && s.tagChipActive]} onPress={() => setTagFilter(item.key as QTag | "all")} activeOpacity={0.8}>
              <Text style={s.tagChipText}>{item.emoji} {item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <Text style={s.countText}>{filtered.length} questions</Text>

      {/* List fills remaining space */}
      <FlatList
        data={filtered} keyExtractor={i => String(i.id)} renderItem={renderItem}
        contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 12 },
  title: { color: TEXT, fontSize: 18, fontWeight: "900" },
  subtitle: { color: SUB, fontSize: 12, marginTop: 1 },
  typeRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  typeBtnActive: { backgroundColor: BLUE, borderColor: BLUE },
  typeBtnText: { fontSize: 13, fontWeight: "700", color: SUB },
  typeBtnTextActive: { color: "#fff" },
  tagScrollWrap: { height: 52, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, justifyContent: "center" },
  tagChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  tagChipActive: { backgroundColor: BLUE_L, borderColor: BLUE_M },
  tagChipText: { fontSize: 12, fontWeight: "700", color: TEXT },
  countText: { color: HINT, fontSize: 11, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 6 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  qCard: { backgroundColor: CARD, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: BORDER },
  qCardSelected: { borderColor: BLUE, shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  qCardTruth: { borderLeftWidth: 4, borderLeftColor: BLUE },
  qCardDare:  { borderLeftWidth: 4, borderLeftColor: "#f97316" },
  qTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeTruth: { backgroundColor: BLUE_L, borderWidth: 1, borderColor: BLUE_M },
  typeBadgeDare:  { backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa" },
  typeBadgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  tagRow: { flexDirection: "row", gap: 4 },
  tagPill: { fontSize: 16 },
  qText: { color: TEXT, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  useBtn: { marginTop: 12, backgroundColor: BLUE, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  useBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
