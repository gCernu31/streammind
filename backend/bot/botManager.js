/**
 * StreaMindAI — Bot Manager
 *
 * Gestisce:
 *  - Connessioni IRC multi-canale via tmi.js
 *  - Risposte AI con Gemini 2.5 Flash
 *  - Limiti per utente (sub/non-sub) e per canale (sessione + mensile)
 *  - FOMO messages al raggiungimento dei limiti
 *  - Memoria automatica ogni 20 messaggi
 *  - Song Request con coda Spotify
 *  - Eventi Twitch: tmi.js (sub, cheer, raid) + EventSub (follow, hype_train)
 *  - Anti-spam 30s per evento per utente
 *  - Shoutout automatico post-raid
 *
 * Env vars:
 *   TWITCH_BOT_USERNAME
 *   TWITCH_BOT_OAUTH
 *   TWITCH_BOT_USER_ID     — override opzionale (se omesso, risolto automaticamente all'avvio)
 *   TWITCH_CLIENT_ID       — per EventSub
 *   TWITCH_CLIENT_SECRET   — per EventSub
 *   APP_URL                — URL pubblico per webhook EventSub
 *   EVENTSUB_SECRET        — segreto firma webhook
 *   GEMINI_API_KEY
 *   (Spotify/Discord: credenziali per-streamer salvate in bot_configs, non env vars)
 */

import tmi    from 'tmi.js';
import axios  from 'axios';
import crypto from 'crypto';
import pool   from '../db.js';
import { generateBotPrompt } from '../services/promptBuilder.js';
import { getLimits }          from '../config/planLimits.js';

// ─── Costanti ─────────────────────────────────────────────────────────────────
const EVENTSUB_SECRET   = process.env.EVENTSUB_SECRET || 'streamindai-eventsub-secret';
const MEMORY_BATCH_SIZE = 20;
const EVENT_COOLDOWN_MS = 30_000;

const MSG_USER_LIMIT    = "Hai raggiunto il limite di messaggi per stasera! Chiedi allo streamer di aumentare i limiti o supporta il canale con una sub 🎵";
const MSG_CHANNEL_LIMIT = "Il bot ha raggiunto il limite di messaggi per stasera. Scopri i piani superiori su streamindai.com 🚀";

// ─── Stato in-memory ──────────────────────────────────────────────────────────

// Contatori sessione canale: streamerId → { date: string, count: number }
const sessionCounters = new Map();

// Buffer chat per analisi memoria: streamerId → string[]
const memoryBuffers = new Map();

// Code song request: streamerId → { enabled: boolean, songs: [], srCounts: Map<username, count> }
const songQueues = new Map();

// Anti-spam eventi: `${streamerId}:${type}:${username}` → timestamp
const eventCooldowns = new Map();

// Twitch app token (per EventSub)
let _appToken = null, _appTokenExp = 0, _botUserId = null;

// ─── Helpers generici ─────────────────────────────────────────────────────────

const truncate = (t, n = 400) => t && t.length > n ? t.slice(0, n - 1) + '…' : (t || null);
const dateStr  = ()           => new Date().toISOString().slice(0, 10);

function isSubVip(tags) {
  return !!(tags.subscriber || tags.mod || tags.vip || tags.badges?.broadcaster);
}

function parseJson(v, fallback) {
  if (!v) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

function checkEventCooldown(streamerId, type, username) {
  const key = `${streamerId}:${type}:${username}`;
  const last = eventCooldowns.get(key) ?? 0;
  if (Date.now() - last < EVENT_COOLDOWN_MS) return false;
  eventCooldowns.set(key, Date.now());
  return true;
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function gemini(system, user, maxTokens = 1024, thinkingBudget = 512) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const r = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        system_instruction: { parts: [{ text: system }] },
        contents:           [{ role: 'user', parts: [{ text: user }] }],
        generationConfig:   { temperature: 0.85, maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget } },
      },
      { timeout: 20_000 }
    );
    return r.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch (e) {
    console.error('[Bot] Gemini:', e.response?.data?.error?.message ?? e.message);
    return null;
  }
}

// ─── Twitch app token (EventSub) ──────────────────────────────────────────────

async function getAppToken() {
  if (_appToken && Date.now() < _appTokenExp - 60_000) return _appToken;
  const cid = process.env.TWITCH_CLIENT_ID;
  const csec = process.env.TWITCH_CLIENT_SECRET;
  if (!cid || !csec) return null;
  try {
    const r = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: { client_id: cid, client_secret: csec, grant_type: 'client_credentials' },
    });
    _appToken    = r.data.access_token;
    _appTokenExp = Date.now() + r.data.expires_in * 1000;
    return _appToken;
  } catch (e) {
    console.error('[EventSub] app token:', e.message);
    return null;
  }
}

async function getBotUserId() {
  if (_botUserId) return _botUserId;
  if (process.env.TWITCH_BOT_USER_ID) return (_botUserId = process.env.TWITCH_BOT_USER_ID);
  const token = await getAppToken();
  const cid   = process.env.TWITCH_CLIENT_ID;
  const uname = process.env.TWITCH_BOT_USERNAME;
  if (!token || !cid || !uname) return null;
  try {
    const r = await axios.get(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(uname)}`, {
      headers: { 'Client-ID': cid, Authorization: `Bearer ${token}` },
    });
    _botUserId = r.data?.data?.[0]?.id ?? null;
    if (_botUserId) console.log(`[Bot] Twitch bot user ID risolto: ${_botUserId}`);
    return _botUserId;
  } catch (e) {
    console.error('[EventSub] bot user ID:', e.message);
    return null;
  }
}

// ─── EventSub ─────────────────────────────────────────────────────────────────

const EVENTSUB_SUBS = [
  { type: 'channel.follow',            ver: '2', cond: 'follow'   },
  { type: 'channel.subscribe',         ver: '1', cond: 'standard' },
  { type: 'channel.subscription.gift', ver: '1', cond: 'standard' },
  { type: 'channel.cheer',             ver: '1', cond: 'standard' },
  { type: 'channel.hype_train.begin',  ver: '1', cond: 'standard' },
  { type: 'channel.raid',              ver: '1', cond: 'raid'     },
  { type: 'stream.online',             ver: '1', cond: 'standard' },
];

const EVENTSUB_PLAN_MAP = {
  'channel.follow':            'follow',
  'channel.subscribe':         'subscribe',
  'channel.subscription.gift': 'gift_sub',
  'channel.cheer':             'cheer',
  'channel.hype_train.begin':  'hype_train',
  'channel.raid':              'raid',
};

async function registerEventSub(broadcasterId, streamer) {
  const token  = await getAppToken();
  const cid    = process.env.TWITCH_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!token || !cid || !appUrl) return;

  const callback = `${appUrl}/webhooks/twitch-eventsub`;
  const limits   = getLimits(streamer.subscription_plan);
  const bid      = await getBotUserId();

  for (const sub of EVENTSUB_SUBS) {
    const planEvent = EVENTSUB_PLAN_MAP[sub.type];
    if (planEvent && !limits.events.includes(planEvent)) continue;

    let condition;
    if (sub.cond === 'follow') {
      if (!bid) continue;
      condition = { broadcaster_user_id: broadcasterId, moderator_user_id: bid };
    } else if (sub.cond === 'raid') {
      condition = { to_broadcaster_user_id: broadcasterId };
    } else {
      condition = { broadcaster_user_id: broadcasterId };
    }

    try {
      await axios.post(
        'https://api.twitch.tv/helix/eventsub/subscriptions',
        {
          type: sub.type, version: sub.ver, condition,
          transport: { method: 'webhook', callback, secret: EVENTSUB_SECRET },
        },
        { headers: { 'Client-ID': cid, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      if (e.response?.status !== 409) {
        console.warn(`[EventSub] ${sub.type} @${streamer.twitch_username}: ${e.response?.data?.message ?? e.message}`);
      }
    }
  }
  console.log(`[EventSub] Registrato per @${streamer.twitch_username}`);
}

export function verifyEventSubSignature(messageId, timestamp, rawBody, sig) {
  const hmac = crypto.createHmac('sha256', EVENTSUB_SECRET)
                     .update(messageId + timestamp + rawBody)
                     .digest('hex');
  return sig === `sha256=${hmac}`;
}

// ─── Spotify ──────────────────────────────────────────────────────────────────

async function refreshSpotifyToken(streamerId, refreshToken, clientId, clientSecret) {
  if (!clientId || !clientSecret) return null;
  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const r = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
      { headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token, expires_in } = r.data;
    const expiresAt = Date.now() + expires_in * 1000;
    await pool.query(
      'UPDATE bot_configs SET spotify_access_token=$1, spotify_token_expires_at=$2 WHERE streamer_id=$3',
      [access_token, expiresAt, streamerId]
    );
    return access_token;
  } catch (e) {
    console.error('[Spotify] refresh:', e.response?.data ?? e.message);
    return null;
  }
}

async function getSpotifyToken(streamer) {
  if (!streamer.spotify_access_token) return null;
  const exp = streamer.spotify_token_expires_at;
  if (!exp || Date.now() < Number(exp) - 60_000) return streamer.spotify_access_token;
  return refreshSpotifyToken(
    streamer.streamer_id,
    streamer.spotify_refresh_token,
    streamer.spotify_client_id,
    streamer.spotify_client_secret
  );
}

async function spotifySearch(query, token) {
  try {
    const r = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params:  { q: query, type: 'track', limit: 1 },
    });
    const t = r.data?.tracks?.items?.[0];
    if (!t) return null;
    return { uri: t.uri, name: t.name, artist: t.artists.map(a => a.name).join(', ') };
  } catch (e) {
    console.error('[Spotify] search:', e.response?.data ?? e.message);
    return null;
  }
}

async function spotifyQueueAdd(uri, token) {
  try {
    await axios.post(
      `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
      null, { headers: { Authorization: `Bearer ${token}` } }
    );
    return 'ok';
  } catch (e) {
    const s = e.response?.status;
    if (s === 403) return 'premium_required';
    if (s === 404) return 'no_device';
    console.error('[Spotify] queue:', e.response?.data ?? e.message);
    return 'error';
  }
}

// ─── Rate limits ──────────────────────────────────────────────────────────────

function getSessionCount(streamerId) {
  const d = dateStr();
  let c = sessionCounters.get(streamerId);
  if (!c || c.date !== d) { c = { date: d, count: 0 }; sessionCounters.set(streamerId, c); }
  return c;
}

function resetSessionCount(streamerId) {
  sessionCounters.set(streamerId, { date: dateStr(), count: 0 });
}

async function getUserDailyCount(streamerId, username) {
  const r = await pool.query(
    'SELECT count FROM bot_daily_usage WHERE streamer_id=$1 AND username=$2 AND usage_date=$3',
    [streamerId, username, dateStr()]
  );
  return parseInt(r.rows[0]?.count ?? 0);
}

async function incrementUserDailyCount(streamerId, username) {
  await pool.query(
    `INSERT INTO bot_daily_usage (streamer_id, username, usage_date, count)
     VALUES ($1,$2,$3,1)
     ON CONFLICT (streamer_id, username, usage_date)
     DO UPDATE SET count = bot_daily_usage.count + 1`,
    [streamerId, username, dateStr()]
  );
}

// Restituisce il limite utente in base al piano + configurazione streamer
function getUserLimit(streamer, isSub) {
  const limits = getLimits(streamer.subscription_plan);
  if (isSub) {
    const custom  = streamer.user_msg_subvip;
    const planDef = limits.userLimits?.subVip?.default ?? -1;
    return custom != null ? custom : planDef;
  } else {
    const custom  = streamer.user_msg_nonsub;
    const planDef = limits.userLimits?.nonSub?.default ?? 3;
    return custom != null ? custom : planDef;
  }
}

function getSongLimit(streamer, isSub) {
  const limits = getLimits(streamer.subscription_plan);
  if (isSub) {
    const custom  = streamer.song_req_subvip;
    const planDef = limits.userLimits?.songSubVip?.default ?? 3;
    return custom != null ? custom : planDef;
  } else {
    const custom  = streamer.song_req_nonsub;
    const planDef = limits.userLimits?.songNonSub?.default ?? 1;
    return custom != null ? custom : planDef;
  }
}

// ─── Memoria automatica ───────────────────────────────────────────────────────

function bufferChatMessage(streamerId, username, message) {
  if (!memoryBuffers.has(streamerId)) memoryBuffers.set(streamerId, []);
  const buf = memoryBuffers.get(streamerId);
  buf.push(`${username}: ${message}`);
  return buf.length;
}

async function maybeAnalyzeMemory(streamerId, streamer) {
  const buf = memoryBuffers.get(streamerId) ?? [];
  if (buf.length < MEMORY_BATCH_SIZE) return;
  const snapshot = buf.splice(0, MEMORY_BATCH_SIZE);

  const limits = getLimits(streamer.subscription_plan);
  if (!limits.memory) return;

  const system = `Sei un sistema di memoria per un bot Twitch.
Analizza questi ${MEMORY_BATCH_SIZE} messaggi di chat e identifica 0-3 informazioni memorabili (inside joke, promesse, eventi, info su utenti, gioco in corso).
Rispondi SOLO con JSON array: [{"category":"utente|inside_joke|evento|promessa|gioco","subject":"breve","content":"descrizione","game_context":null}]
Se non ci sono informazioni rilevanti rispondi con [].`;

  try {
    const raw = await gemini(system, snapshot.join('\n'), 512, 256);
    if (!raw) return;
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return;
    const memories = JSON.parse(match[0]);
    if (!Array.isArray(memories)) return;

    for (const m of memories) {
      if (!m.content?.trim()) continue;
      await pool.query(
        `INSERT INTO bot_memories (streamer_id, category, subject, content, game_context)
         VALUES ($1,$2,$3,$4,$5)`,
        [streamerId, m.category ?? null, m.subject?.trim() ?? null, m.content.trim(), m.game_context ?? null]
      );
      console.log(`🧠 Memoria salvata: [${m.category}] ${m.subject} (streamer: ${streamer.twitch_username})`);
    }
  } catch (e) {
    console.error('[Bot] Memory analysis:', e.message);
  }
}

// ─── Messaggi evento ──────────────────────────────────────────────────────────

async function buildEventMessage(streamer, eventType, data) {
  const limits = getLimits(streamer.subscription_plan);

  if (!limits.customEventMessages) {
    const msgs = {
      follow:    `@${data.username} è appena entrato nella community! Benvenuto 👋`,
      subscribe: `Grazie per la sub @${data.username}! ❤️` + (data.months > 1 ? ` ${data.months} mesi consecutivi, leggendario!` : ''),
      gift_sub:  `@${data.gifter} ha regalato ${data.total ?? 1} sub alla community! 🎁`,
      cheer:     `@${data.username} ha donato ${data.bits} bit! 💎 Grazie mille!`,
      hype_train:`🚂 Hype Train in partenza! Andiamo alla grande!`,
      raid:      `@${data.from} ha raidato con ${data.viewers} viewer! Benvenuti tutti 🎉`,
    };
    return msgs[eventType] ?? null;
  }

  const descriptions = {
    follow:    `Nuovo follower: @${data.username}`,
    subscribe: `Nuova sub da @${data.username}${data.months > 1 ? ` (${data.months} mesi)` : ''}`,
    gift_sub:  `@${data.gifter} ha regalato ${data.total ?? 1} sub`,
    cheer:     `@${data.username} ha donato ${data.bits} bit`,
    hype_train:`Hype train appena iniziato`,
    raid:      `@${data.from} ha raidato con ${data.viewers} viewer`,
  };
  const desc = descriptions[eventType];
  if (!desc) return null;

  const system = `Sei ${streamer.bot_name || 'StreamBot'}, il bot del canale Twitch di ${streamer.creator_name || streamer.twitch_username}.
${streamer.bot_personality || ''}
Scrivi un messaggio breve (max 200 caratteri) in italiano per questo evento: ${desc}.
Rispondi SOLO con il messaggio.`;

  const raw = await gemini(system, desc, 256, 128);
  return truncate(raw, 200);
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function loadActiveStreamers() {
  const { rows } = await pool.query(`
    SELECT
      s.id                        AS streamer_id,
      s.twitch_id,
      s.twitch_username,
      s.subscription_plan,
      s.monthly_message_count,
      s.monthly_reset_date,
      bc.spotify_client_id,
      bc.spotify_client_secret,
      bc.spotify_access_token,
      bc.spotify_refresh_token,
      bc.spotify_token_expires_at,
      bc.discord_bot_token,
      bc.bot_name,
      bc.creator_name,
      bc.bot_personality,
      bc.custom_commands,
      bc.user_msg_nonsub,
      bc.user_msg_subvip,
      bc.song_req_nonsub,
      bc.song_req_subvip
    FROM streamers s
    JOIN bot_configs bc ON bc.streamer_id = s.id
    WHERE s.subscription_status IN ('active', 'trialing', 'cancelling')
      AND s.twitch_username IS NOT NULL
      AND s.twitch_username <> ''
  `);
  return rows;
}

async function resetMonthlyIfNeeded(streamer) {
  const now       = new Date();
  const resetDate = streamer.monthly_reset_date ? new Date(streamer.monthly_reset_date) : now;
  const stale     = resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear();
  if (!stale) return streamer.monthly_message_count;
  await pool.query(
    'UPDATE streamers SET monthly_message_count=0, monthly_reset_date=CURRENT_DATE WHERE id=$1',
    [streamer.streamer_id]
  );
  streamer.monthly_message_count = 0;
  return 0;
}

// ─── BotManager ───────────────────────────────────────────────────────────────

class BotManager {
  constructor() {
    this.client       = null;
    this.channelMap   = {};   // lowercase channel → streamer row
    this.connected    = false;
    this._restarting  = false;
  }

  // ── Avvio ──────────────────────────────────────────────────────────────────

  async start() {
    if (this._restarting) return;

    const username = process.env.TWITCH_BOT_USERNAME;
    const oauth    = process.env.TWITCH_BOT_OAUTH;

    if (!username || !oauth) {
      console.warn('[Bot] TWITCH_BOT_USERNAME / TWITCH_BOT_OAUTH mancanti — bot non avviato.');
      return;
    }

    let streamers;
    try { streamers = await loadActiveStreamers(); }
    catch (e) { console.error('[Bot] loadActiveStreamers:', e.message); this._scheduleRestart(); return; }

    streamers.forEach(s => {
      const ch = s.twitch_username.toLowerCase();
      this.channelMap[ch] = s;
      if (!songQueues.has(s.streamer_id)) {
        songQueues.set(s.streamer_id, { enabled: true, songs: [], srCounts: new Map() });
      }
    });

    const channels = streamers.map(s => s.twitch_username.toLowerCase());
    console.log(`[Bot] Canali all'avvio: ${channels.length}`);

    this.client = new tmi.Client({
      options:  { debug: false },
      identity: { username, password: oauth },
      channels: channels.length > 0 ? channels : [username.toLowerCase()],
    });

    this.client.on('connected', (addr, port) => {
      this.connected = true;
      console.log(`[Bot] Connesso a ${addr}:${port} — ${channels.length} canali`);
    });

    this.client.on('disconnected', reason => {
      this.connected = false;
      console.warn('[Bot] Disconnesso:', reason);
      this._scheduleRestart();
    });

    this.client.on('message', (channel, tags, message, self) => {
      if (self) return;
      this._handleMessage(channel, tags, message)
          .catch(e => console.error('[Bot] handleMessage:', e.message));
    });

    // ── tmi.js events ───────────────────────────────────────────────────────

    this.client.on('subscription', (channel, username, method, msg, tags) => {
      this._handleTmiEvent(channel, 'subscribe', { username, months: method?.prime ? 1 : 1 });
    });

    this.client.on('resub', (channel, username, months, msg, tags) => {
      this._handleTmiEvent(channel, 'subscribe', { username, months });
    });

    this.client.on('subgift', (channel, gifter, streakMonths, recipient, methods, tags) => {
      this._handleTmiEvent(channel, 'gift_sub', { gifter, total: 1 });
    });

    this.client.on('submysterygift', (channel, username, numbOfSubs, methods, tags) => {
      this._handleTmiEvent(channel, 'gift_sub', { gifter: username, total: numbOfSubs });
    });

    this.client.on('cheer', (channel, tags, message) => {
      const username = tags.username || tags['display-name'] || 'utente';
      const bits     = parseInt(tags.bits ?? 0);
      this._handleTmiEvent(channel, 'cheer', { username, bits });
    });

    this.client.on('raided', (channel, username, viewers) => {
      this._handleTmiEvent(channel, 'raid', { from: username, viewers: parseInt(viewers ?? 0) });
    });

    try {
      await this.client.connect();
    } catch (e) {
      console.error('[Bot] Connessione fallita:', e.message);
      this._scheduleRestart();
      return;
    }

    // Risolve l'ID Twitch del bot al primo avvio (necessario per channel.follow EventSub)
    if (process.env.TWITCH_CLIENT_ID) {
      getBotUserId().catch(e => console.error('[Bot] getBotUserId:', e.message));
    }

    // Registra EventSub per tutti i canali attivi
    if (process.env.TWITCH_CLIENT_ID && process.env.APP_URL) {
      for (const s of streamers) {
        if (s.twitch_id) {
          registerEventSub(s.twitch_id, s).catch(e =>
            console.error(`[EventSub] init @${s.twitch_username}:`, e.message)
          );
        }
      }
    }

    setInterval(() => this._syncChannels(), 5 * 60 * 1000);
  }

  _scheduleRestart(delayMs = 30_000) {
    if (this._restarting) return;
    this._restarting = true;
    console.log(`[Bot] Riavvio tra ${delayMs / 1000}s...`);
    setTimeout(() => {
      this._restarting = false;
      this.channelMap  = {};
      this.client      = null;
      this.start();
    }, delayMs);
  }

  // ── Sincronizzazione canali ───────────────────────────────────────────────

  async _syncChannels() {
    if (!this.connected) return;
    try {
      const streamers = await loadActiveStreamers();
      const newMap = {};
      streamers.forEach(s => { newMap[s.twitch_username.toLowerCase()] = s; });

      for (const [ch, s] of Object.entries(newMap)) {
        if (!this.channelMap[ch]) {
          try {
            await this.client.join(ch);
            this.channelMap[ch] = s;
            if (!songQueues.has(s.streamer_id)) {
              songQueues.set(s.streamer_id, { enabled: true, songs: [], srCounts: new Map() });
            }
            console.log(`[Bot] Unito a #${ch}`);
            if (s.twitch_id && process.env.TWITCH_CLIENT_ID && process.env.APP_URL) {
              registerEventSub(s.twitch_id, s).catch(() => {});
            }
          } catch (e) {
            console.warn(`[Bot] Join #${ch}:`, e.message);
          }
        } else {
          this.channelMap[ch] = s; // aggiorna dati (piano, contatori, ecc.)
        }
      }

      for (const ch of Object.keys(this.channelMap)) {
        if (!newMap[ch]) {
          try { await this.client.part(ch); } catch {}
          delete this.channelMap[ch];
          console.log(`[Bot] Abbandonato #${ch} (piano scaduto)`);
        }
      }
    } catch (e) {
      console.error('[Bot] _syncChannels:', e.message);
    }
  }

  // Unisce immediatamente un canale (chiamato dopo checkout Stripe)
  async joinChannel(twitchUsername) {
    if (!this.connected || !this.client) return;
    const ch = twitchUsername.toLowerCase();
    if (this.channelMap[ch]) return;
    try {
      const streamers = await loadActiveStreamers();
      const s = streamers.find(x => x.twitch_username.toLowerCase() === ch);
      if (!s) return;
      await this.client.join(ch);
      this.channelMap[ch] = s;
      if (!songQueues.has(s.streamer_id)) {
        songQueues.set(s.streamer_id, { enabled: true, songs: [], srCounts: new Map() });
      }
      console.log(`[Bot] Unito a #${ch} (nuovo abbonamento)`);
      if (s.twitch_id && process.env.TWITCH_CLIENT_ID && process.env.APP_URL) {
        registerEventSub(s.twitch_id, s).catch(() => {});
      }
    } catch (e) {
      console.error(`[Bot] joinChannel #${ch}:`, e.message);
    }
  }

  // ── Handler messaggi ──────────────────────────────────────────────────────

  async _handleMessage(channel, tags, message) {
    const channelName = channel.replace('#', '').toLowerCase();
    const streamer    = this.channelMap[channelName];
    if (!streamer) return;

    const msg      = message.trim();
    const username = (tags.username || tags['display-name'] || 'utente').toLowerCase();
    const isSub    = isSubVip(tags);

    // Buffer per analisi memoria (tutti i messaggi, non solo comandi)
    const bufLen = bufferChatMessage(streamer.streamer_id, username, msg);
    if (bufLen >= MEMORY_BATCH_SIZE) {
      maybeAnalyzeMemory(streamer.streamer_id, streamer).catch(() => {});
    }

    // 1. Comandi personalizzati statici
    if (await this._handleCustomCommand(channel, streamer, msg)) return;

    // 2. Song request
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.startsWith('!sr ') || lowerMsg === '!sr on' || lowerMsg === '!sr off') {
      await this._handleSongRequest(channel, tags, streamer, msg, username, isSub);
      return;
    }

    // 3. Comando AI principale: !<nome_bot>
    const botCmd = '!' + (streamer.bot_name || 'streambot').toLowerCase().replace(/\s+/g, '');
    if (!lowerMsg.startsWith(botCmd)) return;

    await this._handleBotCommand(channel, tags, streamer, msg, username, isSub, botCmd);
  }

  async _handleCustomCommand(channel, streamer, msg) {
    const cmds = parseJson(streamer.custom_commands, [])
      .filter(c => c.active !== false && c.trigger?.trim() && c.response?.trim());

    for (const cmd of cmds) {
      const trigger = cmd.trigger.trim().toLowerCase();
      if (msg.toLowerCase() === trigger || msg.toLowerCase().startsWith(trigger + ' ')) {
        try { await this.client.say(channel, cmd.response.trim()); } catch {}
        return true;
      }
    }
    return false;
  }

  async _handleBotCommand(channel, tags, streamer, msg, username, isSub, botCmd) {
    const limits = getLimits(streamer.subscription_plan);

    // Reset mensile se necessario
    const monthlyCount = await resetMonthlyIfNeeded(streamer);

    // ── Limite mensile canale ────────────────────────────────────────────────
    if (limits.monthlyMessages !== -1 && monthlyCount >= limits.monthlyMessages) {
      try { await this.client.say(channel, MSG_CHANNEL_LIMIT); } catch {}
      return;
    }

    // ── Limite sessione canale ───────────────────────────────────────────────
    const session = getSessionCount(streamer.streamer_id);
    if (limits.channelMessagesPerSession !== -1 &&
        session.count >= limits.channelMessagesPerSession) {
      try { await this.client.say(channel, MSG_CHANNEL_LIMIT); } catch {}
      return;
    }

    // ── Limite per utente ────────────────────────────────────────────────────
    const userLimit = getUserLimit(streamer, isSub);
    if (userLimit !== -1) {
      const userCount = await getUserDailyCount(streamer.streamer_id, username);
      if (userCount >= userLimit) {
        try { await this.client.say(channel, `@${username} ${MSG_USER_LIMIT}`); } catch {}
        return;
      }
    }

    // ── Genera risposta AI ───────────────────────────────────────────────────
    const question = msg.slice(botCmd.length).trim() || 'Ciao!';
    let systemPrompt;
    try { systemPrompt = await generateBotPrompt(streamer.streamer_id); }
    catch (e) { console.error('[Bot] prompt:', e.message); return; }

    const reply = truncate(await gemini(systemPrompt, question));
    if (!reply) return;

    try {
      await this.client.say(channel, reply);
      console.log(`[Bot] #${channel} @${username}: "${question.slice(0, 40)}" → "${reply.slice(0, 60)}…"`);
    } catch (e) {
      console.error(`[Bot] say() #${channel}:`, e.message);
      return;
    }

    // ── Aggiorna contatori ───────────────────────────────────────────────────
    session.count++;
    await Promise.all([
      incrementUserDailyCount(streamer.streamer_id, username),
      pool.query(
        'UPDATE streamers SET monthly_message_count = monthly_message_count + 1 WHERE id = $1',
        [streamer.streamer_id]
      ),
    ]);
  }

  // ── Song Request ──────────────────────────────────────────────────────────

  async _handleSongRequest(channel, tags, streamer, msg, username, isSub) {
    const limits = getLimits(streamer.subscription_plan);
    if (!limits.songRequest) {
      try { await this.client.say(channel, 'La Song Request non è disponibile nel piano attuale.'); } catch {}
      return;
    }

    const lowerMsg = msg.toLowerCase();
    const isBroadcaster = !!(tags.badges?.broadcaster || tags.username === channel.replace('#', ''));

    // !sr on / !sr off (solo broadcaster)
    if (lowerMsg === '!sr on' || lowerMsg === '!sr off') {
      if (!isBroadcaster) return;
      const q = songQueues.get(streamer.streamer_id);
      if (q) {
        q.enabled = lowerMsg === '!sr on';
        if (!q.enabled) q.songs = [];
      }
      try { await this.client.say(channel, q?.enabled ? '🎵 Song Request abilitata!' : '🔇 Song Request disabilitata.'); } catch {}
      return;
    }

    const q = songQueues.get(streamer.streamer_id);
    if (!q?.enabled) {
      try { await this.client.say(channel, 'La Song Request è momentaneamente disabilitata.'); } catch {}
      return;
    }

    // Limite song request per utente
    const srLimit = getSongLimit(streamer, isSub);
    if (srLimit !== -1) {
      const userSrCount = q.srCounts.get(username) ?? 0;
      if (userSrCount >= srLimit) {
        try { await this.client.say(channel, `@${username} Hai già aggiunto ${srLimit} canzon${srLimit === 1 ? 'e' : 'i'} stasera!`); } catch {}
        return;
      }
    }

    // Cerca su Spotify
    const query = msg.slice(4).trim(); // rimuove "!sr "
    if (!query) {
      try { await this.client.say(channel, '🎵 Uso: !sr Nome Canzone - Artista'); } catch {}
      return;
    }

    const spotifyToken = await getSpotifyToken(streamer);
    if (!spotifyToken) {
      try { await this.client.say(channel, '🎵 Spotify non ancora configurato. Contatta lo streamer!'); } catch {}
      return;
    }

    const track = await spotifySearch(query, spotifyToken);
    if (!track) {
      try { await this.client.say(channel, `@${username} Nessun risultato per "${query}". Prova con un altro titolo!`); } catch {}
      return;
    }

    const result = await spotifyQueueAdd(track.uri, spotifyToken);
    if (result === 'ok') {
      q.songs.push({ username, name: track.name, artist: track.artist });
      const pos = q.songs.length;
      q.srCounts.set(username, (q.srCounts.get(username) ?? 0) + 1);
      try {
        await this.client.say(channel, `🎵 ${track.name} - ${track.artist} aggiunta! @${username} sei il numero ${pos} in lista`);
      } catch {}
    } else if (result === 'no_device') {
      try { await this.client.say(channel, '🎵 Spotify non attivo al momento. Riprova tra poco!'); } catch {}
    } else if (result === 'premium_required') {
      try { await this.client.say(channel, '🎵 Serve Spotify Premium per la coda. Contatta lo streamer!'); } catch {}
    } else {
      try { await this.client.say(channel, `@${username} Errore nell'aggiungere la canzone. Riprova!`); } catch {}
    }
  }

  // ── Eventi tmi.js (sub, cheer, raid) ─────────────────────────────────────

  async _handleTmiEvent(channel, eventType, data) {
    const channelName = channel.replace('#', '').toLowerCase();
    const streamer    = this.channelMap[channelName];
    if (!streamer) return;

    const limits = getLimits(streamer.subscription_plan);
    if (!limits.events.includes(eventType)) return;

    const actorUsername = data.username || data.gifter || data.from || 'utente';
    if (!checkEventCooldown(streamer.streamer_id, eventType, actorUsername)) return;

    // Shoutout automatico dopo raid
    if (eventType === 'raid' && data.from) {
      try { await this.client.say(channel, `/shoutout ${data.from}`); } catch {}
    }

    const msg = await buildEventMessage(streamer, eventType, data);
    if (msg) {
      try { await this.client.say(channel, msg); } catch {}
    }
  }

  // ── EventSub notifications (follow, hype_train, stream.online) ───────────

  async handleEventSubNotification(subscriptionType, event) {
    // Trova il broadcaster nell'event
    const broadcasterId = event.broadcaster_user_id ?? event.to_broadcaster_user_id ?? null;
    if (!broadcasterId) return;

    // Trova lo streamer dalla mappa
    const streamer = Object.values(this.channelMap)
      .find(s => s.twitch_id === broadcasterId || s.twitch_id === String(broadcasterId));
    if (!streamer) return;

    const channel = '#' + streamer.twitch_username.toLowerCase();
    const limits  = getLimits(streamer.subscription_plan);

    if (subscriptionType === 'stream.online') {
      resetSessionCount(streamer.streamer_id);
      const q = songQueues.get(streamer.streamer_id);
      if (q) { q.songs = []; q.srCounts = new Map(); }
      console.log(`[Bot] Stream online: #${streamer.twitch_username} — contatori resettati`);
      return;
    }

    // Mappa EventSub type → event key del piano
    const planEventMap = {
      'channel.follow':            'follow',
      'channel.subscribe':         'subscribe',
      'channel.subscription.gift': 'gift_sub',
      'channel.cheer':             'cheer',
      'channel.hype_train.begin':  'hype_train',
      'channel.raid':              'raid',
    };
    const planEvent = planEventMap[subscriptionType];
    if (!planEvent || !limits.events.includes(planEvent)) return;

    // Costruisci data per buildEventMessage
    let data = {};
    if (planEvent === 'follow')    data = { username: event.user_name };
    if (planEvent === 'subscribe') data = { username: event.user_name, months: event.cumulative_months ?? 1 };
    if (planEvent === 'gift_sub')  data = { gifter: event.user_name, total: event.total ?? 1 };
    if (planEvent === 'cheer')     data = { username: event.user_name, bits: event.bits };
    if (planEvent === 'hype_train')data = {};
    if (planEvent === 'raid')      data = { from: event.from_broadcaster_user_name, viewers: event.viewers ?? 0 };

    const actor = data.username || data.gifter || data.from || 'utente';
    if (!checkEventCooldown(streamer.streamer_id, planEvent, actor)) return;

    if (planEvent === 'raid' && data.from) {
      try { await this.client.say(channel, `/shoutout ${data.from}`); } catch {}
    }

    const msg = await buildEventMessage(streamer, planEvent, data);
    if (msg && this.connected) {
      try { await this.client.say(channel, msg); } catch (e) {
        console.error(`[Bot] EventSub say() #${channel}:`, e.message);
      }
    }
  }
}

export const botManager = new BotManager();
