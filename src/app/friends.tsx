import { SERVER_URL } from "@/constants/server";
import { useProfile } from "@/contexts/ProfileContext";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SHADOWS, RADIUS } from "@/constants/design-system";
import { ArrowLeft, Check, Users, UserPlus, X } from "lucide-react-native";

function getHttpBase() {
  return SERVER_URL.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://").replace(/\/$/, "");
}

interface FriendItem { id: string; name: string; pic: string | null; }
interface RequestItem { id: string; from: string; fromName: string; fromPic: string | null; createdAt: number; }

export default function FriendsScreen({ onBack }: { onBack?: () => void }) {
  const { playerId } = useProfile();
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
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

  const renderAvatar = (pic: string | null, name: string, size = 36) => pic
    ? <Image source={{ uri: pic }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: COLORS.border }} />
    : <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${COLORS.purple}25`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border }}>
        <Text style={{ color: COLORS.purple, fontSize: size * 0.38, fontWeight: "800" }}>{name.slice(0, 2).toUpperCase()}</Text>
      </View>;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Friends</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === "friends" && s.tabActive]} onPress={() => setTab("friends")} activeOpacity={0.8}>
          <Users size={14} color={tab === "friends" ? COLORS.purple : COLORS.sub} />
          <Text style={[s.tabTxt, tab === "friends" && s.tabTxtActive]}> Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === "requests" && s.tabActive]} onPress={() => setTab("requests")} activeOpacity={0.8}>
          <UserPlus size={14} color={tab === "requests" ? COLORS.purple : COLORS.sub} />
          <Text style={[s.tabTxt, tab === "requests" && s.tabTxtActive]}> Requests{requests.length > 0 ? ` (${requests.length})` : ""}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.purple} /></View>
      ) : tab === "friends" ? (
        friends.length === 0 ? (
          <View style={s.center}><Text style={s.emptyTxt}>No friends yet{'\n'}Send a friend request from someone's profile!</Text></View>
        ) : (
          <View style={s.list}>
            {friends.map(f => (
              <View key={f.id} style={s.card}>
                {renderAvatar(f.pic, f.name, 40)}
                <Text style={s.cardName}>{f.name}</Text>
              </View>
            ))}
          </View>
        )
      ) : (
        requests.length === 0 ? (
          <View style={s.center}><Text style={s.emptyTxt}>No pending requests</Text></View>
        ) : (
          <View style={s.list}>
            {requests.map(r => (
              <View key={r.id} style={s.card}>
                {renderAvatar(r.fromPic, r.fromName, 40)}
                <Text style={s.cardName}>{r.fromName}</Text>
                <View style={s.actions}>
                  <TouchableOpacity
                    style={[s.acceptBtn, accepting === r.id && { opacity: 0.5 }]}
                    onPress={() => handleAccept(r.id)}
                    disabled={accepting === r.id}
                    activeOpacity={0.8}
                  >
                    {accepting === r.id ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#fff" />}
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(r.id)} activeOpacity={0.8}>
                    <X size={16} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  tabs: { flexDirection: "row", backgroundColor: "rgba(23, 19, 50, 0.7)", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.purple },
  tabTxt: { fontSize: 13, fontWeight: "700", color: COLORS.sub },
  tabTxtActive: { color: COLORS.purple },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTxt: { color: COLORS.sub, fontSize: 14, textAlign: "center", lineHeight: 22 },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(23, 19, 50, 0.7)", borderRadius: RADIUS.cardSm, padding: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.subtle },
  cardName: { color: COLORS.text, fontSize: 14, fontWeight: "700", flex: 1 },
  actions: { flexDirection: "row", gap: 8 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.green, alignItems: "center", justifyContent: "center" },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.red}20`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${COLORS.red}40` },
});
