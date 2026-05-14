import express from 'express';
import pool from '../db.js';
import { botManager } from '../bot/botManager.js';

export const statusRoutes = express.Router();

const SERVICES = [
  { key: 'bot',       name: 'Bot Twitch' },
  { key: 'dashboard', name: 'Dashboard'  },
  { key: 'api',       name: 'API'        },
  { key: 'database',  name: 'Database'   },
];

statusRoutes.get('/', async (req, res) => {
  try {
    // Verifica DB live
    let dbOk = true;
    try { await pool.query('SELECT 1'); } catch { dbOk = false; }

    // Legge service_status dal DB (aggiornato dal botManager ogni 60s)
    const { rows: statusRows } = await pool.query('SELECT * FROM service_status');
    const statusMap = Object.fromEntries(statusRows.map(r => [r.service, r]));

    // Calcola downtime per servizio negli ultimi 30 giorni (minuti)
    const TOTAL_MINUTES = 30 * 24 * 60;
    const { rows: incidentRows } = await pool.query(`
      SELECT service,
             SUM(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - started_at)) / 60) AS downtime_min
      FROM status_incidents
      WHERE started_at >= NOW() - INTERVAL '30 days'
      GROUP BY service
    `);
    const downtimeMap = Object.fromEntries(
      incidentRows.map(r => [r.service, parseFloat(r.downtime_min ?? 0)])
    );

    // Giorni con incidente per history (set di 'service:YYYY-MM-DD')
    const { rows: incidentDayRows } = await pool.query(`
      SELECT service, TO_CHAR(DATE(started_at), 'YYYY-MM-DD') AS incident_date
      FROM status_incidents
      WHERE started_at >= CURRENT_DATE - INTERVAL '29 days'
      GROUP BY service, DATE(started_at)
    `);
    const incidentDaySet = new Set(incidentDayRows.map(r => `${r.service}:${r.incident_date}`));

    // Genera storico 30 giorni per ogni servizio
    const history = Object.fromEntries(SERVICES.map(s => [s.key, []]));
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      for (const svc of SERVICES) {
        history[svc.key].push({
          date:   dateStr,
          status: incidentDaySet.has(`${svc.key}:${dateStr}`) ? 'outage' : 'operational',
        });
      }
    }

    // Manutenzione attiva (in corso adesso)
    const { rows: activeMaint } = await pool.query(`
      SELECT * FROM maintenance_windows
      WHERE active = true AND starts_at <= NOW() AND ends_at >= NOW()
      LIMIT 1
    `);

    // Manutenzione programmata (prossimi 7 giorni)
    const { rows: upcomingMaint } = await pool.query(`
      SELECT * FROM maintenance_windows
      WHERE active = true AND starts_at > NOW() AND starts_at <= NOW() + INTERVAL '7 days'
      ORDER BY starts_at ASC
      LIMIT 5
    `);

    // Incidenti aperti
    const { rows: openIncidents } = await pool.query(`
      SELECT * FROM status_incidents
      WHERE resolved_at IS NULL
      ORDER BY started_at DESC
    `);

    // Costruisce array servizi con status live
    const services = SERVICES.map(svc => {
      const dbRow = statusMap[svc.key];

      let liveStatus;
      if (svc.key === 'database') {
        liveStatus = dbOk ? 'operational' : 'outage';
      } else if (svc.key === 'bot') {
        if (botManager.connected) {
          liveStatus = 'operational';
        } else if (botManager._offlineSince) {
          liveStatus = 'outage';
        } else {
          liveStatus = dbRow?.status ?? 'operational';
        }
      } else {
        // dashboard e api: se stiamo rispondendo, sono operativi
        liveStatus = 'operational';
      }

      const downtime  = downtimeMap[svc.key] ?? 0;
      const uptimePct = Math.max(0, Math.min(100, ((TOTAL_MINUTES - downtime) / TOTAL_MINUTES) * 100));

      return {
        key:        svc.key,
        name:       svc.name,
        status:     liveStatus,
        uptime_30d: Math.round(uptimePct * 100) / 100,
        message:    dbRow?.message ?? null,
        updated_at: dbRow?.updated_at ?? null,
      };
    });

    res.json({
      services,
      incidents_open:       openIncidents,
      maintenance_active:   activeMaint[0]   ?? null,
      maintenance_upcoming: upcomingMaint,
      history,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[Status]', err);
    res.status(500).json({ error: 'Errore nel recupero dello stato' });
  }
});
