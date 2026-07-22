require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const http = require("http");
const WebSocket = require("ws");
const { createClient } = require("redis");
const fs = require("fs");
const path = require("path");
const pino = require("pino");

// ─── Logger ──────────────────────────────────────────────────────────────────
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});

// ─── Config ──────────────────────────────────────────────────────────────────
const HOST = process.env.SERVER_HOST || "0.0.0.0";
const PORT = Number(process.env.SERVER_PORT || 5000);
const SOCKET_PATH = process.env.SOCKET_PATH || "/";
const NODE_ENV = process.env.NODE_ENV || "development";

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
  database: Number(process.env.REDIS_DATABASE || 0),
  tls: process.env.REDIS_TLS === "true",
};

const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// ─── Express + HTTP + WebSocket ──────────────────────────────────────────────
const app = express();
app.use(cors({ origin: CORS_ORIGIN.split(",").map(s => s.trim()), credentials: true }));
app.use(express.json({ limit: "10mb" }));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: SOCKET_PATH });

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const RATE_WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const RATE_MAX = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 60);

const uploadLimiter = rateLimit({
  windowMs: RATE_WINDOW,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads, try again later" },
});

const apiLimiter = rateLimit({
  windowMs: RATE_WINDOW,
  max: RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later" },
});

const communityLimiter = rateLimit({
  windowMs: RATE_WINDOW,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many posts, try again later" },
});

// ─── Heartbeat ──────────────────────────────────────────────────────────────
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 10000;
const heartbeatTimer = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      logger.warn("Terminating dead WebSocket connection");
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    if (ws.readyState === WebSocket.OPEN) ws.ping();
  }
}, HEARTBEAT_INTERVAL);

// ─── Uploads ────────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOADS_DIR));

// ─── Redis Client ───────────────────────────────────────────────────────────
const redisClient = createClient({
  socket: {
    host: REDIS_CONFIG.host,
    port: REDIS_CONFIG.port,
    tls: REDIS_CONFIG.tls || false,
    reconnectStrategy: (retries) => {
      if (retries > 10) { logger.error("Redis: max retries reached"); return new Error("Max retries"); }
      return Math.min(retries * 200, 5000);
    },
  },
  username: REDIS_CONFIG.username,
  password: REDIS_CONFIG.password,
  database: REDIS_CONFIG.database,
});

redisClient.on("error", (err) => logger.error({ err }, "Redis error"));
redisClient.on("reconnecting", () => logger.warn("Redis reconnecting..."));

let redisReady = false;
redisClient.connect()
  .then(() => { redisReady = true; logger.info("Redis connected"); })
  .catch((err) => logger.warn({ err }, "Redis connection failed — using in-memory fallback"));

// ─── In-Memory Stores ──────────────────────────────────────────────────────
const playerSockets = new Map();
const memStore = {
  rooms: new Map(),
  openRooms: new Set(),
  communityPosts: [],
  profiles: new Map(),
  friends: new Map(),
  friendReqs: new Map(),
  notifications: new Map(),
};

// ─── Redis Helpers ──────────────────────────────────────────────────────────
async function getRoom(roomId) {
  if (!redisReady) {
    const d = memStore.rooms.get(roomId);
    return d ? JSON.parse(d) : null;
  }
  const d = await redisClient.get(`room:${roomId}`);
  return d ? JSON.parse(d) : null;
}

async function saveRoom(room) {
  if (!redisReady) {
    memStore.rooms.set(room.room_id, JSON.stringify(room));
    return;
  }
  await redisClient.set(`room:${room.room_id}`, JSON.stringify(room), { EX: 7200 });
}

async function deleteRoom(roomId) {
  if (!redisReady) {
    memStore.rooms.delete(roomId);
    memStore.openRooms.delete(roomId);
    return;
  }
  await redisClient.del(`room:${roomId}`);
  await redisClient.sRem("rooms:open", roomId);
}

async function markRoomOpen(roomId) {
  if (!redisReady) { memStore.openRooms.add(roomId); return; }
  await redisClient.sAdd("rooms:open", roomId);
}

async function markRoomClosed(roomId) {
  if (!redisReady) { memStore.openRooms.delete(roomId); return; }
  await redisClient.sRem("rooms:open", roomId);
}

async function findAvailableRoom(interests = []) {
  const openIds = !redisReady
    ? Array.from(memStore.openRooms)
    : await redisClient.sMembers("rooms:open");

  let matched = [], unmatched = [];
  for (const id of openIds) {
    const room = await getRoom(id);
    if (!room || room.is_private || room.players.length >= 2 || room.phase !== "waiting") {
      await markRoomClosed(id);
      continue;
    }
    const creator = room.players[0];
    const ci = creator.interests ?? [];
    const hasMatch = interests.length > 0 && ci.length > 0 && interests.some(i => ci.includes(i));
    if (hasMatch) matched.push(room); else unmatched.push(room);
  }
  return matched[0] || unmatched[0] || null;
}

// ─── Profile Helpers (Redis-backed) ─────────────────────────────────────────
async function getProfile(playerId) {
  if (!redisReady) return memStore.profiles.get(playerId) || null;
  const d = await redisClient.get(`profile:${playerId}`);
  return d ? JSON.parse(d) : null;
}

async function saveProfile(playerId, data) {
  if (!redisReady) { memStore.profiles.set(playerId, data); return; }
  await redisClient.set(`profile:${playerId}`, JSON.stringify(data));
}

// ─── Friend Helpers (Redis-backed) ──────────────────────────────────────────
async function getFriendIds(playerId) {
  if (!redisReady) return memStore.friends.get(playerId) || new Set();
  const ids = await redisClient.sMembers(`friends:${playerId}`);
  return new Set(ids);
}

async function addFriendPair(a, b) {
  if (!redisReady) {
    if (!memStore.friends.has(a)) memStore.friends.set(a, new Set());
    if (!memStore.friends.has(b)) memStore.friends.set(b, new Set());
    memStore.friends.get(a).add(b);
    memStore.friends.get(b).add(a);
    return;
  }
  await redisClient.sAdd(`friends:${a}`, b);
  await redisClient.sAdd(`friends:${b}`, a);
}

async function removeFriendPair(a, b) {
  if (!redisReady) {
    memStore.friends.get(a)?.delete(b);
    memStore.friends.get(b)?.delete(a);
    return;
  }
  await redisClient.sRem(`friends:${a}`, b);
  await redisClient.sRem(`friends:${b}`, a);
}

async function areFriends(a, b) {
  const fa = await getFriendIds(a);
  return fa.has(b);
}

// ─── Friend Request Helpers (Redis-backed) ──────────────────────────────────
async function saveFriendReq(requestId, data) {
  if (!redisReady) { memStore.friendReqs.set(requestId, data); return; }
  await redisClient.hSet(`friendreq:${requestId}`, Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v ?? "")])
  ));
}

async function getFriendReq(requestId) {
  if (!redisReady) return memStore.friendReqs.get(requestId) || null;
  const d = await redisClient.hGetAll(`friendreq:${requestId}`);
  if (!d || !d.id) return null;
  return { ...d, createdAt: Number(d.createdAt || 0) };
}

async function updateFriendReq(requestId, updates) {
  if (!redisReady) {
    const r = memStore.friendReqs.get(requestId);
    if (r) Object.assign(r, updates);
    return;
  }
  const entries = Object.entries(updates).map(([k, v]) => [k, String(v ?? "")]);
  await redisClient.hSet(`friendreq:${requestId}`, entries);
}

async function findFriendReq(fromId, toId) {
  if (!redisReady) {
    for (const [, r] of memStore.friendReqs) {
      if (r.from === fromId && r.to === toId && r.status === "pending") return r;
    }
    return null;
  }
  let cursor = "0";
  do {
    const result = await redisClient.scan(cursor, { MATCH: "friendreq:*", COUNT: 100 });
    cursor = String(result.cursor);
    for (const key of result.keys) {
      const d = await redisClient.hGetAll(key);
      if (d.from === fromId && d.to === toId && d.status === "pending") {
        return { ...d, createdAt: Number(d.createdAt || 0) };
      }
    }
  } while (cursor !== "0");
  return null;
}

async function findMutualFriendReq(fromId, toId) {
  if (!redisReady) {
    for (const [, r] of memStore.friendReqs) {
      if (r.from === toId && r.to === fromId && r.status === "pending") return r;
    }
    return null;
  }
  let cursor = "0";
  do {
    const result = await redisClient.scan(cursor, { MATCH: "friendreq:*", COUNT: 100 });
    cursor = String(result.cursor);
    for (const key of result.keys) {
      const d = await redisClient.hGetAll(key);
      if (d.from === toId && d.to === fromId && d.status === "pending") {
        return { ...d, createdAt: Number(d.createdAt || 0) };
      }
    }
  } while (cursor !== "0");
  return null;
}

async function getFriendReqsForPlayer(playerId) {
  const results = [];
  if (!redisReady) {
    for (const [, r] of memStore.friendReqs) {
      if (r.status === "pending" && r.to === playerId) results.push(r);
    }
    return results;
  }
  let cursor = "0";
  do {
    const result = await redisClient.scan(cursor, { MATCH: "friendreq:*", COUNT: 100 });
    cursor = String(result.cursor);
    for (const key of result.keys) {
      const d = await redisClient.hGetAll(key);
      if (d.status === "pending" && d.to === playerId) {
        results.push({ ...d, createdAt: Number(d.createdAt || 0) });
      }
    }
  } while (cursor !== "0");
  return results;
}

async function getSentFriendReqs(playerId) {
  const results = [];
  if (!redisReady) {
    for (const [, r] of memStore.friendReqs) {
      if (r.status === "pending" && r.from === playerId) results.push(r.to);
    }
    return results;
  }
  let cursor = "0";
  do {
    const result = await redisClient.scan(cursor, { MATCH: "friendreq:*", COUNT: 100 });
    cursor = String(result.cursor);
    for (const key of result.keys) {
      const d = await redisClient.hGetAll(key);
      if (d.status === "pending" && d.from === playerId) results.push(d.to);
    }
  } while (cursor !== "0");
  return results;
}

// ─── Notification Helpers (Redis-backed) ────────────────────────────────────
async function pushNotification(playerId, notification) {
  const notifJson = JSON.stringify(notification);
  if (!redisReady) {
    const list = memStore.notifications.get(playerId) || [];
    list.unshift(notification);
    memStore.notifications.set(playerId, list);
  } else {
    await redisClient.lPush(`notif:${playerId}`, notifJson);
    await redisClient.lTrim(`notif:${playerId}`, 0, 99);
  }
  const ws = playerSockets.get(playerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "new_notification", notification }));
  }
}

async function getNotifications(playerId) {
  if (!redisReady) return memStore.notifications.get(playerId) || [];
  const list = await redisClient.lRange(`notif:${playerId}`, 0, -1);
  return list.map(j => JSON.parse(j));
}

async function markNotificationsRead(playerId) {
  if (!redisReady) {
    const list = memStore.notifications.get(playerId);
    if (list) list.forEach(n => { n.read = true; });
    return;
  }
  const list = await redisClient.lRange(`notif:${playerId}`, 0, -1);
  const pipeline = redisClient.multi();
  await redisClient.del(`notif:${playerId}`);
  for (const j of list) {
    const n = JSON.parse(j);
    n.read = true;
    await redisClient.lPush(`notif:${playerId}`, JSON.stringify(n));
  }
}

function createNotification(toId, fromId, fromName, fromPic, type, message) {
  pushNotification(toId, {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type, from: fromId, fromName, fromPic: fromPic ?? null,
    message, read: false, createdAt: Date.now(),
  });
}

// ─── Utilities ──────────────────────────────────────────────────────────────
function generateRoomId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";
  for (let i = 0; i < 4; i++) id += letters.charAt(Math.floor(Math.random() * letters.length));
  return id;
}

async function createRoom(creator = null, isPrivate = false) {
  const MAX_RETRIES = 20;
  let roomId = generateRoomId();
  let retries = 0;
  while (await getRoom(roomId) && retries < MAX_RETRIES) {
    roomId = generateRoomId();
    retries++;
  }
  if (retries >= MAX_RETRIES) {
    logger.error("Failed to generate unique room ID after max retries");
    return null;
  }

  const gameState = {
    room_id: roomId,
    players: creator ? [creator] : [],
    current_turn: 0,
    phase: "waiting",
    current_mode: null,
    current_question: null,
    player1_answer: null,
    player2_answer: null,
    reaction: null,
    question_reaction: null,
    is_private: isPrivate,
  };

  await saveRoom(gameState);
  if (!isPrivate) await markRoomOpen(roomId);

  logger.info({ roomId, private: isPrivate }, "Room created");
  return roomId;
}

function broadcastToRoom(room, message) {
  const msg = JSON.stringify(message);
  room.players.forEach((player) => {
    const ws = playerSockets.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

function sendToPlayer(playerId, message) {
  const ws = playerSockets.get(playerId);
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}

function broadcastOnlineCount() {
  const count = playerSockets.size;
  const msg = JSON.stringify({ type: "players_online", count });
  for (const ws of playerSockets.values()) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

function normalizeMediaData(mediaData) {
  if (Array.isArray(mediaData)) return mediaData.join("");
  if (typeof mediaData === "string") return mediaData;
  return "";
}

function normalizeMediaList(mediaList = []) {
  return mediaList.map((item) => ({ ...item, media_data: normalizeMediaData(item.media_data) }));
}

function getPlayStyle(reactions = {}) {
  const entries = Object.entries(reactions).filter(([, c]) => c > 0);
  if (entries.length === 0) return "Rising Star";
  const top = entries.sort(([, a], [, b]) => b - a)[0][0];
  const map = { "🔥": "Hot Player", "😂": "Funny Player", "😍": "Heartthrob", "😮": "Shocking Player", "💀": "Savage Player", "😢": "Emotional Player", "🎉": "Life of the Party", "👏": "Respected Player" };
  return map[top] ?? "Rising Star";
}

function sanitizeString(val, maxLen) {
  return String(val || "").slice(0, maxLen);
}

// ─── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    redis: redisReady ? "connected" : "disconnected",
    playersOnline: playerSockets.size,
    env: NODE_ENV,
  });
});

// ─── HTTP API ───────────────────────────────────────────────────────────────

app.post("/profile/update", apiLimiter, async (req, res) => {
  try {
    const { player_id, name } = req.body;
    if (!player_id || !name) return res.status(400).json({ error: "Missing player_id or name" });
    const cleanName = sanitizeString(name, 30);
    const posts = await getCommunityPosts();
    let updated = false;
    const newPosts = posts.map(p => {
      if (p.author_id === player_id && p.author !== cleanName) { updated = true; return { ...p, author: cleanName }; }
      return p;
    });
    if (updated) await saveCommunityPosts(newPosts);
    res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, "POST /profile/update error");
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/profile/sync", apiLimiter, async (req, res) => {
  try {
    const { player_id, name, bio, pic, interests, played_since, gamesPlayed } = req.body;
    if (!player_id) return res.status(400).json({ error: "Missing player_id" });
    const existing = (await getProfile(player_id)) || {};
    if (name !== undefined) existing.name = sanitizeString(name, 30);
    if (bio !== undefined) existing.bio = sanitizeString(bio, 80);
    if (pic !== undefined) existing.pic = pic;
    if (interests !== undefined) existing.interests = interests;
    if (played_since !== undefined) existing.played_since = played_since;
    if (gamesPlayed !== undefined) existing.gamesPlayed = gamesPlayed;
    await saveProfile(player_id, existing);
    const reactionCount = existing.reactions ? Object.values(existing.reactions).reduce((s, c) => s + c, 0) : 0;
    res.json({ ok: true, reactions: existing.reactions ?? {}, reactionCount, played_since: existing.played_since ?? null, gamesPlayed: existing.gamesPlayed ?? 0 });
  } catch (e) {
    logger.error({ err: e }, "POST /profile/sync error");
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/profile/:player_id", apiLimiter, async (req, res) => {
  try {
    const { player_id } = req.params;
    const data = await getProfile(player_id);
    if (!data) return res.status(404).json({ error: "Profile not found" });
    const reactions = data.reactions ?? {};
    const reactionCount = Object.values(reactions).reduce((s, c) => s + c, 0);
    const gamesPlayed = data.gamesPlayed ?? 0;
    res.json({
      name: data.name ?? "Unknown", bio: data.bio ?? "", pic: data.pic ?? null,
      interests: data.interests ?? [], reactions, reactionCount,
      played_since: data.played_since ?? null, playStyle: getPlayStyle(data.reactions),
      gamesPlayed, level: Math.max(1, Math.floor(gamesPlayed / 10) + 1),
    });
  } catch (e) {
    logger.error({ err: e }, "GET /profile/:player_id error");
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/upload", uploadLimiter, (req, res) => {
  try {
    const { base64, filename } = req.body;
    if (!base64 || !filename) return res.status(400).json({ error: "Missing base64 or filename" });

    let ext = "jpg", buffer;
    if (base64.startsWith("data:")) {
      const matches = base64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ error: "Invalid base64 image" });
      ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(base64, "base64");
    }

    if (buffer.length > 10 * 1024 * 1024) return res.status(413).json({ error: "File too large (max 10MB)" });

    const safeName = `${filename.replace(/[^a-zA-Z0-9_-]/g, "")}-${Date.now()}.${ext}`;
    fs.writeFile(path.join(UPLOADS_DIR, safeName), buffer, (err) => {
      if (err) { logger.error({ err }, "Upload write error"); return res.status(500).json({ error: "Failed to save file" }); }
      res.json({ url: `/uploads/${safeName}` });
    });
  } catch (e) {
    logger.error({ err: e }, "POST /upload error");
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Community ──────────────────────────────────────────────────────────────
const POSTS_KEY = "community:posts";
const POSTS_MAX = 200;

async function getCommunityPosts() {
  if (!redisReady) return memStore.communityPosts;
  const d = await redisClient.get(POSTS_KEY);
  return d ? JSON.parse(d) : [];
}

async function saveCommunityPosts(posts) {
  if (!redisReady) { memStore.communityPosts = posts; return; }
  await redisClient.set(POSTS_KEY, JSON.stringify(posts));
}

app.get("/community/posts", apiLimiter, async (req, res) => {
  try {
    const { player_id } = req.query;
    const posts = await getCommunityPosts();
    const mapped = [];
    for (const p of posts) {
      const authorProfile = await getProfile(p.author_id);
      mapped.push({ ...p, likedByMe: player_id ? (p.liked_by || []).includes(player_id) : false, profilePic: authorProfile?.pic ?? null });
    }
    res.json({ posts: mapped });
  } catch (e) {
    logger.error({ err: e }, "GET /community/posts error");
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/community/posts", communityLimiter, async (req, res) => {
  try {
    const { author, type, text, author_id } = req.body;
    if (!author || !text || !["truth", "dare"].includes(type)) return res.status(400).json({ error: "Invalid post data" });
    const authorProfile = await getProfile(author_id);
    const post = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author: sanitizeString(author, 30),
      author_id: sanitizeString(author_id, 40),
      type, text: sanitizeString(text, 300),
      likes: 0, liked_by: [], createdAt: Date.now(),
      profilePic: authorProfile?.pic ?? null,
    };
    const posts = await getCommunityPosts();
    posts.unshift(post);
    if (posts.length > POSTS_MAX) posts.length = POSTS_MAX;
    await saveCommunityPosts(posts);
    res.json({ post });
  } catch (e) {
    logger.error({ err: e }, "POST /community/posts error");
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/community/posts/:id/like", apiLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { player_id } = req.body;
    if (!player_id) return res.status(400).json({ error: "Missing player_id" });
    const posts = await getCommunityPosts();
    const post = posts.find(p => p.id === id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (!post.liked_by) post.liked_by = [];
    const idx = post.liked_by.indexOf(player_id);
    if (idx === -1) { post.liked_by.push(player_id); post.likes = (post.likes ?? 0) + 1; }
    else { post.liked_by.splice(idx, 1); post.likes = Math.max(0, (post.likes ?? 0) - 1); }
    await saveCommunityPosts(posts);
    res.json({ likes: post.likes, likedByMe: idx === -1 });
  } catch (e) {
    logger.error({ err: e }, "POST /community/posts/:id/like error");
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Players Search ─────────────────────────────────────────────────────────
app.get("/players/search", apiLimiter, async (req, res) => {
  try {
    const { query, player_id } = req.query;
    if (!query || !player_id) return res.status(400).json({ error: "Missing required params" });
    const q = query.toLowerCase();
    const myFriends = await getFriendIds(player_id);
    const mySent = await getSentFriendReqs(player_id);
    const results = [];

    if (!redisReady) {
      for (const [pid, p] of memStore.profiles) {
        if (pid === player_id || !p?.name?.toLowerCase().includes(q)) continue;
        results.push({ id: pid, name: p.name, pic: p.pic ?? null, isFriend: myFriends.has(pid), requestSent: mySent.includes(pid) });
        if (results.length >= 20) break;
      }
    } else {
      let cursor = "0";
      do {
        const r = await redisClient.scan(cursor, { MATCH: "profile:*", COUNT: 100 });
        cursor = String(r.cursor);
        for (const key of r.keys) {
          const pid = key.replace("profile:", "");
          if (pid === player_id) continue;
          const p = JSON.parse(await redisClient.get(key));
          if (!p?.name?.toLowerCase().includes(q)) continue;
          results.push({ id: pid, name: p.name, pic: p.pic ?? null, isFriend: myFriends.has(pid), requestSent: mySent.includes(pid) });
          if (results.length >= 20) break;
        }
      } while (cursor !== "0" && results.length < 20);
    }
    res.json({ results });
  } catch (e) {
    logger.error({ err: e }, "GET /players/search error");
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Friends ────────────────────────────────────────────────────────────────
app.post("/friends/request", apiLimiter, async (req, res) => {
  try {
    const { from_id, from_name, from_pic, to_id } = req.body;
    if (!from_id || !to_id || !from_name) return res.status(400).json({ error: "Missing required fields" });
    if (from_id === to_id) return res.status(400).json({ error: "Cannot friend yourself" });
    if (await areFriends(from_id, to_id)) return res.json({ ok: true, status: "already_friends" });

    const existing = await findFriendReq(from_id, to_id);
    if (existing) return res.json({ ok: true, status: "already_requested" });

    const mutual = await findMutualFriendReq(from_id, to_id);
    if (mutual) {
      await updateFriendReq(mutual.id, { status: "accepted" });
      await addFriendPair(from_id, to_id);
      const toProfile = await getProfile(to_id);
      createNotification(from_id, to_id, toProfile?.name ?? from_name, from_pic, "friend_request_accepted", `${toProfile?.name ?? from_name} accepted your friend request`);
      createNotification(to_id, from_id, from_name, from_pic, "friend_request_accepted", `${from_name} accepted your friend request`);
      return res.json({ ok: true, status: "mutual" });
    }

    const requestId = `freq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await saveFriendReq(requestId, { id: requestId, from: from_id, to: to_id, fromName: from_name, fromPic: from_pic ?? null, status: "pending", createdAt: Date.now() });
    createNotification(to_id, from_id, from_name, from_pic, "friend_request", `${from_name} sent you a friend request`);
    res.json({ ok: true, status: "sent" });
  } catch (e) {
    logger.error({ err: e }, "POST /friends/request error");
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/friends/accept", apiLimiter, async (req, res) => {
  try {
    const { request_id, actor_id } = req.body;
    const request = await getFriendReq(request_id);
    if (!request || request.to !== actor_id || request.status !== "pending") return res.status(400).json({ error: "Invalid request" });
    await updateFriendReq(request_id, { status: "accepted" });
    await addFriendPair(request.from, request.to);
    const requesterProfile = await getProfile(request.from);
    createNotification(request.from, request.to, requesterProfile?.name ?? request.fromName, null, "friend_request_accepted", `${requesterProfile?.name ?? request.fromName} accepted your friend request`);
    res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, "POST /friends/accept error");
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/friends/reject", apiLimiter, async (req, res) => {
  try {
    const { request_id, actor_id } = req.body;
    const request = await getFriendReq(request_id);
    if (!request || request.to !== actor_id || request.status !== "pending") return res.status(400).json({ error: "Invalid request" });
    await updateFriendReq(request_id, { status: "rejected" });
    createNotification(request.from, request.to, request.fromName, null, "friend_request_rejected", `${request.fromName} declined your friend request`);
    res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, "POST /friends/reject error");
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/friends/remove", apiLimiter, async (req, res) => {
  try {
    const { player_id, friend_id } = req.body;
    if (!player_id || !friend_id) return res.status(400).json({ error: "Missing required fields" });
    await removeFriendPair(player_id, friend_id);
    res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, "POST /friends/remove error");
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/friends/:player_id", apiLimiter, async (req, res) => {
  try {
    const { player_id } = req.params;
    const friendIds = await getFriendIds(player_id);
    const friends = [];
    for (const fid of friendIds) {
      const p = await getProfile(fid);
      friends.push({ id: fid, name: p?.name ?? "Unknown", pic: p?.pic ?? null });
    }
    const requests = await getFriendReqsForPlayer(player_id);
    const enriched = [];
    for (const r of requests) {
      const p = await getProfile(r.from);
      enriched.push({ id: r.id, from: r.from, fromName: p?.name ?? r.fromName, fromPic: p?.pic ?? r.fromPic, createdAt: r.createdAt });
    }
    const sent = await getSentFriendReqs(player_id);
    res.json({ friends, requests: enriched, sent });
  } catch (e) {
    logger.error({ err: e }, "GET /friends/:player_id error");
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Notifications ──────────────────────────────────────────────────────────
app.get("/notifications/:player_id", apiLimiter, async (req, res) => {
  try {
    const { player_id } = req.params;
    const list = await getNotifications(player_id);
    res.json({ notifications: list });
  } catch (e) {
    logger.error({ err: e }, "GET /notifications/:player_id error");
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/notifications/read", apiLimiter, async (req, res) => {
  try {
    const { player_id } = req.body;
    if (player_id) await markNotificationsRead(player_id);
    res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, "POST /notifications/read error");
    res.status(500).json({ error: "Server error" });
  }
});

// ─── WebSocket Handler ──────────────────────────────────────────────────────
wss.on("connection", (ws) => {
  logger.info("Client connected");
  ws.send(JSON.stringify({ type: "players_online", count: playerSockets.size }));

  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data);
      if (!redisReady && !["register"].includes(message.type)) {
        logger.warn("Redis not ready, rejecting:", message.type);
        return;
      }

      switch (message.type) {
        case "register": {
          const { player_id } = message;
          if (player_id) { playerSockets.set(player_id, ws); broadcastOnlineCount(); }
          break;
        }

        case "create_room": {
          const { player_id, player_name, profile_pic } = message;
          playerSockets.set(player_id, ws);
          broadcastOnlineCount();
          if (!player_name) { sendToPlayer(player_id, { type: "error", message: "Player name is required" }); break; }
          const roomId = await createRoom({ id: player_id, name: sanitizeString(player_name, 30), profile_pic: profile_pic ?? null }, true);
          if (!roomId) { sendToPlayer(player_id, { type: "error", message: "Failed to create room" }); break; }
          const level = (await getProfile(player_id))?.gamesPlayed ?? 0;
          sendToPlayer(player_id, { type: "room_created", room_id: roomId });
          sendToPlayer(player_id, { type: "player_joined", players: [{ id: player_id, name: sanitizeString(player_name, 30), profile_pic: profile_pic ?? null, level: Math.floor(level / 10) + 1 }] });
          break;
        }

        case "auto_join": {
          const { player_id, player_name, profile_pic, interests } = message;
          playerSockets.set(player_id, ws);
          broadcastOnlineCount();
          if (!player_name) { sendToPlayer(player_id, { type: "error", message: "Player name is required" }); break; }

          const availableRoom = await findAvailableRoom(interests ?? []);
          if (availableRoom && !availableRoom.is_private) {
            if (availableRoom.players.some(p => p.id === player_id)) {
              sendToPlayer(player_id, { type: "error", message: "You are already in the room" }); break;
            }
            const player = { id: player_id, name: sanitizeString(player_name, 30), profile_pic: profile_pic ?? null, interests: interests ?? [] };
            availableRoom.players.push(player);
            if (availableRoom.players.length === 2) { availableRoom.phase = "choosing"; availableRoom.current_turn = 0; await markRoomClosed(availableRoom.room_id); }
            await saveRoom(availableRoom);
            sendToPlayer(player_id, { type: "room_joined", room_id: availableRoom.room_id });
            const pProfile = await getProfile(player_id);
            broadcastToRoom(availableRoom, { type: "player_joined", players: availableRoom.players.map(p => ({ id: p.id, name: p.name, profile_pic: p.profile_pic ?? null, level: Math.floor((pProfile?.gamesPlayed ?? 0) / 10) + 1 })) });
            if (availableRoom.players.length === 2) broadcastToRoom(availableRoom, { type: "game_started", current_turn: 0 });
            break;
          }

          const roomId = await createRoom({ id: player_id, name: sanitizeString(player_name, 30), profile_pic: profile_pic ?? null, interests: interests ?? [] });
          if (!roomId) { sendToPlayer(player_id, { type: "error", message: "Failed to create room" }); break; }
          sendToPlayer(player_id, { type: "room_created", room_id: roomId });
          sendToPlayer(player_id, { type: "player_joined", players: [{ id: player_id, name: sanitizeString(player_name, 30), profile_pic: profile_pic ?? null }] });
          break;
        }

        case "join_room": {
          const { room_id, player_id, player_name, profile_pic } = message;
          playerSockets.set(player_id, ws);
          broadcastOnlineCount();
          const room = await getRoom(room_id);
          if (!room) { sendToPlayer(player_id, { type: "error", message: "Room not found" }); break; }
          if (room.players.length >= 2) { sendToPlayer(player_id, { type: "error", message: "Room is full" }); break; }
          if (room.players.some(p => p.id === player_id)) { sendToPlayer(player_id, { type: "error", message: "You are already in the room" }); break; }
          room.players.push({ id: player_id, name: sanitizeString(player_name, 30), profile_pic: profile_pic ?? null });
          if (room.players.length === 2) { room.phase = "choosing"; room.current_turn = 0; await markRoomClosed(room_id); }
          await saveRoom(room);
          broadcastToRoom(room, { type: "player_joined", players: room.players.map(p => ({ id: p.id, name: p.name, profile_pic: p.profile_pic ?? null })) });
          if (room.players.length === 2) broadcastToRoom(room, { type: "game_started", current_turn: 0 });
          break;
        }

        case "choose_mode": {
          const { room_id, player_id, mode } = message;
          const room = await getRoom(room_id);
          if (!room || room.phase !== "choosing") break;
          if (room.players[room.current_turn]?.id !== player_id) break;
          room.current_mode = mode;
          room.phase = "question_set";
          await saveRoom(room);
          broadcastToRoom(room, { type: "mode_chosen", chooser_name: room.players.find(p => p.id === player_id)?.name, mode, asker_name: room.players[1 - room.current_turn].name });
          break;
        }

        case "submit_question": {
          const { room_id, player_id, question } = message;
          const room = await getRoom(room_id);
          if (!room) break;
          const asker = room.players[1 - room.current_turn];
          if (!asker || asker.id !== player_id) break;
          room.current_question = sanitizeString(question, 500);
          room.phase = "answering";
          await saveRoom(room);
          broadcastToRoom(room, { type: "question_ready", question: room.current_question, asker_name: asker.name, responder_name: room.players[room.current_turn].name });
          break;
        }

        case "submit_answer": {
          const { room_id, player_id, answer } = message;
          const room = await getRoom(room_id);
          if (!room) break;
          if (room.players[room.current_turn]?.id !== player_id) break;
          room.player1_answer = sanitizeString(answer, 2000);
          room.phase = "reveal";
          await saveRoom(room);
          broadcastToRoom(room, { type: "both_answered", answer: room.player1_answer, responder_name: room.players[room.current_turn].name });
          break;
        }

        case "submit_answer_with_media_multiple": {
          const { room_id, player_id, answer, media_list } = message;
          const room = await getRoom(room_id);
          if (!room || room.players[room.current_turn]?.id !== player_id) break;
          room.player1_answer = sanitizeString(answer, 2000);
          room.phase = "reveal";
          await saveRoom(room);
          const responder = room.players[room.current_turn];
          broadcastToRoom(room, { type: "answer_with_media_multiple", answer: room.player1_answer, media_list: normalizeMediaList(media_list), player_name: responder.name, player_id: responder.id });
          break;
        }

        case "submit_answer_with_media": {
          const { room_id, player_id, answer, media_type, media_data } = message;
          const room = await getRoom(room_id);
          if (!room || room.players[room.current_turn]?.id !== player_id) break;
          room.player1_answer = sanitizeString(answer, 2000);
          room.phase = "reveal";
          await saveRoom(room);
          const responder = room.players[room.current_turn];
          broadcastToRoom(room, { type: "answer_with_media", answer: room.player1_answer, media_type, media_data: normalizeMediaData(media_data), player_name: responder.name, player_id: responder.id });
          break;
        }

        case "send_media": {
          const { room_id, player_id, player_name, media_type, media_data } = message;
          const room = await getRoom(room_id);
          if (!room || !["question_set", "answering", "reveal"].includes(room.phase)) break;
          broadcastToRoom(room, { type: "media_received", player_id, player_name, media_type, media_data: normalizeMediaData(media_data) });
          break;
        }

        case "forfeit": {
          const { room_id, player_id } = message;
          const room = await getRoom(room_id);
          if (!room) break;
          const forfeiter = room.players.find(p => p.id === player_id);
          if (!forfeiter) break;
          room.phase = "reveal";
          await saveRoom(room);
          broadcastToRoom(room, { type: "forfeit", forfeiter_name: forfeiter.name, answer: null, responder_name: forfeiter.name });
          break;
        }

        case "send_reaction": {
          const { room_id, player_id, reaction } = message;
          const room = await getRoom(room_id);
          if (!room || room.phase !== "reveal") break;
          const reactor = room.players.find(p => p.id === player_id);
          if (!reactor) break;
          room.reaction = reaction;
          await saveRoom(room);
          const responder = room.players[room.current_turn];
          if (responder) {
            const rp = (await getProfile(responder.id)) || {};
            const reactions = rp.reactions ?? {};
            reactions[reaction] = (reactions[reaction] ?? 0) + 1;
            rp.reactions = reactions;
            await saveProfile(responder.id, rp);
          }
          broadcastToRoom(room, { type: "reaction", reaction, reactor_name: reactor.name });
          break;
        }

        case "send_question_reaction": {
          const { room_id, player_id, reaction } = message;
          const room = await getRoom(room_id);
          if (!room || (room.phase !== "reveal" && room.phase !== "answering")) break;
          const reactor = room.players.find(p => p.id === player_id);
          if (!reactor) break;
          room.question_reaction = reaction;
          await saveRoom(room);
          const asker = room.players.find(p => p.id !== room.players[room.current_turn]?.id);
          if (asker) {
            const ap = (await getProfile(asker.id)) || {};
            const reactions = ap.reactions ?? {};
            reactions[reaction] = (reactions[reaction] ?? 0) + 1;
            ap.reactions = reactions;
            await saveProfile(asker.id, ap);
          }
          broadcastToRoom(room, { type: "question_reaction", reaction, reactor_name: reactor.name });
          break;
        }

        case "next_round": {
          const { room_id } = message;
          const room = await getRoom(room_id);
          if (!room || room.phase !== "reveal") break;
          room.current_turn = 1 - room.current_turn;
          room.phase = "choosing";
          room.current_mode = null;
          room.current_question = null;
          room.player1_answer = null;
          room.player2_answer = null;
          room.reaction = null;
          room.question_reaction = null;
          await saveRoom(room);
          broadcastToRoom(room, { type: "round_started", current_turn: room.current_turn });
          break;
        }

        case "quit_game": {
          const { room_id, player_id } = message;
          const room = await getRoom(room_id);
          if (!room) break;
          room.players = room.players.filter(p => p.id !== player_id);
          playerSockets.delete(player_id);
          broadcastOnlineCount();
          if (room.players.length > 0) { await saveRoom(room); broadcastToRoom(room, { type: "player_quit", message: "Other player quit" }); }
          else await deleteRoom(room_id);
          break;
        }

        case "reconnect": {
          const { room_id, player_id } = message;
          const room = await getRoom(room_id);
          if (!room) { sendToPlayer(player_id, { type: "error", message: "Room no longer exists" }); break; }
          const playerInRoom = room.players.find(p => p.id === player_id);
          if (!playerInRoom) { sendToPlayer(player_id, { type: "error", message: "You are not in this room" }); break; }
          playerSockets.set(player_id, ws);
          broadcastOnlineCount();
          sendToPlayer(player_id, {
            type: "game_state", room_id: room.room_id, phase: room.phase,
            current_turn: room.current_turn, current_mode: room.current_mode,
            current_question: room.current_question, players: room.players.map(p => ({ id: p.id, name: p.name })),
            answer: room.player1_answer,
          });
          break;
        }
      }
    } catch (error) {
      logger.error({ err: error }, "WebSocket handler error");
    }
  });

  ws.on("close", async () => {
    logger.info("Client disconnected");
    try {
      for (const [playerId, socket] of playerSockets.entries()) {
        if (socket !== ws) continue;
        playerSockets.delete(playerId);
        broadcastOnlineCount();

        if (!redisReady) {
          for (const [roomId, data] of memStore.rooms.entries()) {
            const room = JSON.parse(data);
            if (!room.players.some(p => p.id === playerId)) continue;
            room.players = room.players.filter(p => p.id !== playerId);
            if (room.players.length > 0) { await saveRoom(room); broadcastToRoom(room, { type: "player_quit", message: "Other player disconnected" }); }
            else await deleteRoom(room.room_id);
          }
        } else {
          let cursor = "0";
          do {
            const result = await redisClient.scan(cursor, { MATCH: "room:*", COUNT: 100 });
            cursor = String(result.cursor);
            for (const key of result.keys) {
              const data = await redisClient.get(key);
              if (!data) continue;
              const room = JSON.parse(data);
              if (!room.players.some(p => p.id === playerId)) continue;
              room.players = room.players.filter(p => p.id !== playerId);
              if (room.players.length > 0) { await saveRoom(room); broadcastToRoom(room, { type: "player_quit", message: "Other player disconnected" }); }
              else await deleteRoom(room.room_id);
            }
          } while (cursor !== "0");
        }
        break;
      }
    } catch (err) {
      logger.error({ err }, "Disconnect cleanup error");
    }
  });

  ws.on("error", (error) => logger.error({ err: error }, "WebSocket error"));
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);
  clearInterval(heartbeatTimer);

  for (const ws of wss.clients) ws.close(1001, "Server shutting down");

  wss.close(() => {
    logger.info("WebSocket server closed");
  });

  server.close(() => {
    logger.info("HTTP server closed");
  });

  if (redisReady) {
    await redisClient.quit();
    logger.info("Redis connection closed");
  }

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ─── Start ──────────────────────────────────────────────────────────────────
server.listen(PORT, HOST, () => {
  logger.info({ host: HOST, port: PORT, env: NODE_ENV }, `Server running on ws://${HOST}:${PORT}${SOCKET_PATH}`);
});
