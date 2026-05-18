import { Router } from 'express';
import axios from 'axios';
import pool from '../db.js';
import { sendAnalysisReportEmail } from '../services/emailService.js';
import { requireAuth } from '../middleware/auth.js';

export const analyticsRoutes = Router();

// ── Twitch app token (cache in-memory, dura ~60 giorni) ───────────────────────
let _twitchAppToken = null;
let _twitchTokenExpiry = 0;

async function getTwitchAppToken() {
  if (_twitchAppToken && Date.now() < _twitchTokenExpiry) return _twitchAppToken;
  const r = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id:     process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type:    'client_credentials',
    },
  });
  _twitchAppToken   = r.data.access_token;
  _twitchTokenExpiry = Date.now() + (r.data.expires_in - 3600) * 1000;
  return _twitchAppToken;
}

async function twitchUserExists(username) {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) return true;
  try {
    const token = await getTwitchAppToken();
    const r = await axios.get('https://api.twitch.tv/helix/users', {
      params:  { login: username.toLowerCase() },
      headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` },
      timeout: 8_000,
    });
    return r.data?.data?.length > 0;
  } catch {
    return true; // in caso di errore API lascia passare
  }
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY non configurata');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const r = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 12288 },
  }, { timeout: 90_000 });

  const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Risposta Gemini vuota');
  return text;
}

function buildPrompt(data) {
  const {
    twitch_username, avg_viewers, hours_per_month,
    total_followers, monthly_follower_growth, current_subs,
    main_games, stream_schedule, social_links,
  } = data;

  return `Scrivi come un consulente esperto di crescita su Twitch con 10 anni di esperienza. Usa un tono diretto, autorevole ma accessibile. Ogni affermazione deve essere supportata da un dato numerico concreto. Usa paragrafi brevi (massimo 3-4 righe). Evita frasi generiche — ogni consiglio deve essere specifico per questo streamer. Usa la seconda persona singolare (tu, il tuo canale) per rendere l'analisi personale.

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
Genera un'analisi strutturata con esattamente le seguenti sezioni in Markdown. Ogni sezione inizia con ### (tre hashtag). Non aggiungere sezioni extra né introduzioni. Ogni affermazione deve includere un numero concreto.

### 📊 Situazione Attuale del Canale
Analisi oggettiva dei dati forniti. Contestualizza ogni metrica rispetto alle medie Twitch per la categoria (es. media italiana, media categoria). Evidenzia il dato più rilevante con un numero preciso.

### 🎯 Punteggio Canale
Assegna un voto su 10 a ciascuna area con una riga di spiegazione specifica per questo streamer:
- **Community**: X/10 — [motivazione basata sui dati]
- **Monetizzazione**: X/10 — [motivazione basata sui dati]
- **Discovery**: X/10 — [motivazione basata sui dati]
- **Costanza**: X/10 — [motivazione basata sui dati]

### 💪 Asset Strategici
Identifica 2-3 punti di forza reali basati sui numeri forniti. Per ognuno cita il dato specifico che lo supporta e spiega perché è un vantaggio competitivo.

### ⚠️ Gap da Colmare
Identifica 2-3 aree concrete dove il canale perde opportunità di crescita. Quantifica il potenziale mancato con un numero (es. "stai perdendo circa X follower/mese rispetto a canali simili").

### 🔍 Analisi della Concorrenza
Cita 2-3 streamer italiani simili per dimensione (follower e spettatori medi) e categoria. Per ognuno indica una cosa specifica che fanno meglio e come puoi replicarla nel tuo contesto.

### ⚡ Quick Wins
Elenca esattamente 3 azioni concrete che puoi implementare entro 7 giorni. Ogni azione deve avere un risultato atteso quantificato (es. "+X% retention", "+Y follower/settimana").

### ❌ Errori Comuni
Descrivi 2-3 errori tipici degli streamer con ${total_followers || 0} follower e ${avg_viewers || 0} spettatori medi. Per ognuno spiega la causa e la soluzione pratica.

### ⏰ Orario Ottimale per Streamare
Analizza gli orari attuali e suggerisci quelli migliori con dati di traffico Twitch per la categoria. Indica il guadagno stimato in spettatori medi passando agli orari consigliati.

### 🎮 Giochi Consigliati per Crescere
Suggerisci 3-4 giochi strategici. Per ognuno indica: stima canali attivi nella categoria su Twitch e numero di spettatori potenzialmente raggiungibili con la tua dimensione attuale.

### 🚀 Roadmap di Crescita
Piano d'azione dettagliato con KPI misurabili:
- **Primi 30 giorni**: 2-3 azioni immediate con target numerico
- **60 giorni**: obiettivi intermedi con numeri target
- **90 giorni**: traguardo principale con proiezione follower realistica

### 📈 Stima Crescita Follower
Fornisci una stima realistica con 3 scenari e le condizioni necessarie per ciascuno:
- **Scenario conservativo**: X follower in 90 giorni (condizioni: ...)
- **Scenario moderato**: X follower in 90 giorni (condizioni: ...)
- **Scenario ottimistico**: X follower in 90 giorni (condizioni: ...)

### 💡 Piano d'Azione Immediato
Tabella settimanale del piano editoriale. Usa il formato tabella Markdown con queste colonne esatte: Giorno, Gioco, Tipo, Obiettivo. Ogni cella deve avere massimo 30 caratteri — abbrevia se necessario. Includi 7 righe (una per giorno della settimana).

---
Questa analisi è stata generata da StreaMindAI sulla base dei dati forniti. Per una consulenza approfondita e personalizzata, contatta il team di StreaMindAI su support@streamindai.com

---
Rispondi **esclusivamente in italiano**. Non aggiungere testo prima della prima sezione ### né dopo l'ultima riga ---.`;
}

// ── HTML email con l'analisi ──────────────────────────────────────────────────
function buildEmailHtml(analysis, username) {
  const escapedAnalysis = analysis
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Converti Markdown base in HTML per l'email
    .replace(/^### (.+)$/gm, '<h3 style="color:#8B5CF6;margin:20px 0 8px;font-size:15px">$1</h3>')
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
    <a href="${process.env.FRONTEND_URL || 'https://streamindai.com'}/login"
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

// ── POST /api/analytics/analyze — pubblico, no auth ───────────────────────────
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{1,25}$/;
const DANGEROUS   = /<[^>]*>|javascript:|on\w+=/i;
const MAX_NUM     = 9_999_999;
const NUM_KEYS    = ['avg_viewers', 'hours_per_month', 'total_followers', 'monthly_follower_growth', 'current_subs'];
const TEXT_KEYS   = ['main_games', 'stream_schedule', 'social_links'];

// ── GET /api/analytics/twitch-data — dati Twitch per l'utente loggato ────────
analyticsRoutes.get('/twitch-data', requireAuth, async (req, res) => {
  const { twitch_id, twitch_username } = req.user;
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    return res.json({ twitch_username });
  }
  try {
    const token = await getTwitchAppToken();
    const headers = {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    };
    const [followersResult, channelResult] = await Promise.allSettled([
      axios.get('https://api.twitch.tv/helix/channels/followers', {
        params: { broadcaster_id: twitch_id, first: 1 },
        headers, timeout: 8_000,
      }),
      axios.get('https://api.twitch.tv/helix/channels', {
        params: { broadcaster_id: twitch_id },
        headers, timeout: 8_000,
      }),
    ]);
    const totalFollowers = followersResult.status === 'fulfilled'
      ? (followersResult.value.data?.total ?? null) : null;
    const gameData = channelResult.status === 'fulfilled'
      ? channelResult.value.data?.data?.[0] : null;
    res.json({
      twitch_username,
      total_followers: totalFollowers,
      main_games: gameData?.game_name ?? null,
    });
  } catch (err) {
    console.error('[Analytics] twitch-data:', err.message);
    res.json({ twitch_username });
  }
});

// ── GET /api/analytics/my-analysis — analisi esistente per utente loggato ────
analyticsRoutes.get('/my-analysis', requireAuth, async (req, res) => {
  const { twitch_id } = req.user;
  try {
    const { rows } = await pool.query(
      `SELECT id, twitch_username, analysis_generated, generated_at, next_generation_at, form_data
       FROM analytics_leads WHERE twitch_id = $1`,
      [twitch_id]
    );
    if (!rows[0] || !rows[0].analysis_generated) {
      return res.json({ analysis: null });
    }
    res.json({
      id:                 rows[0].id,
      analysis:           rows[0].analysis_generated,
      generated_at:       rows[0].generated_at,
      next_generation_at: rows[0].next_generation_at,
      form_data:          rows[0].form_data,
    });
  } catch (err) {
    console.error('[Analytics] my-analysis:', err.message);
    res.status(500).json({ error: "Errore nel recupero dell'analisi." });
  }
});

// ── POST /api/analytics/generate — genera/rigenera analisi per utente loggato ─
analyticsRoutes.post('/generate', requireAuth, async (req, res) => {
  const { twitch_id, twitch_username: jwtUsername, streamer_id } = req.user;
  const formData = req.body;

  for (const key of TEXT_KEYS) {
    if (formData[key] && DANGEROUS.test(formData[key])) {
      return res.status(400).json({ error: 'Contenuto non consentito nei campi testo.' });
    }
  }

  const { rows: existing } = await pool.query(
    `SELECT id, next_generation_at FROM analytics_leads WHERE twitch_id = $1`,
    [twitch_id]
  );
  if (existing[0]?.next_generation_at && new Date(existing[0].next_generation_at) > new Date()) {
    const d = new Date(existing[0].next_generation_at).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    return res.status(429).json({
      error: `Puoi rigenerare l'analisi a partire dal ${d}.`,
      next_generation_at: existing[0].next_generation_at,
    });
  }

  try {
    const usernameForPrompt = formData.twitch_username?.trim() || jwtUsername;
    const analysis = await callGemini(buildPrompt({ ...formData, twitch_username: usernameForPrompt }));
    const nextGen = new Date(Date.now() + 30 * 24 * 60 * 60_000);

    let id;
    if (existing[0]) {
      const { rows } = await pool.query(
        `UPDATE analytics_leads
         SET analysis_generated=$1, generated_at=NOW(), next_generation_at=$2, form_data=$3
         WHERE twitch_id=$4 RETURNING id`,
        [analysis, nextGen, JSON.stringify(formData), twitch_id]
      );
      id = rows[0].id;
    } else {
      const { rows: sRows } = await pool.query(
        `SELECT email FROM streamers WHERE id = $1`, [streamer_id]
      );
      const email = sRows[0]?.email ?? null;
      const { rows } = await pool.query(
        `INSERT INTO analytics_leads
           (twitch_id, twitch_username, email, form_data, analysis_generated, generated_at, next_generation_at)
         VALUES ($1,$2,$3,$4,$5,NOW(),$6) RETURNING id`,
        [twitch_id, usernameForPrompt, email, JSON.stringify(formData), analysis, nextGen]
      );
      id = rows[0].id;
    }

    res.json({ analysis, id });
  } catch (err) {
    console.error('[Analytics] generate:', err.message);
    if (err.response?.status === 429) {
      return res.status(503).json({ error: 'Servizio temporaneamente sovraccarico. Riprova tra qualche minuto.' });
    }
    res.status(500).json({ error: "Errore durante la generazione dell'analisi. Riprova." });
  }
});

// ── GET /api/analytics/:id — recupera analisi pubblica per link condivisibile ──
analyticsRoutes.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'ID non valido.' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, twitch_username, analysis_generated, created_at
       FROM analytics_leads WHERE id = $1`,
      [id]
    );
    if (!rows[0] || !rows[0].analysis_generated) {
      return res.status(404).json({ error: 'Analisi non trovata.' });
    }
    res.json({
      id:              rows[0].id,
      twitch_username: rows[0].twitch_username,
      analysis:        rows[0].analysis_generated,
      created_at:      rows[0].created_at,
    });
  } catch (err) {
    console.error('[Analytics] GET /:id:', err.message);
    res.status(500).json({ error: "Errore nel recupero dell'analisi." });
  }
});

// ── POST /api/analytics/analyze — pubblico, no auth ───────────────────────────
analyticsRoutes.post('/analyze', async (req, res) => {
  const { email, ...formData } = req.body;

  const emailClean    = email?.trim().toLowerCase();
  const usernameClean = formData.twitch_username?.trim().toLowerCase();

  if (!emailClean) {
    return res.status(400).json({ error: 'L\'email è obbligatoria.' });
  }
  if (!EMAIL_RE.test(emailClean)) {
    return res.status(400).json({ error: 'Email non valida.' });
  }
  if (!usernameClean) {
    return res.status(400).json({ error: 'L\'username Twitch è obbligatorio.' });
  }
  if (!USERNAME_RE.test(usernameClean)) {
    return res.status(400).json({ error: 'Username Twitch non valido: solo lettere, numeri e underscore, max 25 caratteri.' });
  }
  for (const key of NUM_KEYS) {
    const raw = formData[key];
    if (raw !== undefined && raw !== '') {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0 || n > MAX_NUM) {
        return res.status(400).json({ error: `Valore non valido per campo numerico (max ${MAX_NUM.toLocaleString()}).` });
      }
    }
  }
  for (const key of TEXT_KEYS) {
    if (formData[key] && DANGEROUS.test(formData[key])) {
      return res.status(400).json({ error: 'Contenuto non consentito nei campi testo.' });
    }
  }

  // 1. Email già usata in precedenza
  const emailUsed = await pool.query(
    'SELECT 1 FROM analytics_leads WHERE email = $1 LIMIT 1',
    [emailClean]
  );
  if (emailUsed.rowCount > 0) {
    return res.status(409).json({ error: 'Questa email ha già ricevuto un\'analisi. Ogni email può essere usata una sola volta.' });
  }

  // 2. Username Twitch già usato in precedenza
  const usernameUsed = await pool.query(
    'SELECT 1 FROM analytics_leads WHERE LOWER(twitch_username) = $1 LIMIT 1',
    [usernameClean]
  );
  if (usernameUsed.rowCount > 0) {
    return res.status(409).json({ error: 'Questo canale Twitch ha già ricevuto un\'analisi. Ogni canale può essere analizzato una sola volta.' });
  }

  // 3. Verifica che l'username Twitch esista davvero
  const exists = await twitchUserExists(usernameClean);
  if (!exists) {
    return res.status(400).json({ error: `Il canale Twitch "@${formData.twitch_username}" non esiste. Controlla di aver scritto correttamente il tuo username.` });
  }

  try {
    const analysis = await callGemini(buildPrompt({ ...formData }));

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

    // 3. Invia email con il report (best-effort, non blocca la risposta)
    sendAnalysisReportEmail({
      to:             email.trim(),
      twitchUsername: formData.twitch_username || null,
      analysis,
    }).catch(err => console.error('[Email] analysis-report:', err.message));

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
