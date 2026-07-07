import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { SERVER_URL } from "@/constants/server";

function getHttpBase() {
  return SERVER_URL.replace(/^ws:\/\//, "http://")
    .replace(/^wss:\/\//, "https://")
    .replace(/\/$/, "");
}

export type Interest = "fun" | "life" | "hot" | "connect" | "spicy" | "deep";

export interface ProfileStats {
  gamesPlayed: number;
  wins: number;
  level: number;
}

export interface Profile {
  name: string;
  bio: string;
  pic: string | null;
  interests: Interest[];
  stats: ProfileStats;
}

export interface ProfileContextType {
  profile: Profile;
  isProfileReady: boolean;
  setName: (v: string) => void;
  setBio: (v: string) => void;
  setPic: (v: string | null) => void;
  toggleInterest: (i: Interest) => void;
  clearProfile: () => void;
  recordGameResult: (won: boolean) => void;
  winRate: number;
  playerId: string;
}

const DEFAULT_STATS: ProfileStats = { gamesPlayed: 0, wins: 0, level: 1 };

const DEFAULT: Profile = {
  name: "",
  bio: "",
  pic: null,
  interests: [],
  stats: DEFAULT_STATS,
};

// A player levels up every 10 games played
const GAMES_PER_LEVEL = 10;

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const playerIdRef = useRef(
    `pid-${Math.random().toString(36).slice(2)}-${Date.now()}`,
  );

  // Load from storage on mount
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.multiGet([
      "prof:name",
      "prof:bio",
      "prof:pic",
      "prof:interests",
      "prof:stats",
      "prof:player_id",
    ]).then(async (pairs) => {
      const map: Record<string, string | null> = {};
      pairs.forEach(([k, v]) => (map[k] = v));
      if (map["prof:player_id"]) playerIdRef.current = map["prof:player_id"];
      else AsyncStorage.setItem("prof:player_id", playerIdRef.current);
      setProfile({
        name: map["prof:name"] ?? "",
        bio: map["prof:bio"] ?? "",
        pic: map["prof:pic"] ?? null,
        interests: map["prof:interests"]
          ? (JSON.parse(map["prof:interests"]) as Interest[])
          : [],
        stats: map["prof:stats"]
          ? (JSON.parse(map["prof:stats"]) as ProfileStats)
          : DEFAULT_STATS,
      });
      if (!cancelled) setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      const pairs: [string, string][] = [];
      if (patch.name !== undefined) pairs.push(["prof:name", patch.name]);
      if (patch.bio !== undefined) pairs.push(["prof:bio", patch.bio]);
      if (patch.pic !== undefined) pairs.push(["prof:pic", patch.pic ?? ""]);
      if (patch.interests !== undefined)
        pairs.push(["prof:interests", JSON.stringify(patch.interests)]);
      if (patch.stats !== undefined)
        pairs.push(["prof:stats", JSON.stringify(patch.stats)]);
      if (pairs.length) AsyncStorage.multiSet(pairs);
      return next;
    });
  }, []);

  const setName = useCallback((v: string) => persist({ name: v }), [persist]);
  const setBio = useCallback((v: string) => persist({ bio: v }), [persist]);
  const setPic = useCallback(
    (v: string | null) => persist({ pic: v }),
    [persist],
  );

  const toggleInterest = useCallback((i: Interest) => {
    setProfile((prev) => {
      const has = prev.interests.includes(i);
      const next = has
        ? prev.interests.filter((x) => x !== i)
        : [...prev.interests, i];
      AsyncStorage.setItem("prof:interests", JSON.stringify(next));
      return { ...prev, interests: next };
    });
  }, []);

  // Call this whenever a match finishes to keep stats (and level) up to date
  const recordGameResult = useCallback((won: boolean) => {
    setProfile((prev) => {
      const gamesPlayed = prev.stats.gamesPlayed + 1;
      const wins = prev.stats.wins + (won ? 1 : 0);
      const level = Math.max(1, Math.floor(gamesPlayed / GAMES_PER_LEVEL) + 1);
      const stats = { gamesPlayed, wins, level };
      AsyncStorage.setItem("prof:stats", JSON.stringify(stats));
      return { ...prev, stats };
    });
  }, []);

  const clearProfile = useCallback(() => {
    setProfile({ ...DEFAULT });
    AsyncStorage.multiRemove([
      "prof:name",
      "prof:bio",
      "prof:pic",
      "prof:interests",
      "prof:stats",
    ]);
  }, []);

  // Debounced effect to sync profile name changes to the server
  useEffect(() => {
    if (!loaded || !profile.name.trim()) return;
    const delayDebounce = setTimeout(() => {
      fetch(`${getHttpBase()}/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: playerIdRef.current,
          name: profile.name.trim(),
        }),
      }).catch((err) =>
        console.warn("Failed to sync profile name to server:", err),
      );
    }, 1000);
    return () => clearTimeout(delayDebounce);
  }, [profile.name, loaded]);

  // Debounced effect to sync full profile to server
  useEffect(() => {
    if (!loaded) return;
    const delayDebounce = setTimeout(() => {
      const body: { player_id: string; name?: string; bio?: string; pic?: string | null; interests?: string[] } = {
        player_id: playerIdRef.current,
      };
      let hasData = false;
      if (profile.name.trim()) { body.name = profile.name.trim(); hasData = true; }
      if (profile.bio.trim()) { body.bio = profile.bio.trim(); hasData = true; }
      if (profile.pic) { body.pic = profile.pic; hasData = true; }
      if (profile.interests.length > 0) { body.interests = profile.interests; hasData = true; }
      if (!hasData) return;
      fetch(`${getHttpBase()}/profile/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch((err) =>
        console.warn("Failed to sync profile to server:", err),
      );
    }, 1500);
    return () => clearTimeout(delayDebounce);
  }, [profile.name, profile.bio, profile.pic, profile.interests, loaded]);

  if (!loaded) return null;

  const winRate =
    profile.stats.gamesPlayed > 0
      ? Math.round((profile.stats.wins / profile.stats.gamesPlayed) * 100)
      : 0;

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isProfileReady: profile.name.trim().length > 0,
        setName,
        setBio,
        setPic,
        toggleInterest,
        clearProfile,
        recordGameResult,
        winRate,
        playerId: playerIdRef.current,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be inside ProfileProvider");
  return ctx;
}
