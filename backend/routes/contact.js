import { Router } from 'express';
import { sendContactFormEmail } from '../services/emailService.js';

export const contactRoutes = Router();

// ── POST /api/contact ─────────────────────────────────────────────────────────
contactRoutes.post('/', async (req, res) => {
  const { nome, twitch_username, piano, motivo } = req.body ?? {};

  if (!nome?.trim() || !twitch_username?.trim() || !motivo?.trim()) {
    return res.status(400).json({ error: 'Compila tutti i campi obbligatori.' });
  }
  if (motivo.trim().length < 10) {
    return res.status(400).json({ error: 'Il campo "Motivo" è troppo breve.' });
  }

  try {
    await sendContactFormEmail({
      nome:          nome.trim(),
      twitchUsername: twitch_username.trim().replace(/^@/, ''),
      piano:         piano?.trim() || 'Signature',
      motivo:        motivo.trim(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[Contact] Errore invio email:', err.message);
    res.status(500).json({ error: 'Errore nell\'invio. Riprova o scrivi direttamente a support@streamindai.com.' });
  }
});
