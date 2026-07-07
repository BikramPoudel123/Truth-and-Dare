/**
 * QuestionPicker — modal shown to the asker during question_set phase.
 * They can browse the local question bank OR community posts and tap one to fill the input.
 */
import { QUESTIONS, QCategory, QTag, Question } from "@/data/questions";
import { SERVER_URL } from "@/constants/server";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Modal, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { Eye, Flame, Sparkles, Megaphone, X, Heart } from "lucide-react-native";

const BLUE = "#3b82f6", BLUE_D = "#1d4ed8", BLUE_L = "#eff6ff", BLUE_M = "#bfdbfe";
const TEXT = "#0f172a", SUB = "#64748b", HINT = "#94a3b8", BORDER = "#e2e8f0";
const CARD = "#ffffff", BG = "#f8faff";

function getHttpBase() {
  return SERVER_URL.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://").replace(/\/$/, "");
}

interface CommunityPost { id: string; author: string; type: string; text: string; likes: number; }

interface Props {
  visible: boolean;
  mode: "truth" | "dare" | null;
  moodTags?: string[];
  onSelect: (text: string) => void;
  onClose: () => void;
}

export function QuestionPicker({ visible, mode, moodTags, onSelect, onClose }: Props) {
  const [tab, setTab] = useState<"bank" | "community">("bank");
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Pick a Question</Text>
            <Text style={s.subtitle}>{mode ? (mode === "truth" ? <><Eye size={14} color={BLUE} /> Truth questions</> : <><Flame size={14} color="#f97316" /> Dare challenges</>) : "All"}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={16} color={SUB} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab === "bank" && s.tabActive]} onPress={() => setTab("bank")} activeOpacity={0.8}>
            <Text style={[s.tabText, tab === "bank" && s.tabTextActive]}><Sparkles size={16} color={tab === "bank" ? BLUE_D : HINT} /> Question Bank</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === "community" && s.tabActive]} onPress={() => setTab("community")} activeOpacity={0.8}>
            <Text style={[s.tabText, tab === "community" && s.tabTextActive]}><Megaphone size={16} color={tab === "community" ? BLUE_D : HINT} /> Community</Text>
          </TouchableOpacity>
        </View>

        {/* Bank list */}
        {tab === "bank" && (
          <FlatList
            data={bankQuestions}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={[s.qCard, item.type === "truth" ? s.qTruth : s.qDare]} onPress={() => pick(item.text)} activeOpacity={0.8}>
                <View style={[s.typeDot, { backgroundColor: item.type === "truth" ? BLUE : "#f97316" }]} />
                <Text style={s.qText}>{item.text}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Community list */}
        {tab === "community" && (
          loadingCommunity ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={BLUE} size="large" />
            </View>
          ) : (
            <FlatList
              data={communityFiltered}
              keyExtractor={i => i.id}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={s.empty}>No community posts yet for this type.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={[s.qCard, item.type === "truth" ? s.qTruth : s.qDare]} onPress={() => pick(item.text)} activeOpacity={0.8}>
                  <View style={s.communityTop}>
                    <View style={[s.typeDot, { backgroundColor: item.type === "truth" ? BLUE : "#f97316" }]} />
                    <Text style={s.communityAuthor}>@{item.author}</Text>
                    <Text style={s.communityLikes}><Heart size={14} color={HINT} /> {item.likes}</Text>
                  </View>
                  <Text style={s.qText}>{item.text}</Text>
                </TouchableOpacity>
              )}
            />
          )
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { color: TEXT, fontSize: 18, fontWeight: "900" },
  subtitle: { color: SUB, fontSize: 12, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: BG, alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: BLUE },
  tabText: { fontSize: 13, fontWeight: "700", color: HINT },
  tabTextActive: { color: BLUE_D },
  list: { padding: 16, gap: 10 },
  qCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: BORDER, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  qTruth: { borderLeftWidth: 4, borderLeftColor: BLUE },
  qDare:  { borderLeftWidth: 4, borderLeftColor: "#f97316" },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  qText: { color: TEXT, fontSize: 14, fontWeight: "600", lineHeight: 21, flex: 1 },
  communityTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  communityAuthor: { color: BLUE_D, fontSize: 11, fontWeight: "700" },
  communityLikes: { color: HINT, fontSize: 11, marginLeft: "auto" as any },
  empty: { color: HINT, textAlign: "center", marginTop: 40, fontSize: 14 },
});
