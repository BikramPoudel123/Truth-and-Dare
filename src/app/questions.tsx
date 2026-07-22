import { QCategory, QTag, Question } from "@/data/questions";
import { useQuestions } from "@/stores/questionBankStore";
import { useTheme } from "@/contexts/ThemeContext";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Eye, Flame, Sparkles, SmilePlus, MessageCircle, Handshake, Waves, Balloon, Heart, Skull } from "lucide-react-native";
import {
  Animated,
  FlatList, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS } from "@/constants/design-system";

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

const QuestionCard = memo(function QuestionCard({ item }: { item: Question }) {
  const { colors } = useTheme();
  const isTruth = item.type === "truth";
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
      style={[s.qCard, { backgroundColor: colors.surface, borderColor: colors.border }, isTruth ? s.qCardTruth : s.qCardDare]}
      activeOpacity={0.8}
    >
      <View style={s.qTop}>
        <View style={[s.typeBadge, isTruth ? s.typeBadgeTruth : s.typeBadgeDare, isTruth ? { backgroundColor: `${colors.purple}20`, borderColor: `${colors.purple}40` } : { backgroundColor: `${colors.red}20`, borderColor: `${colors.red}40` }]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            {isTruth ? <Eye size={12} color={colors.purple} /> : <Flame size={12} color={colors.red} />}
            <Text style={[s.typeBadgeText, { color: isTruth ? colors.purple : colors.red }]}>
              {isTruth ? "TRUTH" : "DARE"}
            </Text>
          </View>
        </View>
        <View style={s.tagRow}>
          {item.tags.slice(0, 2).map(t => {
            const tag = TAGS.find(x => x.key === t);
            const IconComp = tag ? iconMap[tag.icon] : null;
            return IconComp ? <IconComp key={t} size={16} color={colors.sub} /> : <Text key={t} style={s.tagPill}>{t}</Text>;
          })}
        </View>
      </View>
      <Text style={[s.qText, { color: colors.text }]}>{item.text}</Text>
    </TouchableOpacity>
    </Animated.View>
  );
});

export default function QuestionsScreen({ onUse }: Props) {
  const { colors } = useTheme();
  const [typeFilter, setTypeFilter] = useState<QCategory>("truth");
  const [tagFilter,  setTagFilter]  = useState<QTag | "all">("all");

  const filtered = useQuestions(typeFilter, tagFilter);

  const renderItem = useCallback(({ item }: { item: Question }) => (
    <QuestionCard item={item} />
  ), []);

  const keyExtractor = useCallback((i: Question) => String(i.id), []);

  return (
    <SafeAreaView edges={["top"]} style={[s.safe, { backgroundColor: colors.bg }]}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.text }]}>Question Bank</Text>
          <Text style={[s.subtitle, { color: colors.sub }]}>You can use these questions while playing the game</Text>
        </View>
      </View>

      <View style={s.typeRow}>
        {(["truth", "dare"] as const).map(t => (
          <TouchableOpacity key={t} style={[s.typeBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }, typeFilter === t && { backgroundColor: t === "truth" ? colors.purple : colors.red, borderColor: t === "truth" ? colors.purple : colors.red }]} onPress={() => setTypeFilter(t)} activeOpacity={0.8}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              {t === "truth" ? <Eye size={14} color={typeFilter === t ? "#fff" : colors.sub} /> : <Flame size={14} color={typeFilter === t ? "#fff" : colors.sub} />}
              <Text style={[s.typeBtnText, { color: colors.sub }, typeFilter === t && { color: "#fff" }]}>{t === "truth" ? "Truth" : "Dare"}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.tagScrollWrap}>
        <FlatList
          horizontal data={TAGS} keyExtractor={i => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.tagChip, { backgroundColor: colors.surfaceLight, borderColor: colors.border }, tagFilter === item.key && { backgroundColor: `${colors.purple}20`, borderColor: colors.purple }]} onPress={() => setTagFilter(item.key as QTag | "all")} activeOpacity={0.8}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                {(() => { const IconComp = iconMap[item.icon]; return <IconComp size={14} color={tagFilter === item.key ? colors.text : colors.sub} />; })()}
                <Text style={[s.tagChipText, { color: colors.sub }, tagFilter === item.key && { color: colors.text }]}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <Text style={[s.countText, { color: colors.subAlt }]}>{filtered.length} questions</Text>

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
  safe: { flex: 1, backgroundColor: "#0b081c" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  moodBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: RADIUS.small, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  moodBadgeLabel: { fontSize: 11, fontWeight: "800" },
  title: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  subtitle: { color: "#a19bb3", fontSize: 12, marginTop: 1 },
  typeRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.small, alignItems: "center", backgroundColor: "rgba(23, 19, 50, 0.6)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  typeBtnText: { fontSize: 13, fontWeight: "700", color: "#a19bb3" },
  tagScrollWrap: { height: 52, justifyContent: "center" },
  tagChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(23, 19, 50, 0.6)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  tagChipText: { fontSize: 12, fontWeight: "700", color: "#a19bb3" },
  countText: { color: "#7c7890", fontSize: 11, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 6 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  qCard: { backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm, padding: 16, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  qCardTruth: { borderLeftWidth: 4, borderLeftColor: "#3b82f6" },
  qCardDare:  { borderLeftWidth: 4, borderLeftColor: "#dc2626" },
  qTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeTruth: { backgroundColor: "#3b82f620", borderWidth: 1, borderColor: "#3b82f640" },
  typeBadgeDare:  { backgroundColor: "#dc262620", borderWidth: 1, borderColor: "#dc262640" },
  typeBadgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  tagRow: { flexDirection: "row", gap: 4 },
  tagPill: { fontSize: 16 },
  qText: { color: "#ffffff", fontSize: 15, fontWeight: "600", lineHeight: 22 },
});
