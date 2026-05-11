import { Router } from 'express';
import axios from 'axios';
import pool from '../db.js';

export const analyticsRoutes = Router();

const AI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

function buildPrompt(data) {
  const {
    twitch_username, avg_viewers, hours_per_month,
    total_followers, monthly_follower_growth, current_subs,
    main_games, stream_schedule, social_links,
  } = data;

  return `Sei un esperto di crescita per streamer Twitch italiani. Analizza il seguente profilo e genera un'analisi strategica dettagliata.

## DATI STREAMER
- Username Twitch: ${twitch_username || 'non specificato'}
- Spettatori medi per live: ${avg_viewers || 0}
- Ore stremate al mese: ${hours_per_month || 0}
- Follower totali: ${total_followers || 0}
- Crescita follower mensile: ${monthly_follower_growth || 0}
- Sub attuali: ${current_subs || 0}
- Giochi principali: ${main_games || 'non specificato'}
- Orari delle live: ${stream_schedule || 'non specificato'}
- Social/Link: ${social_links || 'non specificato'}

## ISTRUZIONI
Genera un'analisi strutturata con le seguenti sezioni in Markdown:

### 💪 Punti di forza
Identifica 2-3 punti di forza specifici basati sui dati.

### 🎯 Aree di miglioramento
Identifica 2-3 aree concrete dove lo streamer può crescere.

### ⏰ Orario ottimale per streamare
Analizza gli orari attuali e suggerisci quelli migliori con motivazione.

### 🎮 Giochi consigliati per crescere
Suggerisci 3-4 giochi strategici in base al profilo attuale.

### 📅 Piano d'azione 30/60/90 giorni
- **Primi 30 giorni**: azioni immediate
- **60 giorni**: obiettivi intermedi
- **90 giorni**: traguardi a lungo termine

### 📈 Stima crescita follower
Fornisci una stima realistica di crescita follower nei prossimi 3 mesi con diverse strategie.

---
Rispondi **esclusivamente in italiano**, tono professionale ma amichevole, sii specifico e pratico.`;
}

// ── HTML email con l'analisi ──────────────────────────────────────────────────
function buildEmailHtml(analysis, username) {
  const escapedAnalysis = analysis
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Converti Markdown base in HTML per l'email
    .replace(/^### (.+)$/gm, '<h3 style="color:#8B5CF6;margin:20px 0 8px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#f0f0f0;margin:24px 0 12px">$2</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- (.+)/g, '<br>• $1')
    .replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0d0d0d;color:#f0f0f0;font-family:Inter,Arial,sans-serif;padding:40px 20px;max-width:640px;margin:0 auto">
  <div style="text-align:center;margin-bottom:32px">
    <div style="font-size:24px;font-weight:900;color:#8B5CF6">StreaMindAI</div>
    <p style="color:#6b6b6b;font-size:14px;margin-top:4px">Dai una mente al tuo stream</p>
  </div>

  <div style="background:#151515;border:1px solid #262626;border-radius:16px;padding:32px">
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">La tua analisi è pronta${username ? `, @${username}` : ''}!</h1>
    <p style="color:#6b6b6b;font-size:14px;margin:0 0 28px">Ecco cosa abbiamo trovato analizzando il tuo canale Twitch.</p>

    <div style="font-size:15px;line-height:1.7;color:#a0a0a0">
      ${escapedAnalysis}
    </div>
  </div>

  <div style="background:linear-gradient(135deg,rgba(139,92,246,0.12),rgba(139,92,246,0.04));border:1px solid rgba(139,92,246,0.2);border-radius:16px;padding:28px;margin-top:24px;text-align:center">
    <p style="font-size:16px;font-weight:700;margin:0 0 8px">Vuoi raggiungere questi obiettivi?</p>
    <p style="color:#6b6b6b;font-size:14px;margin:0 0 20px">L'AI che ti aiuta attivamente ogni sera sul tuo canale Twitch.</p>
    <a href="${process.env.FRONTEND_URL || 'https://streammindai.it'}/login"
       style="display:inline-block;background:#8B5CF6;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
      Inizia gratis con StreaMindAI →
    </a>
  </div>

  <p style="text-align:center;color:#3a3a3a;font-size:12px;margin-top:24px">
    StreaMindAI · Dai una mente al tuo stream<br>
    Hai ricevuto questa email perché hai richiesto un'analisi gratuita.
  </p>
</body>
</html>`;
}

// ── GET /api/analytics/debug — temporaneo, rimuovere dopo il test ────────────
analyticsRoutes.get('/debug', async (req, res) => {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return res.json({ error: 'GEMINI_API_KEY non impostata' });

    const r = await axios.post(
      `${AI_ENDPOINT}?key=${geminiKey}`,
      { contents: [{ parts: [{ text: 'Di solo "ok"' }] }] },
      { timeout: 15_000 }
    );
    const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ ok: true, model_response: text, key_prefix: geminiKey.slice(0, 8) + '...' });
  } catch (err) {
    res.json({ ok: false, error: err.message, status: err.response?.status, data: err.response?.data });
  }
});

// ── POST /api/analytics/analyze — pubblico, no auth ───────────────────────────
analyticsRoutes.post('/analyze', async (req, res) => {
  const { email, ...formData } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ error: 'L\'email è obbligatoria.' });
  }

  // Controllo anti-spam: max 3 analisi per email nelle ultime 24h
  const recent = await pool.query(
    `SELECT COUNT(*) FROM analytics_leads
     WHERE email = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
    [email.trim().toLowerCase()]
  );
  if (parseInt(recent.rows[0].count) >= 3) {
    return res.status(429).json({ error: 'Hai già richiesto 3 analisi nelle ultime 24 ore. Riprova domani.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Servizio di analisi non ancora configurato.' });
  }

  try {
    const aiRes = await axios.post(
      `${AI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: buildPrompt({ ...formData }) }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      },
      { timeout: 30_000 }
    );

    const analysis = aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!analysis) throw new Error('Analisi non disponibile');

    // 2. Salva nel DB
    const { rows } = await pool.query(
      `INSERT INTO analytics_leads (email, twitch_username, form_data, analysis_generated)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        email.trim().toLowerCase(),
        formData.twitch_username || null,
        JSON.stringify({ email, ...formData }),
        analysis,
      ]
    );

    // 3. Invia email via Resend (best-effort, non blocca la risposta)
    if (process.env.RESEND_API_KEY) {
      axios.post(
        'https://api.resend.com/emails',
        {
          from:    'StreaMindAI <analisi@streammindai.it>',
          to:      email.trim(),
          subject: `La tua analisi StreaMindAI${formData.twitch_username ? ` — @${formData.twitch_username}` : ''}`,
          html:    buildEmailHtml(analysis, formData.twitch_username),
        },
        { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }
      ).catch(err => console.error('Resend error:', err.message));
    }

    res.json({ analysis, id: rows[0].id });

  } catch (err) {
    console.error('Analytics analyze error:', err.message);
    console.error('Analytics response data:', JSON.stringify(err.response?.data));
    if (err.response?.status === 429) {
      return res.status(503).json({ error: 'Servizio temporaneamente sovraccarico. Riprova tra qualche minuto.' });
    }
    res.status(500).json({ error: 'Errore durante la generazione dell\'analisi. Riprova.' });
  }
});
