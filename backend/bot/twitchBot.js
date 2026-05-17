/**
 * StreaMindAI — Twitch Bot
 *
 * Gestisce le connessioni IRC a tutti i canali degli streamer attivi.
 * Avviato da server.js dopo la connessione al database.
 *
 * Variabili d'ambiente richieste:
 *   TWITCH_BOT_USERNAME  — username dell'account bot su Twitch
 *   TWITCH_BOT_OAUTH     — token OAuth del bot (formato: oauth:xxxxxxxxxxxx)
 *   GEMINI_API_KEY       — chiave API Gemini per generare le risposte
 */

import tmi from 'tmi.js';
import axios from 'axios';
import pool from '../db.js';
import { generateBotPrompt } from '../services/promptBuilder.js';
import { getLimits } from '../config/planLimits.js';

// ---------------------------------------------------------------------------
// Gemini — genera risposta AI per la chat
// ---------------------------------------------------------------------------

function truncate(text, max = 400) {
  if (!text) return null;
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

async function generateReply(systemPrompt, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  try {
    const r = await axios.post(url, {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature:    0.8,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 512 },
      },
    }, { timeout: 20_000 });

    const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
    return truncate(text);
  } catch (err) {
    console.error('[Bot] Gemini error:', err.response?.data?.error?.message ?? err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function loadActiveStreamers() {
  const { rows } = await pool.query(`
    SELECT
      s.id                   AS streamer_id,
      s.twitch_username,
      s.subscription_plan,
      s.chat_messages_count,
      s.monthly_reset_date,
      s.extra_messages,
      s.extra_messages_expiry,
      bc.bot_name,
      bc.custom_commands
    FROM streamers s
    JOIN bot_configs bc ON bc.streamer_id = s.id
    WHERE s.subscription_status IN ('active', 'cancelling')
      AND s.twitch_username IS NOT NULL
      AND s.twitch_username <> ''
  `);
  return rows;
}

function parseCommands(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

// ---------------------------------------------------------------------------
// TwitchBot
// ---------------------------------------------------------------------------

class TwitchBot {
  constructor() {
    this.client      = null;
    this.channelMap  = {}; // lowercase channel → streamer row
    this.connected   = false;
    this._restarting = false;
  }

  // ── Avvio ─────────────────────────────────────────────────────────────────

  async start() {
    if (this._restarting) return;

    const username = process.env.TWITCH_BOT_USERNAME;
    const oauth    = process.env.TWITCH_BOT_OAUTH;

    if (!username || !oauth) {
      console.warn('[Bot] TWITCH_BOT_USERNAME / TWITCH_BOT_OAUTH mancanti — bot non avviato.');
      return;
    }

    let streamers;
    try {
      streamers = await loadActiveStreamers();
    } catch (err) {
      console.error('[Bot] Errore caricamento streamer:', err.message);
      this._scheduleRestart();
      return;
    }

    streamers.forEach(s => {
      this.channelMap[s.twitch_username.toLowerCase()] = s;
    });

    const channels = streamers.map(s => s.twitch_username.toLowerCase());
    console.log(`[Bot] Canali da unire all'avvio: ${channels.length || 0}`);

    this.client = new tmi.Client({
      options:  { debug: false },
      identity: { username, password: oauth },
      channels: channels.length > 0 ? channels : ['#' + username], // almeno il canale del bot stesso
    });

    this.client.on('connected', (addr, port) => {
      this.connected = true;
      console.log(`[Bot] Connesso a Twitch IRC (${addr}:${port}) — ${channels.length} canali`);
    });

    this.client.on('disconnected', reason => {
      this.connected = false;
      console.warn('[Bot] Disconnesso:', reason);
      this._scheduleRestart();
    });

    this.client.on('message', (channel, tags, message, self) => {
      if (self) return;
      this._handleMessage(channel, tags, message).catch(err =>
        console.error('[Bot] handleMessage error:', err.message)
      );
    });

    try {
      await this.client.connect();
    } catch (err) {
      console.error('[Bot] Connessione fallita:', err.message);
      this._scheduleRestart();
      return;
    }

    // Sincronizza canali ogni 5 minuti
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

      // Uniti ai nuovi canali attivi
      for (const ch of Object.keys(newMap)) {
        if (!this.channelMap[ch]) {
          try {
            await this.client.join(ch);
            console.log(`[Bot] Unito a #${ch}`);
          } catch (e) {
            console.warn(`[Bot] Join #${ch} fallito:`, e.message);
          }
        } else {
          // Aggiorna i dati dello streamer (piano, contatori, ecc.)
          this.channelMap[ch] = newMap[ch];
        }
      }

      // Abbandonare canali con abbonamento scaduto
      for (const ch of Object.keys(this.channelMap)) {
        if (!newMap[ch]) {
          try {
            await this.client.part(ch);
            console.log(`[Bot] Abbandonato #${ch} (piano scaduto)`);
          } catch (e) {
            console.warn(`[Bot] Part #${ch} fallito:`, e.message);
          }
          delete this.channelMap[ch];
        }
      }
    } catch (err) {
      console.error('[Bot] _syncChannels error:', err.message);
    }
  }

  // Unisce immediatamente un canale (utile dopo checkout Stripe)
  async joinChannel(twitchUsername) {
    if (!this.connected || !this.client) return;
    const ch = twitchUsername.toLowerCase();
    if (this.channelMap[ch]) return;
    try {
      const streamers = await loadActiveStreamers();
      const streamer  = streamers.find(s => s.twitch_username.toLowerCase() === ch);
      if (!streamer) return;
      await this.client.join(ch);
      this.channelMap[ch] = streamer;
      console.log(`[Bot] Unito immediatamente a #${ch}`);
    } catch (err) {
      console.error(`[Bot] joinChannel error per #${ch}:`, err.message);
    }
  }

  // ── Gestione messaggi ─────────────────────────────────────────────────────

  async _handleMessage(channel, tags, message) {
    const channelName = channel.replace('#', '').toLowerCase();
    const streamer    = this.channelMap[channelName];
    if (!streamer) return;

    const msgTrimmed = message.trim();
    const username   = (tags.username || tags['display-name'] || 'utente').toLowerCase();

    // 1. Comandi personalizzati fissi (nessuna chiamata AI)
    const customCmds = parseCommands(streamer.custom_commands)
      .filter(c => c.active !== false && c.trigger?.trim() && c.response?.trim());

    for (const cmd of customCmds) {
      const trigger = cmd.trigger.trim().toLowerCase();
      if (msgTrimmed.toLowerCase() === trigger ||
          msgTrimmed.toLowerCase().startsWith(trigger + ' ')) {
        await this.client.say(channel, cmd.response.trim());
        return;
      }
    }

    // 2. Comando AI principale: !<nome_bot>
    const botCmd = '!' + (streamer.bot_name || 'streambot').toLowerCase().replace(/\s+/g, '');
    if (!msgTrimmed.toLowerCase().startsWith(botCmd)) return;

    // 3. Rate limiting — reset mensile
    const now         = new Date();
    const resetDate   = streamer.monthly_reset_date ? new Date(streamer.monthly_reset_date) : now;
    const differentMonth = resetDate.getMonth() !== now.getMonth() ||
                           resetDate.getFullYear() !== now.getFullYear();
    if (differentMonth) {
      await pool.query(
        `UPDATE streamers SET chat_messages_count = 0, event_messages_count = 0, monthly_message_count = 0, monthly_reset_date = CURRENT_DATE WHERE id = $1`,
        [streamer.streamer_id]
      );
      streamer.chat_messages_count = 0;
    }

    const limits = getLimits(streamer.subscription_plan);

    // Limite messaggi mensili (solo comandi !nomebot)
    let usedExtraMessage = false;
    if (limits.monthlyMessages !== -1 &&
        (streamer.chat_messages_count ?? 0) >= limits.monthlyMessages) {
      // Prova a usare messaggi extra acquistati
      if ((streamer.extra_messages ?? 0) > 0) {
        const { rows: extraRows } = await pool.query(
          `UPDATE streamers SET extra_messages = extra_messages - 1
           WHERE id = $1 AND extra_messages > 0 AND extra_messages_expiry >= CURRENT_DATE
           RETURNING extra_messages`,
          [streamer.streamer_id]
        );
        if (extraRows[0]) {
          streamer.extra_messages = extraRows[0].extra_messages;
          usedExtraMessage = true;
        }
      }
      if (!usedExtraMessage) return;
    }

    // Limite per utente al giorno
    const today    = now.toISOString().slice(0, 10);
    const usageRes = await pool.query(
      `SELECT count FROM bot_daily_usage
       WHERE streamer_id = $1 AND username = $2 AND usage_date = $3`,
      [streamer.streamer_id, username, today]
    );
    const dailyCount = parseInt(usageRes.rows[0]?.count ?? 0);
    if (limits.userMessagesPerSession !== -1 &&
        dailyCount >= limits.userMessagesPerSession) {
      return;
    }

    // 4. Genera risposta con Gemini
    const userQuestion = msgTrimmed.slice(botCmd.length).trim() || 'Ciao!';
    let systemPrompt;
    try {
      systemPrompt = await generateBotPrompt(streamer.streamer_id);
    } catch (err) {
      console.error('[Bot] generateBotPrompt error:', err.message);
      return;
    }

    const reply = await generateReply(systemPrompt, userQuestion);
    if (!reply) return;

    // 5. Invia risposta in chat (già troncata a 400 da generateReply)
    try {
      await this.client.say(channel, reply);
      console.log(`[Bot] #${channelName} @${username}: "${userQuestion}" → "${reply.slice(0, 60)}..."`);
    } catch (err) {
      console.error(`[Bot] say() error in #${channelName}:`, err.message);
      return;
    }

    // 6. Aggiorna contatori
    const ops = [
      pool.query(
        `INSERT INTO bot_daily_usage (streamer_id, username, usage_date, count)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (streamer_id, username, usage_date)
         DO UPDATE SET count = bot_daily_usage.count + 1`,
        [streamer.streamer_id, username, today]
      ),
    ];
    if (!usedExtraMessage) {
      ops.push(pool.query(
        `UPDATE streamers SET chat_messages_count = chat_messages_count + 1, monthly_message_count = monthly_message_count + 1 WHERE id = $1`,
        [streamer.streamer_id]
      ));
    }
    await Promise.all(ops);
  }
}

export const twitchBot = new TwitchBot();
