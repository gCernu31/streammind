import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const referralRoutes = Router();

const FRONTEND = process.env.FRONTEND_URL ?? 'https://streamindai.com';

// ── GET /api/referral — statistiche e link referral ───────────────────────────
referralRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const { rows: streamerRows } = await pool.query(
      'SELECT referral_code FROM streamers WHERE id = $1',
      [req.user.streamer_id]
    );
    const code = streamerRows[0]?.referral_code ?? null;

    const { rows: statsRows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('active', 'rewarded')) AS active_count,
         COUNT(*) FILTER (WHERE status = 'rewarded')              AS credits_earned
       FROM referrals WHERE referrer_id = $1`,
      [req.user.streamer_id]
    );

    res.json({
      code,
      link:             code ? `${FRONTEND}/ref/${code}` : null,
      active_referrals: parseInt(statsRows[0]?.active_count   ?? 0, 10),
      credits_earned:   parseInt(statsRows[0]?.credits_earned ?? 0, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dei dati referral' });
  }
});
