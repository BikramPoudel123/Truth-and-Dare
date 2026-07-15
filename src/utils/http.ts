import { SERVER_URL } from "@/constants/server";

export function getHttpBase() {
  return SERVER_URL.replace(/^ws:\/\//, "http://")
    .replace(/^wss:\/\//, "https://")
    .replace(/\/$/, "");
}

// Simple in-memory profile cache to avoid redundant fetches
const profileCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds

export async function fetchProfileCached(playerId: string): Promise<any | null> {
  const now = Date.now();
  const cached = profileCache.get(playerId);
  if (cached && now - cached.ts < CACHE_TTL) return cached.data;

  try {
    const res = await fetch(`${getHttpBase()}/profile/${encodeURIComponent(playerId)}`);
    if (res.ok) {
      const data = await res.json();
      profileCache.set(playerId, { data, ts: now });
      return data;
    }
  } catch {}
  return null;
}

export function invalidateProfileCache(playerId?: string) {
  if (playerId) profileCache.delete(playerId);
  else profileCache.clear();
}

export interface FriendRequestResult {
  ok: boolean;
  status: "sent" | "already_friends" | "already_requested" | "mutual" | "error";
}

export async function sendFriendRequest(
  fromId: string,
  fromName: string,
  fromPic: string | null,
  toId: string,
): Promise<FriendRequestResult> {
  try {
    const res = await fetch(`${getHttpBase()}/friends/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_id: fromId, from_name: fromName, from_pic: fromPic, to_id: toId }),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, status: data.status ?? "sent" };
    }
  } catch {}
  return { ok: false, status: "error" };
}

export async function fetchFriendIdsAndSent(
  playerId: string,
): Promise<{ friendIds: Set<string>; sentIds: Set<string> }> {
  try {
    const res = await fetch(`${getHttpBase()}/friends/${encodeURIComponent(playerId)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        friendIds: new Set(data.friends.map((f: { id: string }) => f.id)),
        sentIds: new Set(data.sent ?? []),
      };
    }
  } catch {}
  return { friendIds: new Set(), sentIds: new Set() };
}

export async function uploadMedia(
  base64: string,
  filename: string,
): Promise<{ url: string } | null> {
  try {
    const res = await fetch(`${getHttpBase()}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, filename }),
    });
    if (res.ok) {
      const data = await res.json();
      return { url: data.url };
    }
  } catch {}
  return null;
}
