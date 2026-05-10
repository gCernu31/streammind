import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const memoryRoutes = Router();

// ── GET /api/memories ─────────────────────────────────────────────────────────
// Query params: category, search, page (default 1), limit (default 20)
memoryRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const { category, search } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // Costruzione dinamica dei filtri
    const conditions = ['streamer_id = $1'];
    const params     = [req.user.streamer_id];
    let   idx        = 2;

    if (category) {
      conditions.push(`category = $${idx++}`);
      params.push(category);
    }
    if (search?.trim()) {
      conditions.push(
        `(subject ILIKE $${idx} OR content ILIKE $${idx} OR game_context ILIKE $${idx})`
      );
      params.push(`%${search.trim()}%`);
      idx++;
    }

    const where = conditions.join(' AND ');

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM bot_memories WHERE ${where}`, params),
      pool.query(
        `SELECT id, category, subject, content, game_context, created_at
         FROM bot_memories
         WHERE ${where}
         ORDER BY created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({
      memories: dataRes.rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero delle memorie' });
  }
});

// ── POST /api/memories ────────────────────────────────────────────────────────
memoryRoutes.post('/', requireAuth, async (req, res) => {
  const { category, subject, content, game_context } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Il campo "content" è obbligatorio.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO bot_memories (streamer_id, category, subject, content, game_context)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, category, subject, content, game_context, created_at`,
      [
        req.user.streamer_id,
        category     ?? null,
        subject?.trim()      || null,
        content.trim(),
        game_context?.trim() || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel salvataggio della memoria' });
  }
});

// ── DELETE /api/memories/:id ──────────────────────────────────────────────────
memoryRoutes.delete('/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'ID non valido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM bot_memories WHERE id = $1 AND streamer_id = $2 RETURNING id',
      [id, req.user.streamer_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Memoria non trovata o non autorizzata' });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nell\'eliminazione della memoria' });
  }
});
