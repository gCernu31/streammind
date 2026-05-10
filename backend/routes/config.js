import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { invalidateBotPromptCache } from '../services/promptBuilder.js';

export const configRoutes = Router();

// Helpers per serializzare/deserializzare campi JSON in colonne TEXT
function tryParse(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val; // già JSONB
  try { return JSON.parse(val); } catch { return fallback; }
}
const toJson = (v) => (typeof v === 'string' ? v : JSON.stringify(v ?? null));

// ── GET /api/config ───────────────────────────────────────────────────────────
configRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT bot_name, bot_personality, creator_name, twitch_username,
              stream_schedule, social_links, custom_commands, characters,
              ai_provider, event_messages
       FROM bot_configs WHERE streamer_id = $1`,
      [req.user.streamer_id]
    );

    const cfg = rows[0] ?? {};
    res.json({
      bot_name:        cfg.bot_name        ?? 'StreamBot',
      creator_name:    cfg.creator_name    ?? req.user.display_name ?? '',
      bot_personality: cfg.bot_personality ?? '',
      twitch_username: cfg.twitch_username ?? req.user.twitch_username ?? '',
      stream_schedule: tryParse(cfg.stream_schedule, { days: [], time_start: '21:00', time_end: '00:00' }),
      social_links:    tryParse(cfg.social_links,    { linktree: '', instagram: '', youtube: '', discord: '' }),
      custom_commands: tryParse(cfg.custom_commands, []),
      characters:      tryParse(cfg.characters,      []),
      ai_provider:     cfg.ai_provider ?? 'gemini',
      event_messages:  tryParse(cfg.event_messages,  {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero della configurazione' });
  }
});

// ── PUT /api/config ───────────────────────────────────────────────────────────
configRoutes.put('/', requireAuth, async (req, res) => {
  const {
    bot_name, creator_name, bot_personality, twitch_username,
    stream_schedule, social_links, custom_commands, characters, ai_provider,
    event_messages,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE bot_configs
       SET bot_name        = COALESCE($1, bot_name),
           creator_name    = COALESCE($2, creator_name),
           bot_personality = COALESCE($3, bot_personality),
           twitch_username = COALESCE($4, twitch_username),
           stream_schedule = COALESCE($5, stream_schedule),
           social_links    = COALESCE($6, social_links),
           custom_commands = COALESCE($7::jsonb, custom_commands),
           characters      = COALESCE($8::jsonb, characters),
           ai_provider     = COALESCE($9, ai_provider),
           event_messages  = COALESCE($11::jsonb, event_messages),
           updated_at      = NOW()
       WHERE streamer_id = $10
       RETURNING *`,
      [
        bot_name        ?? null,
        creator_name    ?? null,
        bot_personality ?? null,
        twitch_username ?? null,
        stream_schedule != null ? toJson(stream_schedule) : null,
        social_links    != null ? toJson(social_links)    : null,
        custom_commands != null ? JSON.stringify(custom_commands) : null,
        characters      != null ? JSON.stringify(characters)      : null,
        ai_provider     ?? null,
        req.user.streamer_id,
        event_messages  != null ? JSON.stringify(event_messages) : null,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Configurazione non trovata' });
    }

    // Invalida la cache del prompt dopo ogni modifica
    invalidateBotPromptCache(req.user.streamer_id);

    const cfg = rows[0];
    res.json({
      success:         true,
      bot_name:        cfg.bot_name,
      creator_name:    cfg.creator_name,
      bot_personality: cfg.bot_personality,
      twitch_username: cfg.twitch_username,
      stream_schedule: tryParse(cfg.stream_schedule, { days: [], time_start: '21:00', time_end: '00:00' }),
      social_links:    tryParse(cfg.social_links,    { linktree: '', instagram: '', youtube: '', discord: '' }),
      custom_commands: tryParse(cfg.custom_commands, []),
      characters:      tryParse(cfg.characters,      []),
      ai_provider:     cfg.ai_provider,
      event_messages:  tryParse(cfg.event_messages,  {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel salvataggio della configurazione' });
  }
});
