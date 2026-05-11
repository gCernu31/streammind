import { Router } from 'express';
import axios from 'axios';

export const demoRoutes = Router();

const SYSTEM_PROMPT = `Sei Hally, l'IA demo di StreaMindAI sul canale di gCernu. Hai la personalità di FRIDAY di Iron Man — diretta, ironica, intelligente. Chiami gCernu "Signor gCernu". Rispondi SEMPRE in italiano con UNA SOLA frase completa di massimo 200 caratteri. Mai liste o elenchi. Sei la dimostrazione di cosa può fare StreaMindAI — ogni risposta deve impressionare l'utente e fargli venire voglia di creare il suo bot personalizzato.`;

// POST /api/demo
demoRoutes.post('/', async (req, res) => {
  const message = req.body?.message?.trim();
  if (!message) {
    return res.status(400).json({ error: 'Messaggio vuoto.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Servizio non disponibile.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const r = await axios.post(url, {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 300 },
    }, { timeout: 20_000 });

    const reply = r.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) return res.status(500).json({ error: 'Risposta vuota.' });

    res.json({ reply });
  } catch (err) {
    console.error('[Demo] Gemini error:', err.response?.data?.error?.message ?? err.message);
    res.status(500).json({ error: 'Errore nella generazione della risposta.' });
  }
});
