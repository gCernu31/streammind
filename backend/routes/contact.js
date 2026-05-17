import { Router } from 'express';
import { sendContactFormEmail, sendGeneralContactEmail } from '../services/emailService.js';

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

// ── POST /api/contact/general — form contatti pagina /contatti ────────────────
const DANGEROUS = /<[^>]*>|javascript:|on\w+=/i;

contactRoutes.post('/general', async (req, res) => {
  const { nome, email, messaggio } = req.body ?? {};

  if (!nome?.trim())                              return res.status(400).json({ error: 'Il nome è obbligatorio.' });
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                                                  return res.status(400).json({ error: 'Email non valida.' });
  if (!messaggio?.trim() || messaggio.trim().length < 10)
                                                  return res.status(400).json({ error: 'Il messaggio è troppo breve.' });
  if (DANGEROUS.test(nome) || DANGEROUS.test(messaggio))
                                                  return res.status(400).json({ error: 'Contenuto non consentito.' });

  try {
    await sendGeneralContactEmail({
      nome:     nome.trim(),
      email:    email.trim().toLowerCase(),
      messaggio: messaggio.trim(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[Contact/general]', err.message);
    res.status(500).json({ error: 'Errore nell\'invio. Scrivi direttamente a support@streamindai.com.' });
  }
});
