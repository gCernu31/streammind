/**
 * Spotify OAuth per Song Request — flusso per-streamer
 *
 * GET  /api/spotify/auth-url   — restituisce l'URL di autorizzazione Spotify
 * GET  /api/spotify/callback   — scambia il code per i token e li salva in bot_configs
 * DELETE /api/spotify/disconnect — revoca i token salvati
 *
 * Il callback URI da registrare nella Spotify App dello streamer:
 *   ${APP_URL}/api/spotify/callback
 */

import { Router } from 'express';
import axios      from 'axios';
import crypto     from 'crypto';
import pool       from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const spotifyRoutes = Router();

const SCOPES       = 'user-modify-playback-state user-read-playback-state';
const CALLBACK_URI = () => `${process.env.APP_URL ?? 'http://localhost:3001'}/api/spotify/callback`;
const FRONTEND_URL = () => process.env.FRONTEND_URL ?? 'http://localhost:5173';

// ── Firma / verifica state ─────────────────────────────────────────────────────

function signState(streamerId) {
  const payload = Buffer.from(JSON.stringify({ sid: streamerId, t: Date.now() })).toString('base64url');
  const mac     = crypto.createHmac('sha256', process.env.JWT_SECRET ?? 'secret').update(payload).digest('hex').slice(0, 16);
  return `${payload}.${mac}`;
}

function verifyState(state) {
  const [payload, mac] = (state ?? '').split('.');
  if (!payload || !mac) return null;
  const expected = crypto.createHmac('sha256', process.env.JWT_SECRET ?? 'secret').update(payload).digest('hex').slice(0, 16);
  if (mac !== expected) return null;
  try {
    const { sid } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return sid ?? null;
  } catch {
    return null;
  }
}

// ── GET /api/spotify/auth-url ─────────────────────────────────────────────────
// Restituisce l'URL Spotify a cui redirigere il browser del frontend.
// Richiede che lo streamer abbia già salvato client_id e client_secret.

spotifyRoutes.get('/auth-url', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT spotify_client_id FROM bot_configs WHERE streamer_id = $1',
      [req.user.streamer_id]
    );
    const clientId = rows[0]?.spotify_client_id;
    if (!clientId) {
      return res.status(400).json({ error: 'Salva prima Spotify Client ID nella configurazione.' });
    }

    const state = signState(req.user.streamer_id);
    const url   = new URL('https://accounts.spotify.com/authorize');
    url.searchParams.set('client_id',     clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri',  CALLBACK_URI());
    url.searchParams.set('scope',         SCOPES);
    url.searchParams.set('state',         state);

    res.json({ url: url.toString() });
  } catch (err) {
    console.error('[Spotify] auth-url:', err.message);
    res.status(500).json({ error: 'Errore nella generazione URL Spotify.' });
  }
});

// ── GET /api/spotify/callback ─────────────────────────────────────────────────
// Riceve il code da Spotify, scambia i token, salva in bot_configs.
// Non ha auth header — usa il state firmato per identificare lo streamer.

spotifyRoutes.get('/callback', async (req, res) => {
  const frontendUrl = FRONTEND_URL();
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${frontendUrl}/config?spotify=denied`);
  }

  const streamerId = verifyState(state);
  if (!streamerId) {
    return res.redirect(`${frontendUrl}/config?spotify=error`);
  }

  try {
    const { rows } = await pool.query(
      'SELECT spotify_client_id, spotify_client_secret FROM bot_configs WHERE streamer_id = $1',
      [streamerId]
    );
    const { spotify_client_id: clientId, spotify_client_secret: clientSecret } = rows[0] ?? {};

    if (!clientId || !clientSecret) {
      return res.redirect(`${frontendUrl}/config?spotify=missing_credentials`);
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const r = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: CALLBACK_URI(),
      }).toString(),
      { headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = r.data;
    const expiresAt = Date.now() + expires_in * 1000;

    await pool.query(
      `UPDATE bot_configs
       SET spotify_access_token    = $1,
           spotify_refresh_token   = $2,
           spotify_token_expires_at = $3
       WHERE streamer_id = $4`,
      [access_token, refresh_token, expiresAt, streamerId]
    );

    console.log(`[Spotify] Account autorizzato per streamer_id=${streamerId}`);
    res.redirect(`${frontendUrl}/config?spotify=connected`);
  } catch (err) {
    console.error('[Spotify] callback:', err.response?.data ?? err.message);
    res.redirect(`${frontendUrl}/config?spotify=error`);
  }
});

// ── DELETE /api/spotify/disconnect ────────────────────────────────────────────

spotifyRoutes.delete('/disconnect', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE bot_configs
       SET spotify_access_token     = NULL,
           spotify_refresh_token    = NULL,
           spotify_token_expires_at = NULL
       WHERE streamer_id = $1`,
      [req.user.streamer_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Spotify] disconnect:', err.message);
    res.status(500).json({ error: 'Errore nella disconnessione.' });
  }
});
