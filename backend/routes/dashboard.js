import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRoutes = Router();

// Handler riutilizzabile — esportato per il mount su /api/stats in server.js
export async function statsHandler(req, res) {
  try {
    const sid   = req.user.streamer_id;
    const today = new Date().toISOString().slice(0, 10);
    const yest  = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const week  = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

    const [
      todayRes,
      yestRes,
      memTotalRes,
      memWeekRes,
      subRes,
      usageWeekRes,
    ] = await Promise.all([
      // Messaggi oggi
      pool.query(
        `SELECT COALESCE(SUM(count), 0) AS n
         FROM bot_daily_usage WHERE streamer_id = $1 AND usage_date = $2`,
        [sid, today]
      ),
      // Messaggi ieri (per delta)
      pool.query(
        `SELECT COALESCE(SUM(count), 0) AS n
         FROM bot_daily_usage WHERE streamer_id = $1 AND usage_date = $2`,
        [sid, yest]
      ),
      // Totale memorie
      pool.query(
        'SELECT COUNT(*) AS n FROM bot_memories WHERE streamer_id = $1',
        [sid]
      ),
      // Memorie ultimi 7 giorni
      pool.query(
        `SELECT COUNT(*) AS n FROM bot_memories
         WHERE streamer_id = $1 AND created_at >= $2`,
        [sid, week]
      ),
      // Stato abbonamento
      pool.query(
        `SELECT subscription_status, subscription_plan, subscription_end
         FROM streamers WHERE id = $1`,
        [sid]
      ),
      // Utilizzo ultimi 7 giorni (per grafico)
      pool.query(
        `SELECT usage_date, SUM(count) AS n
         FROM bot_daily_usage
         WHERE streamer_id = $1 AND usage_date >= $2
         GROUP BY usage_date ORDER BY usage_date ASC`,
        [sid, week]
      ),
    ]);

    const sub        = subRes.rows[0]   ?? {};
    const msgToday   = parseInt(todayRes.rows[0].n);
    const msgYest    = parseInt(yestRes.rows[0].n);
    const memTotal   = parseInt(memTotalRes.rows[0].n);
    const memWeek    = parseInt(memWeekRes.rows[0].n);
    const isActive   = sub.subscription_status === 'active' || sub.subscription_status === 'cancelling';

    // Calcola quanti giorni del piano sono rimasti
    let daysRemaining = null;
    let totalDays     = null;
    if (sub.subscription_end) {
      const end   = new Date(sub.subscription_end);
      const now   = new Date();
      daysRemaining = Math.max(0, Math.ceil((end - now) / 86_400_000));
      totalDays   = 30;
    }

    res.json({
      bot_status:            isActive ? 'online' : 'offline',
      bot_name:              null, // risolto dalla /api/config
      messages_today:        msgToday,
      messages_today_delta:  msgToday - msgYest,
      memories_count:        memTotal,
      memories_this_week:    memWeek,
      subscription: {
        status:        sub.subscription_status ?? 'inactive',
        plan:          sub.subscription_plan   ?? null,
        end:           sub.subscription_end    ?? null,
        days_remaining: daysRemaining,
        total_days:     totalDays,
      },
      usage_last_7_days: usageWeekRes.rows.map(r => ({
        date:  r.usage_date,
        count: parseInt(r.n),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
  }
}

// ── GET /api/dashboard/stats ──────────────────────────────────────────────────
dashboardRoutes.get('/stats', requireAuth, statsHandler);
