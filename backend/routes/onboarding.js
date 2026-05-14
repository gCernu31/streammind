import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const onboardingRoutes = Router();

// GET /api/onboarding
onboardingRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT onboarding_completed, onboarding_step FROM streamers WHERE id = $1',
      [req.user.streamer_id]
    );
    const r = rows[0] ?? {};
    res.json({
      completed: r.onboarding_completed ?? false,
      step:      r.onboarding_step      ?? 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero onboarding' });
  }
});

// POST /api/onboarding/progress — salva l'ultimo step raggiunto
onboardingRoutes.post('/progress', requireAuth, async (req, res) => {
  const { step } = req.body;
  if (typeof step !== 'number' || step < 0 || step > 3) {
    return res.status(400).json({ error: 'step non valido' });
  }
  try {
    await pool.query(
      'UPDATE streamers SET onboarding_step = $1 WHERE id = $2',
      [step, req.user.streamer_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel salvataggio del progresso' });
  }
});

// POST /api/onboarding/complete — marca il wizard come completato
onboardingRoutes.post('/complete', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE streamers SET onboarding_completed = true, onboarding_step = 3 WHERE id = $1',
      [req.user.streamer_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel completamento onboarding' });
  }
});
