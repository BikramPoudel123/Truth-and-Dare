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
  return SERVER_URL.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://").replace(/\/$/, "");
}

export type Interest = "fun" | "life" | "hot" | "connect" | "spicy" | "deep";

export interface Profile {
  name: string;
  username: string;
  bio: string;
  pic: string | null;
  interests: Interest[];
}

export interface ProfileContextType {
  profile: Profile;
  isProfileReady: boolean;
  usernameStatus: "idle" | "checking" | "available" | "taken" | "saved";
  setName: (v: string) => void;
  setUsername: (v: string) => void;
  checkUsername: () => Promise<void>;
  setBio: (v: string) => void;
  setPic: (v: string | null) => void;
  toggleInterest: (i: Interest) => void;
  clearProfile: () => void;
  playerId: string;
}

const DEFAULT: Profile = { name: "", username: "", bio: "", pic: null, interests: [] };

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "saved">("idle");
  const playerIdRef = useRef(`pid-${Math.random().toString(36).slice(2)}-${Date.now()}`);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.multiGet([
      "prof:name", "prof:username", "prof:bio", "prof:pic", "prof:interests", "prof:player_id",
    ]).then((pairs) => {
      const map: Record<string, string | null> = {};
      pairs.forEach(([k, v]) => (map[k] = v));
      if (map["prof:player_id"]) playerIdRef.current = map["prof:player_id"];
      else AsyncStorage.setItem("prof:player_id", playerIdRef.current);
      setProfile({
        name: map["prof:name"] ?? "",
        username: map["prof:username"] ?? "",
        bio: map["prof:bio"] ?? "",
        pic: map["prof:pic"] ?? null,
        interests: map["prof:interests"] ? (JSON.parse(map["prof:interests"]) as Interest[]) : [],
      });
      if (map["prof:username"]) setUsernameStatus("saved");
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      const pairs: [string, string][] = [];
      if (patch.name !== undefined) pairs.push(["prof:name", patch.name]);
      if (patch.username !== undefined) pairs.push(["prof:username", patch.username]);
      if (patch.bio !== undefined) pairs.push(["prof:bio", patch.bio]);
      if (patch.pic !== undefined) pairs.push(["prof:pic", patch.pic ?? ""]);
      if (patch.interests !== undefined) pairs.push(["prof:interests", JSON.stringify(patch.interests)]);
      if (pairs.length) AsyncStorage.multiSet(pairs);
      return next;
    });
  }, []);

  const setName = useCallback((v: string) => persist({ name: v }), [persist]);
  const setBio  = useCallback((v: string) => persist({ bio: v }),  [persist]);
  const setPic  = useCallback((v: string | null) => persist({ pic: v }), [persist]);

  const setUsername = useCallback((v: string) => {
    const clean = v.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
    persist({ username: clean });
    setUsernameStatus("idle");
  }, [persist]);

  const checkUsername = useCallback(async () => {
    setProfile(prev => {
      const uname = prev.username.trim().toLowerCase();
      if (uname.length < 2) { setUsernameStatus("idle"); return prev; }
      setUsernameStatus("checking");
      (async () => {
        try {
          const res = await fetch(`${getHttpBase()}/username/check?username=${encodeURIComponent(uname)}`);
          const data = await res.json();
          if (data.available) {
            // Claim it
            const claim = await fetch(`${getHttpBase()}/username/claim`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: uname, player_id: playerIdRef.current }),
            });
            const cdata = await claim.json();
            setUsernameStatus(cdata.ok ? "saved" : "taken");
          } else {
            setUsernameStatus("taken");
          }
        } catch {
          setUsernameStatus("idle");
        }
      })();
      return prev;
    });
  }, []);

  const toggleInterest = useCallback((i: Interest) => {
    setProfile((prev) => {
      const has = prev.interests.includes(i);
      const next = has ? prev.interests.filter((x) => x !== i) : [...prev.interests, i];
      AsyncStorage.setItem("prof:interests", JSON.stringify(next));
      return { ...prev, interests: next };
    });
  }, []);

  const clearProfile = useCallback(() => {
    setProfile({ ...DEFAULT, username: "" });
    setUsernameStatus("idle");
    AsyncStorage.multiRemove(["prof:name", "prof:username", "prof:bio", "prof:pic", "prof:interests"]);
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
        console.warn("Failed to sync profile name to server:", err)
      );
    }, 1000);
    return () => clearTimeout(delayDebounce);
  }, [profile.name, loaded]);

  if (!loaded) return null;

  return (
    <ProfileContext.Provider value={{
      profile,
      isProfileReady: profile.name.trim().length > 0 && (profile.username.trim().length === 0 || usernameStatus === "saved"),
      usernameStatus,
      setName, setUsername, checkUsername, setBio, setPic, toggleInterest, clearProfile,
      playerId: playerIdRef.current,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be inside ProfileProvider");
  return ctx;
}
