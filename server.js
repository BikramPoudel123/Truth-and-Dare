const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { createClient } = require("redis");
const fs = require("fs");
const path = require("path");

const HOST = process.env.SERVER_HOST || "0.0.0.0";
const PORT = Number(process.env.SERVER_PORT || 5000);
const SOCKET_PATH = process.env.SOCKET_PATH || "/";

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
  database: Number(process.env.REDIS_DATABASE || 0),
  tls: process.env.REDIS_TLS === "true",
};

const app = express();
app.use(express.json({ limit: "10mb" }));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: SOCKET_PATH });

// Ping all clients every 30 seconds to keep connections alive
const HEARTBEAT_INTERVAL = 30000;
const heartbeatTimer = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }
}, HEARTBEAT_INTERVAL);

// ─── Upload directory ──────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

const PROFILE_DB_PATH = path.join(__dirname, "profiles.json");

// ─── Profile persistence ─────────────────────────────────────────────────────
function saveProfiles() {
  try {
    const obj = {};
    for (const [k, v] of profileStore) {
      obj[k] = v;
    }
    fs.writeFileSync(PROFILE_DB_PATH, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error("saveProfiles error:", e.message);
  }
}

function loadProfiles() {
  try {
    if (fs.existsSync(PROFILE_DB_PATH)) {
      const raw = fs.readFileSync(PROFILE_DB_PATH, "utf-8");
      const obj = JSON.parse(raw);
      for (const [k, v] of Object.entries(obj)) {
        profileStore.set(k, v);
      }
      console.log(`✓ Loaded ${Object.keys(obj).length} profiles from disk`);
    }
  } catch (e) {
    console.warn("loadProfiles error:", e.message);
  }
}

// ─── Redis Client ────────────────────────────────────────────────────────────
const redisClient = createClient({
  socket: {
    host: REDIS_CONFIG.host,
    port: REDIS_CONFIG.port,
    tls: REDIS_CONFIG.tls || false,
  },
  username: REDIS_CONFIG.username,
  password: REDIS_CONFIG.password,
  database: REDIS_CONFIG.database,
});

redisClient.on("error", (err) => console.error("Redis error:", err));

let redisReady = false;
redisClient
  .connect()
  .then(() => {
    redisReady = true;
    console.log("✓ Redis connected");
  })
  .catch((err) => {
    console.warn("⚠️ Redis connection failed:", err.message);
  });

console.log("Server config:", {
  host: HOST,
  port: PORT,
  socketPath: SOCKET_PATH,
  redis: { host: REDIS_CONFIG.host, port: REDIS_CONFIG.port },
});

// ─── In-memory: only WebSocket connections (cannot be stored in Redis) ───────
const playerSockets = new Map(); // playerId → WebSocket
const profileStore = new Map(); // playerId → { name, bio, pic, interests }
loadProfiles();
const friendStore = new Map(); // playerId → Set<friendId>
const friendReqStore = new Map(); // requestId → { id, from, to, fromName, fromPic, status, createdAt }
const notificationStore = new Map(); // playerId → Notification[]
const memStore = {
  rooms: new Map(), // roomId → JSON string
  openRooms: new Set(), // roomId
  communityPosts: [], // array of post objects
};

// ─── Redis helpers ────────────────────────────────────────────────────────────

function getPlayerLevel(playerId) {
  const data = profileStore.get(playerId);
  return data ? Math.floor((data.gamesPlayed ?? 0) / 10) + 1 : 1;
}

// Key conventions:
//   room:<ID>        → JSON string of the full room object
//   rooms:open       → Redis Set of room IDs that are waiting (1 player)

async function getRoom(roomId) {
  if (!redisReady) {
    const data = memStore.rooms.get(roomId);
    return data ? JSON.parse(data) : null;
  }
  const data = await redisClient.get(`room:${roomId}`);
  return data ? JSON.parse(data) : null;
}

async function saveRoom(room) {
  if (!redisReady) {
    memStore.rooms.set(room.room_id, JSON.stringify(room));
    console.log(`  💾 In-memory saved room:${room.room_id}`);
    return;
  }
  // Expire rooms after 2 hours of inactivity
  await redisClient.set(`room:${room.room_id}`, JSON.stringify(room), {
    EX: 7200,
  });
  console.log(`  💾 Redis saved room:${room.room_id}`);
}

async function deleteRoom(roomId) {
  if (!redisReady) {
    memStore.rooms.delete(roomId);
    memStore.openRooms.delete(roomId);
    console.log(`  🗑  In-memory deleted room:${roomId}`);
    return;
  }
  await redisClient.del(`room:${roomId}`);
  await redisClient.sRem("rooms:open", roomId);
  console.log(`  🗑  Redis deleted room:${roomId}`);
}

async function markRoomOpen(roomId) {
  if (!redisReady) {
    memStore.openRooms.add(roomId);
    return;
  }
  await redisClient.sAdd("rooms:open", roomId);
}

async function markRoomClosed(roomId) {
  if (!redisReady) {
    memStore.openRooms.delete(roomId);
    return;
  }
  await redisClient.sRem("rooms:open", roomId);
}

async function findAvailableRoom(interests = []) {
  const openIds = !redisReady
    ? Array.from(memStore.openRooms)
    : await redisClient.sMembers("rooms:open");

  // Separate into interest-matched and unmatched
  let matched = [];
  let unmatched = [];

  for (const id of openIds) {
    const room = await getRoom(id);
    if (!room) {
      await markRoomClosed(id);
      continue;
    }
    if (room.is_private) {
      continue;
    }
    if (room.players.length >= 2 || room.phase !== "waiting") {
      await markRoomClosed(id);
      continue;
    }
    const creator = room.players[0];
    const creatorInterests = creator.interests ?? [];
    const hasMatch = interests.length > 0 && creatorInterests.length > 0 &&
      interests.some(i => creatorInterests.includes(i));
    if (hasMatch) matched.push(room);
    else unmatched.push(room);
  }

  // Prefer interest-matched rooms first
  if (matched.length > 0) return matched[0];
  if (unmatched.length > 0) return unmatched[0];
  return null;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function generateRoomId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";
  for (let i = 0; i < 3; i++) {
    id += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return id;
}

async function createRoom(creator = null, isPrivate = false) {
  let roomId = generateRoomId();
  // Ensure unique (check Redis)
  while (await redisClient.exists(`room:${roomId}`)) {
    roomId = generateRoomId();
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
    is_private: isPrivate,
  };

  await saveRoom(gameState);
  if (!isPrivate) {
    await markRoomOpen(roomId);
  }

  const total = await redisClient.dbSize();
  console.log(`✓ Room Created: ${roomId} | Redis keys: ${total}${isPrivate ? " [private]" : ""}`);
  return roomId;
}

function broadcastToRoom(room, message) {
  room.players.forEach((player) => {
    const ws = playerSockets.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function sendToPlayer(playerId, message) {
  const ws = playerSockets.get(playerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastOnlineCount() {
  const count = playerSockets.size;
  const message = JSON.stringify({ type: "players_online", count });
  for (const ws of playerSockets.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

function normalizeMediaData(mediaData) {
  if (Array.isArray(mediaData)) return mediaData.join("");
  if (typeof mediaData === "string") return mediaData;
  return "";
}

function normalizeMediaList(mediaList = []) {
  return mediaList.map((item) => ({
    ...item,
    media_data: normalizeMediaData(item.media_data),
  }));
}

// ─── Notifications & Friends helpers ──────────────────────────────────────────

function pushNotification(playerId, notification) {
  const list = notificationStore.get(playerId) || [];
  list.unshift(notification);
  notificationStore.set(playerId, list);
  const ws = playerSockets.get(playerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "new_notification", notification }));
  }
}

function createNotification(toId, fromId, fromName, fromPic, type, message) {
  pushNotification(toId, {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    from: fromId,
    fromName,
    fromPic: fromPic ?? null,
    message,
    read: false,
    createdAt: Date.now(),
  });
}

function getFriendIds(playerId) {
  return friendStore.get(playerId) || new Set();
}

function areFriends(a, b) {
  return getFriendIds(a).has(b) && getFriendIds(b).has(a);
}

function addFriendPair(a, b) {
  if (!friendStore.has(a)) friendStore.set(a, new Set());
  if (!friendStore.has(b)) friendStore.set(b, new Set());
  friendStore.get(a).add(b);
  friendStore.get(b).add(a);
}

// ─── WebSocket handler ────────────────────────────────────────────────────────

wss.on("connection", (ws) => {
  console.log("✓ Client Connected");

  // Send current online count immediately
  const count = playerSockets.size;
  ws.send(JSON.stringify({ type: "players_online", count }));

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data);
      console.log("\n📨 Event:", message.type);

      // Guard: all handlers need Redis
      if (!redisReady) {
        console.warn("  ⚠️ Redis not ready yet");
        return;
      }

      switch (message.type) {
        // ── REGISTER (just mark as online) ────────────────────────────────────
        case "register": {
          const { player_id } = message;
          if (player_id) {
            playerSockets.set(player_id, ws);
            broadcastOnlineCount();
          }
          break;
        }

        // ── CREATE ROOM ──────────────────────────────────────────────────────
        case "create_room": {
          const { player_id, player_name, profile_pic } = message;
          playerSockets.set(player_id, ws);
          broadcastOnlineCount();
          if (!player_name) {
            sendToPlayer(player_id, {
              type: "error",
              message: "Player name is required",
            });
            break;
          }

          const roomId = await createRoom({
            id: player_id,
            name: player_name,
            profile_pic: profile_pic ?? null,
          }, true);
          console.log(`  → Private Room ${roomId} created for ${player_name}`);

          sendToPlayer(player_id, { type: "room_created", room_id: roomId });
          sendToPlayer(player_id, {
            type: "player_joined",
            players: [
              {
                id: player_id,
                name: player_name,
                profile_pic: profile_pic ?? null,
                level: getPlayerLevel(player_id),
              },
            ],
          });
          break;
        }

        // ── AUTO JOIN ────────────────────────────────────────────────────────
        case "auto_join": {
          const { player_id, player_name, profile_pic, interests } = message;
          playerSockets.set(player_id, ws);
          broadcastOnlineCount();
          if (!player_name) {
            sendToPlayer(player_id, {
              type: "error",
              message: "Player name is required",
            });
            break;
          }

          const availableRoom = await findAvailableRoom(interests ?? []);
          if (availableRoom) {
            if (availableRoom.is_private) {
              console.log(`  ✗ auto_join skipped private room ${availableRoom.room_id}`);
              await markRoomClosed(availableRoom.room_id);
            } else {
              if (availableRoom.players.some((p) => p.id === player_id)) {
                sendToPlayer(player_id, {
                  type: "error",
                  message: "You are already in the room",
                });
                break;
              }

              const player = {
                id: player_id,
                name: player_name,
                profile_pic: profile_pic ?? null,
                interests: interests ?? [],
              };
              availableRoom.players.push(player);

              if (availableRoom.players.length === 2) {
                availableRoom.phase = "choosing";
                availableRoom.current_turn = 0;
                await markRoomClosed(availableRoom.room_id);
              }
              await saveRoom(availableRoom);

              console.log(
                `  ✓ ${player_name} auto-joined ${availableRoom.room_id}`,
              );
              sendToPlayer(player_id, {
                type: "room_joined",
                room_id: availableRoom.room_id,
              });
              broadcastToRoom(availableRoom, {
                type: "player_joined",
                players: availableRoom.players.map((p) => ({
                  id: p.id,
                  name: p.name,
                  profile_pic: p.profile_pic ?? null,
                  level: getPlayerLevel(p.id),
                })),
              });

              if (availableRoom.players.length === 2) {
                console.log(`  🎮 Game Started: ${availableRoom.room_id}`);
                broadcastToRoom(availableRoom, {
                  type: "game_started",
                  current_turn: 0,
                });
              }
              break;
            }
          }

          const roomId = await createRoom({
            id: player_id,
            name: player_name,
            profile_pic: profile_pic ?? null,
            interests: interests ?? [],
          });
          console.log(`  → No open room. Created ${roomId} for ${player_name}`);
          sendToPlayer(player_id, { type: "room_created", room_id: roomId });
          sendToPlayer(player_id, {
            type: "player_joined",
            players: [
              {
                id: player_id,
                name: player_name,
                profile_pic: profile_pic ?? null,
              },
            ],
          });
          break;
        }

        // ── JOIN ROOM ────────────────────────────────────────────────────────
        case "join_room": {
          const { room_id, player_id, player_name, profile_pic } = message;
          console.log(
            `  → Join Request: Room=${room_id} Player=${player_name}`,
          );
          playerSockets.set(player_id, ws);
          broadcastOnlineCount();

          const room = await getRoom(room_id);

          if (!room) {
            console.log(`  ✗ Room not found: ${room_id}`);
            sendToPlayer(player_id, {
              type: "error",
              message: "Room not found",
            });
            break;
          }
          if (room.players.length >= 2) {
            console.log(`  ✗ Room full: ${room_id}`);
            sendToPlayer(player_id, { type: "error", message: "Room is full" });
            break;
          }
          if (room.players.some((p) => p.id === player_id)) {
            sendToPlayer(player_id, {
              type: "error",
              message: "You are already in the room",
            });
            break;
          }

          room.players.push({
            id: player_id,
            name: player_name,
            profile_pic: profile_pic ?? null,
          });

          if (room.players.length === 2) {
            room.phase = "choosing";
            room.current_turn = 0;
            await markRoomClosed(room_id);
          }
          await saveRoom(room);

          console.log(
            `  ✓ ${player_name} joined ${room_id} (${room.players.length}/2)`,
          );

          broadcastToRoom(room, {
            type: "player_joined",
            players: room.players.map((p) => ({
              id: p.id,
              name: p.name,
              profile_pic: p.profile_pic ?? null,
            })),
          });

          if (room.players.length === 2) {
            console.log(`  🎮 Game Started: ${room_id}`);
            broadcastToRoom(room, { type: "game_started", current_turn: 0 });
          }
          break;
        }

        // ── CHOOSE MODE ──────────────────────────────────────────────────────
        case "choose_mode": {
          const { room_id, player_id, mode } = message;
          const room = await getRoom(room_id);
          if (!room) break;

          // BUG 6 fix: guard against stale/replayed choose_mode in wrong phase
          if (room.phase !== "choosing") {
            console.log(
              `  ✗ choose_mode rejected — phase is '${room.phase}', not 'choosing'`,
            );
            break;
          }

          const chooser = room.players.find((p) => p.id === player_id);
          if (!chooser || room.players[room.current_turn].id !== player_id)
            break;

          room.current_mode = mode;
          room.phase = "question_set";
          await saveRoom(room);

          console.log(`  → Mode: ${mode} by ${chooser.name}`);
          broadcastToRoom(room, {
            type: "mode_chosen",
            chooser_name: chooser.name,
            mode,
            asker_name: room.players[1 - room.current_turn].name,
          });
          break;
        }

        // ── SUBMIT QUESTION ──────────────────────────────────────────────────
        case "submit_question": {
          const { room_id, player_id, question } = message;
          const room = await getRoom(room_id);
          if (!room) break;

          // BUG 4 fix: only the asker (non-chooser) can submit a question
          const asker = room.players[1 - room.current_turn];
          if (!asker || asker.id !== player_id) {
            console.log(
              `  ✗ submit_question rejected — player is not the asker`,
            );
            break;
          }

          room.current_question = question;
          room.phase = "answering";
          await saveRoom(room);

          const chooser = room.players[room.current_turn];
          broadcastToRoom(room, {
            type: "question_ready",
            question,
            asker_name: asker.name,
            responder_name: chooser.name,
          });
          break;
        }

        // ── SUBMIT ANSWER ────────────────────────────────────────────────────
        case "submit_answer": {
          const { room_id, player_id, answer } = message;
          const room = await getRoom(room_id);
          if (!room) break;

          // Only the chooser (responder) answers — reveal immediately
          const isChooser = room.players[room.current_turn].id === player_id;
          if (!isChooser) {
            console.log("  ✗ Only the chooser can submit an answer");
            break;
          }

          room.player1_answer = answer;
          room.phase = "reveal";
          await saveRoom(room);

          console.log(
            `  ✓ Answer submitted by ${room.players[room.current_turn].name}`,
          );
          broadcastToRoom(room, {
            type: "both_answered",
            answer: room.player1_answer,
            responder_name: room.players[room.current_turn].name,
          });
          break;
        }

        // ── SUBMIT ANSWER WITH MEDIA (MULTIPLE) ───────────────────────────
        case "submit_answer_with_media_multiple": {
          const { room_id, player_id, answer, media_list } = message;
          const room = await getRoom(room_id);
          if (!room) break;

          const isChooser = room.players[room.current_turn].id === player_id;
          if (!isChooser) break;

          room.player1_answer = answer;
          room.phase = "reveal";
          await saveRoom(room);

          const responder = room.players[room.current_turn];
          const normalizedMediaList = normalizeMediaList(media_list);
          console.log(
            `  ✓ Answer with ${normalizedMediaList.length} media by ${responder.name}`,
          );
          broadcastToRoom(room, {
            type: "answer_with_media_multiple",
            answer: room.player1_answer,
            media_list: normalizedMediaList,
            player_name: responder.name,
            player_id: responder.id,
          });
          break;
        }

        // ── SUBMIT ANSWER WITH MEDIA ────────────────────────────────────────
        case "submit_answer_with_media": {
          const { room_id, player_id, answer, media_type, media_data } =
            message;
          const room = await getRoom(room_id);
          if (!room) break;

          const isChooser = room.players[room.current_turn].id === player_id;
          if (!isChooser) {
            console.log("  ✗ Only the chooser can submit an answer");
            break;
          }

          room.player1_answer = answer;
          room.phase = "reveal";
          await saveRoom(room);

          const responder = room.players[room.current_turn];
          const normalizedMediaData = normalizeMediaData(media_data);
          console.log(
            `  ✓ Answer with ${media_type} submitted by ${responder.name}`,
          );
          broadcastToRoom(room, {
            type: "answer_with_media",
            answer: room.player1_answer,
            media_type,
            media_data: normalizedMediaData,
            player_name: responder.name,
            player_id: responder.id,
          });
          break;
        }

        // ── SEND MEDIA ───────────────────────────────────────────────────────
        case "send_media": {
          const { room_id, player_id, player_name, media_type, media_data } =
            message;
          const room = await getRoom(room_id);
          if (!room) break;

          // Allow media during question_set, answering, and reveal phases
          if (!["question_set", "answering", "reveal"].includes(room.phase)) {
            console.log(`  ✗ send_media rejected — phase is '${room.phase}'`);
            break;
          }

          const normalizedMediaData = normalizeMediaData(media_data);
          console.log(`  📸 Media (${media_type}) from ${player_name}`);
          broadcastToRoom(room, {
            type: "media_received",
            player_id,
            player_name,
            media_type,
            media_data: normalizedMediaData,
          });
          break;
        }

        // ── FORFEIT ──────────────────────────────────────────────────────────
        case "forfeit": {
          const { room_id, player_id } = message;
          const room = await getRoom(room_id);
          if (!room) break;

          const forfeiter = room.players.find((p) => p.id === player_id);
          if (!forfeiter) break;

          room.phase = "reveal";
          await saveRoom(room);

          console.log(`  🏳 Forfeit by ${forfeiter.name}`);
          broadcastToRoom(room, {
            type: "forfeit",
            forfeiter_name: forfeiter.name,
            answer: null,
            responder_name: forfeiter.name,
          });
          break;
        }

        // ── SEND REACTION ─────────────────────────────────────────────────────
        case "send_reaction": {
          const { room_id, player_id, reaction } = message;
          const room = await getRoom(room_id);
          if (!room || room.phase !== "reveal") break;

          const reactor = room.players.find((p) => p.id === player_id);
          if (!reactor) break;

          room.reaction = reaction;
          await saveRoom(room);

          // Track reaction on the responder's profile (the one who answered)
          const responder = room.players[room.current_turn];
          if (responder) {
            const respProfile = profileStore.get(responder.id) ?? {};
            const reactions = respProfile.reactions ?? {};
            reactions[reaction] = (reactions[reaction] ?? 0) + 1;
            respProfile.reactions = reactions;
            profileStore.set(responder.id, respProfile);
            saveProfiles();
          }

          broadcastToRoom(room, {
            type: "reaction",
            reaction,
            reactor_name: reactor.name,
          });
          break;
        }

        // ── NEXT ROUND ───────────────────────────────────────────────────────
        case "next_round": {
          const { room_id } = message;
          const room = await getRoom(room_id);
          if (!room) break;

          // BUG 5 fix: only process next_round once — reject if already moved on
          if (room.phase !== "reveal") {
            console.log(
              `  ✗ next_round rejected — phase is '${room.phase}', not 'reveal'`,
            );
            break;
          }

          room.current_turn = 1 - room.current_turn;
          room.phase = "choosing";
          room.current_mode = null;
          room.current_question = null;
          room.player1_answer = null;
          room.player2_answer = null;
          room.reaction = null;
          await saveRoom(room);

          broadcastToRoom(room, {
            type: "round_started",
            current_turn: room.current_turn,
          });
          break;
        }

        // ── QUIT GAME ────────────────────────────────────────────────────────
        case "quit_game": {
          const { room_id, player_id } = message;
          const room = await getRoom(room_id);
          if (!room) break;

          room.players = room.players.filter((p) => p.id !== player_id);
          playerSockets.delete(player_id);

          if (room.players.length > 0) {
            await saveRoom(room);
            broadcastToRoom(room, {
              type: "player_quit",
              message: "Other player quit",
            });
          } else {
            await deleteRoom(room_id);
          }
          break;
        }

        // ── RECONNECT ────────────────────────────────────────────────────────
        // BUG 7 fix: allow a player to re-attach their socket to an existing room
        case "reconnect": {
          const { room_id, player_id } = message;
          const room = await getRoom(room_id);
          if (!room) {
            sendToPlayer(player_id, {
              type: "error",
              message: "Room no longer exists",
            });
            break;
          }

          const playerInRoom = room.players.find((p) => p.id === player_id);
          if (!playerInRoom) {
            sendToPlayer(player_id, {
              type: "error",
              message: "You are not in this room",
            });
            break;
          }

          // Re-register the new socket
          playerSockets.set(player_id, ws);
          broadcastOnlineCount();
          console.log(`  🔄 ${playerInRoom.name} reconnected to ${room_id}`);

          // Re-send full game state so the client can restore the correct screen
          sendToPlayer(player_id, {
            type: "game_state",
            room_id: room.room_id,
            phase: room.phase,
            current_turn: room.current_turn,
            current_mode: room.current_mode,
            current_question: room.current_question,
            players: room.players.map((p) => ({ id: p.id, name: p.name })),
            answer: room.player1_answer,
          });
          break;
        }
      }
    } catch (error) {
      console.error("Handler error:", error);
    }
  });

  // Mark connection alive for heartbeat tracking
  (ws).isAlive = true;
  ws.on("pong", () => { (ws).isAlive = true; });

  ws.on("close", async () => {
    console.log("✗ Client Disconnected");
    try {
      for (const [playerId, socket] of playerSockets.entries()) {
        if (socket === ws) {
          playerSockets.delete(playerId);
          broadcastOnlineCount();

          if (!redisReady) {
            for (const [roomId, data] of memStore.rooms.entries()) {
              const room = JSON.parse(data);
              if (room.players.some((p) => p.id === playerId)) {
                room.players = room.players.filter((p) => p.id !== playerId);
                if (room.players.length > 0) {
                  await saveRoom(room);
                  broadcastToRoom(room, {
                    type: "player_quit",
                    message: "Other player disconnected",
                  });
                } else {
                  await deleteRoom(room.room_id);
                }
              }
            }
          } else {
            // Scan Redis for any room containing this player
            let cursor = "0";
            do {
              const result = await redisClient.scan(cursor, {
                MATCH: "room:*",
                COUNT: 100,
              });
              cursor = String(result.cursor);
              for (const key of result.keys) {
                const data = await redisClient.get(key);
                if (!data) continue;
                const room = JSON.parse(data);
                if (room.players.some((p) => p.id === playerId)) {
                  room.players = room.players.filter((p) => p.id !== playerId);
                  if (room.players.length > 0) {
                    await saveRoom(room);
                    broadcastToRoom(room, {
                      type: "player_quit",
                      message: "Other player disconnected",
                    });
                  } else {
                    await deleteRoom(room.room_id);
                  }
                }
              }
            } while (cursor !== "0");
          }
          break;
        }
      }
    } catch (err) {
      console.error("Disconnect cleanup error:", err);
    }
  });

  ws.on("error", (error) => console.error("WebSocket error:", error));
});



// POST /profile/update
app.post("/profile/update", async (req, res) => {
  try {
    const { player_id, name } = req.body;
    if (!player_id || !name) {
      return res.status(400).json({ error: "Missing player_id or name" });
    }
    const cleanName = String(name).slice(0, 30);
    const posts = await getCommunityPosts();
    let updated = false;
    const newPosts = posts.map(p => {
      if (p.author_id === player_id && p.author !== cleanName) {
        updated = true;
        return { ...p, author: cleanName };
      }
      return p;
    });
    if (updated) {
      await saveCommunityPosts(newPosts);
      console.log(`✏️ Updated author name to "${cleanName}" for player ${player_id}`);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /profile/sync
app.post("/profile/sync", (req, res) => {
  try {
    const { player_id, name, bio, pic, interests, played_since, gamesPlayed } = req.body;
    if (!player_id) return res.status(400).json({ error: "Missing player_id" });

    const existing = profileStore.get(player_id) ?? {};
    if (name !== undefined) existing.name = String(name).slice(0, 30);
    if (bio !== undefined) existing.bio = String(bio).slice(0, 80);
    if (pic !== undefined) existing.pic = pic;
    if (interests !== undefined) existing.interests = interests;
    if (played_since !== undefined) existing.played_since = played_since;
    if (gamesPlayed !== undefined) existing.gamesPlayed = gamesPlayed;
    profileStore.set(player_id, existing);
    saveProfiles();

    const reactionCount = existing.reactions
      ? Object.values(existing.reactions).reduce((sum, c) => sum + c, 0)
      : 0;

    res.json({
      ok: true,
      reactions: existing.reactions ?? {},
      reactionCount,
      played_since: existing.played_since ?? null,
      gamesPlayed: existing.gamesPlayed ?? 0,
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

function getPlayStyle(reactions = {}) {
  const entries = Object.entries(reactions).filter(([, c]) => c > 0);
  if (entries.length === 0) return "Rising Star";
  const top = entries.sort(([, a], [, b]) => b - a)[0][0];
  const map = {
    "🔥": "Hot Player",
    "😂": "Funny Player",
    "😍": "Heartthrob",
    "😮": "Shocking Player",
    "💀": "Savage Player",
    "😢": "Emotional Player",
    "🎉": "Life of the Party",
    "👏": "Respected Player",
  };
  return map[top] ?? "Rising Star";
}

// GET /profile/:player_id
app.get("/profile/:player_id", (req, res) => {
  try {
    const { player_id } = req.params;
    const data = profileStore.get(player_id);
    if (!data) return res.status(404).json({ error: "Profile not found" });
    const reactions = data.reactions ?? {};
    const reactionCount = Object.values(reactions).reduce(
      (sum, c) => sum + c,
      0,
    );
    const gamesPlayed = data.gamesPlayed ?? 0;
    const level = Math.max(1, Math.floor(gamesPlayed / 10) + 1);
    res.json({
      name: data.name ?? "Unknown",
      bio: data.bio ?? "",
      pic: data.pic ?? null,
      interests: data.interests ?? [],
      reactions,
      reactionCount,
      played_since: data.played_since ?? null,
      playStyle: getPlayStyle(data.reactions),
      gamesPlayed,
      level,
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Upload endpoint ──────────────────────────────────────────────────────────

app.post("/upload", (req, res) => {
  try {
    const { base64, filename } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ error: "Missing base64 or filename" });
    }

    let ext = "jpg";
    let buffer;
    if (base64.startsWith("data:")) {
      const matches = base64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: "Invalid base64 image" });
      }
      ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(base64, "base64");
    }

    const safeName = `${filename.replace(/[^a-zA-Z0-9_-]/g, "")}-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error("Upload write error:", err);
        return res.status(500).json({ error: "Failed to save file" });
      }
      console.log(`  📤 Uploaded: ${safeName}`);
      res.json({ url: `/uploads/${safeName}` });
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Community REST API ───────────────────────────────────────────────────────

const POSTS_KEY = "community:posts";
const POSTS_MAX = 200; // keep last 200 posts

async function getCommunityPosts() {
  if (!redisReady) {
    return memStore.communityPosts;
  }
  const data = await redisClient.get(POSTS_KEY);
  return data ? JSON.parse(data) : [];
}

async function saveCommunityPosts(posts) {
  if (!redisReady) {
    memStore.communityPosts = posts;
    return;
  }
  await redisClient.set(POSTS_KEY, JSON.stringify(posts));
}

// GET /community/posts
app.get("/community/posts", async (req, res) => {
  try {
    const { player_id } = req.query;
    const posts = await getCommunityPosts();
    const mappedPosts = posts.map((p) => {
      const likedBy = p.liked_by || [];
      const authorProfile = profileStore.get(p.author_id);
      return {
        ...p,
        likedByMe: player_id ? likedBy.includes(player_id) : false,
        profilePic: authorProfile?.pic ?? null,
      };
    });
    res.json({ posts: mappedPosts });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /community/posts
app.post("/community/posts", async (req, res) => {
  try {
    const { author, type, text, author_id } = req.body;
    if (!author || !text || !["truth", "dare"].includes(type)) {
      return res.status(400).json({ error: "Invalid post data" });
    }
    const authorProfile = profileStore.get(author_id);
    const post = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author: String(author).slice(0, 30),
      author_id: String(author_id ?? "").slice(0, 40),
      type,
      text: String(text).slice(0, 300),
      likes: 0,
      liked_by: [],
      createdAt: Date.now(),
      profilePic: authorProfile?.pic ?? null,
    };
    const posts = await getCommunityPosts();
    posts.unshift(post);
    if (posts.length > POSTS_MAX) posts.length = POSTS_MAX;
    await saveCommunityPosts(posts);
    console.log(`📣 Community post by ${author}: "${post.text.slice(0, 40)}"`);
    res.json({ post });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /community/posts/:id/like
app.post("/community/posts/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { player_id } = req.body;
    if (!player_id) {
      return res.status(400).json({ error: "Missing player_id" });
    }
    const posts = await getCommunityPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Post not found" });

    const post = posts[idx];
    if (!post.liked_by) {
      post.liked_by = [];
    }

    const likedIdx = post.liked_by.indexOf(player_id);
    let likedByMe = false;

    if (likedIdx === -1) {
      post.liked_by.push(player_id);
      post.likes = (post.likes ?? 0) + 1;
      likedByMe = true;
    } else {
      post.liked_by.splice(likedIdx, 1);
      post.likes = Math.max(0, (post.likes ?? 0) - 1);
      likedByMe = false;
    }

    await saveCommunityPosts(posts);
    res.json({ likes: post.likes, likedByMe });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Players search ───────────────────────────────────────────────────────────

// GET /players/search?query=...&player_id=... — search players by name
app.get("/players/search", (req, res) => {
  try {
    const { query, player_id } = req.query;
    if (!query || !player_id) {
      return res.status(400).json({ error: "Missing required params" });
    }
    const q = query.toLowerCase();
    const myFriends = getFriendIds(player_id);
    const mySent = [];
    for (const [, r] of friendReqStore) {
      if (r.from === player_id && r.status === "pending") mySent.push(r.to);
    }
    const results = [];
    for (const [pid, p] of profileStore) {
      if (pid === player_id) continue;
      if (!p?.name?.toLowerCase().includes(q)) continue;
      results.push({
        id: pid,
        name: p.name,
        pic: p.pic ?? null,
        isFriend: myFriends.has(pid),
        requestSent: mySent.includes(pid),
      });
      if (results.length >= 20) break;
    }
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Friends & Notifications REST endpoints ───────────────────────────────────

// POST /friends/request — send a friend request
app.post("/friends/request", (req, res) => {
  try {
    const { from_id, from_name, from_pic, to_id } = req.body;
    if (!from_id || !to_id || !from_name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (from_id === to_id) {
      return res.status(400).json({ error: "Cannot friend yourself" });
    }
    if (areFriends(from_id, to_id)) {
      return res.json({ ok: true, status: "already_friends" });
    }
    // Check for existing pending request
    for (const [reqId, r] of friendReqStore) {
      if (r.from === from_id && r.to === to_id && r.status === "pending") {
        return res.json({ ok: true, status: "already_requested" });
      }
      if (r.from === to_id && r.to === from_id && r.status === "pending") {
        // Mutual — auto-accept
        r.status = "accepted";
        addFriendPair(from_id, to_id);
        createNotification(from_id, to_id, from_name, from_pic, "friend_request_accepted", `${from_name} accepted your friend request`);
        createNotification(to_id, from_id, from_name, from_pic, "friend_request_accepted", `${from_name} accepted your friend request`);
        return res.json({ ok: true, status: "mutual" });
      }
    }
    const requestId = `freq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const request = { id: requestId, from: from_id, to: to_id, fromName: from_name, fromPic: from_pic ?? null, status: "pending", createdAt: Date.now() };
    friendReqStore.set(requestId, request);

    // Notify the receiver
    createNotification(to_id, from_id, from_name, from_pic, "friend_request", `${from_name} sent you a friend request`);
    res.json({ ok: true, status: "sent" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /friends/accept — accept a friend request
app.post("/friends/accept", (req, res) => {
  try {
    const { request_id, actor_id } = req.body;
    const request = friendReqStore.get(request_id);
    if (!request || request.to !== actor_id || request.status !== "pending") {
      return res.status(400).json({ error: "Invalid request" });
    }
    request.status = "accepted";
    addFriendPair(request.from, request.to);

    // Notify the requester
    const requesterName = profileStore.get(request.from)?.name ?? request.fromName;
    createNotification(request.from, request.to, requesterName, null, "friend_request_accepted", `${requesterName} accepted your friend request`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /friends/reject — reject a friend request
app.post("/friends/reject", (req, res) => {
  try {
    const { request_id, actor_id } = req.body;
    const request = friendReqStore.get(request_id);
    if (!request || request.to !== actor_id || request.status !== "pending") {
      return res.status(400).json({ error: "Invalid request" });
    }
    request.status = "rejected";

    // Notify the requester that their request was rejected
    createNotification(request.from, request.to, request.fromName, null, "friend_request_rejected", `${request.fromName} declined your friend request`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /friends/remove — remove a friend
app.post("/friends/remove", (req, res) => {
  try {
    const { player_id, friend_id } = req.body;
    if (!player_id || !friend_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const setA = friendStore.get(player_id);
    const setB = friendStore.get(friend_id);
    if (setA) setA.delete(friend_id);
    if (setB) setB.delete(player_id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /friends/:player_id — get friends list and pending requests
app.get("/friends/:player_id", (req, res) => {
  try {
    const { player_id } = req.params;
    const friendIds = getFriendIds(player_id);
    const friends = [];
    for (const fid of friendIds) {
      const p = profileStore.get(fid);
      friends.push({ id: fid, name: p?.name ?? "Unknown", pic: p?.pic ?? null });
    }
    const requests = [];
    const sent = [];
    for (const [, r] of friendReqStore) {
      if (r.status !== "pending") continue;
      if (r.to === player_id) {
        const p = profileStore.get(r.from);
        requests.push({ id: r.id, from: r.from, fromName: p?.name ?? r.fromName, fromPic: p?.pic ?? r.fromPic, createdAt: r.createdAt });
      }
      if (r.from === player_id) {
        sent.push(r.to);
      }
    }
    res.json({ friends, requests, sent });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /notifications/:player_id — get notifications
app.get("/notifications/:player_id", (req, res) => {
  try {
    const { player_id } = req.params;
    const list = notificationStore.get(player_id) || [];
    res.json({ notifications: list });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /notifications/read — mark all as read
app.post("/notifications/read", (req, res) => {
  try {
    const { player_id } = req.body;
    const list = notificationStore.get(player_id);
    if (list) {
      list.forEach(n => { n.read = true; });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n✓ Server running on ws://${HOST}:${PORT}${SOCKET_PATH}\n`);
});
