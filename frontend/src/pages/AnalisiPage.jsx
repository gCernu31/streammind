import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AccountMenu from '../components/AccountMenu.jsx';

const PURPLE = '#8B5CF6';

// ─── Parser: markdown → array di slide ────────────────────────────────────────
function parseSlides(text, username) {
  const slides = [];

  // Slide 0 — cover
  slides.push({ type: 'cover', username });

  // Splitta sulle sezioni ### (ogni sezione = una slide)
  const sections = text.split(/^### /m).filter(Boolean);
  for (const raw of sections) {
    const lines   = raw.split('\n');
    const title   = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    slides.push({ type: 'section', title, content });
  }

  // Slide finale — CTA
  slides.push({ type: 'cta' });

  return slides;
}

// ─── Formatta testo inline (bold) ─────────────────────────────────────────────
function fmt(text) {
  if (!text) return null;
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ color: '#f0f0f0', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
      : p
  );
}

// ─── Render contenuto sezione ─────────────────────────────────────────────────
function SlideBody({ content }) {
  return (
    <div style={{ fontSize: '15px', lineHeight: '1.85', color: '#b0b0b0' }}>
      {content.split('\n').map((line, i) => {
        if (line.startsWith('## '))
          return <h3 key={i} style={{ color: '#f0f0f0', fontWeight: 700, fontSize: '15px', margin: '16px 0 6px' }}>{fmt(line.slice(3))}</h3>;
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <div key={i} style={{ display: 'flex', gap: '10px', margin: '7px 0' }}>
              <span style={{ color: PURPLE, flexShrink: 0, marginTop: '2px', fontSize: '16px' }}>•</span>
              <span>{fmt(line.slice(2))}</span>
            </div>
          );
        if (line === '---') return <hr key={i} style={{ border: 'none', borderTop: '1px solid #2a2a2a', margin: '16px 0' }} />;
        if (!line.trim()) return <div key={i} style={{ height: '8px' }} />;
        return <p key={i} style={{ margin: '4px 0' }}>{fmt(line)}</p>;
      })}
    </div>
  );
}

// ─── Slide cover ──────────────────────────────────────────────────────────────
function SlideCover({ username }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '340px', gap: '20px' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
        📊
      </div>
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Analisi pronta{username ? ` per @${username}` : ''}!
        </h2>
        <p style={{ color: '#6b6b6b', fontSize: '15px', margin: 0 }}>
          Generata da StreaMindAI — naviga con le frecce o i tasti ← →
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
        {['💪 Punti di forza', '🎯 Miglioramenti', '⏰ Orari', '🎮 Giochi', '📅 Piano 90gg', '📈 Crescita'].map(s => (
          <span key={s} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Slide CTA ────────────────────────────────────────────────────────────────
function SlideCta() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '340px', gap: '20px' }}>
      <div style={{ fontSize: '48px' }}>🚀</div>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: '0 0 10px' }}>
          Vuoi realizzare questi obiettivi?
        </h2>
        <p style={{ color: '#6b6b6b', fontSize: '15px', maxWidth: '400px', lineHeight: '1.7', margin: '0 auto 24px' }}>
          StreaMindAI è la tua AI che ti affianca ogni sera sul canale, gestisce la chat e impara dalla tua community.
        </p>
      </div>
      <Link
        to="/login"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          backgroundColor: PURPLE, color: '#fff', fontWeight: 700,
          padding: '14px 32px', borderRadius: '12px', fontSize: '15px',
          textDecoration: 'none', boxShadow: '0 0 28px rgba(139,92,246,0.4)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = PURPLE)}
      >
        Inizia gratis con StreaMindAI
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Link>
      <p style={{ fontSize: '12px', color: '#3a3a3a' }}>
        Trial 7 giorni gratis · Nessuna carta richiesta · Cancelli quando vuoi
      </p>
    </div>
  );
}

// ─── Presentazione a slide ────────────────────────────────────────────────────
function SlideShow({ slides, username, onReset }) {
  const [idx, setIdx] = useState(0);
  const total = slides.length;

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx(i => Math.min(total - 1, i + 1)), [total]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  const slide = slides[idx];

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Header slide */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: '#4a4a4a', fontWeight: 600 }}>
          {idx + 1} / {total}
        </div>
        <button
          onClick={onReset}
          style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #2a2a2a', color: '#6b6b6b', background: '#111', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#f0f0f0'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#6b6b6b'; }}
        >
          Nuova analisi
        </button>
      </div>

      {/* Card slide */}
      <div
        style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: '20px',
          padding: '40px 44px',
          minHeight: '420px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow sfondo */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '220px', height: '220px', borderRadius: '50%',
          background: 'rgba(139,92,246,0.06)', filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        {slide.type === 'cover'   && <SlideCover username={username} />}
        {slide.type === 'cta'     && <SlideCta />}
        {slide.type === 'section' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '24px', letterSpacing: '-0.01em' }}>
              {slide.title}
            </h2>
            <SlideBody content={slide.content} />
          </div>
        )}
      </div>

      {/* Navigazione */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
        {/* Freccia sinistra */}
        <button
          onClick={prev}
          disabled={idx === 0}
          style={{
            width: '44px', height: '44px', borderRadius: '12px',
            border: '1px solid #2a2a2a', background: idx === 0 ? 'transparent' : '#111',
            color: idx === 0 ? '#333' : '#a0a0a0', cursor: idx === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (idx > 0) { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#f0f0f0'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = idx === 0 ? '#333' : '#a0a0a0'; }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: '16px', height: '16px' }}>
            <path d="M10 3L4 8l6 5" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === idx ? PURPLE : '#2a2a2a',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        {/* Freccia destra */}
        <button
          onClick={next}
          disabled={idx === total - 1}
          style={{
            width: '44px', height: '44px', borderRadius: '12px',
            border: '1px solid',
            borderColor: idx === total - 1 ? '#2a2a2a' : PURPLE,
            background: idx === total - 1 ? 'transparent' : 'rgba(139,92,246,0.12)',
            color: idx === total - 1 ? '#333' : PURPLE,
            cursor: idx === total - 1 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (idx < total - 1) { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = idx === total - 1 ? 'transparent' : 'rgba(139,92,246,0.12)'; }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: '16px', height: '16px' }}>
            <path d="M6 3l6 5-6 5" />
          </svg>
        </button>
      </div>

      {/* Hint tastiera */}
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#2e2e2e', marginTop: '14px' }}>
        ← → per navigare tra le slide
      </p>
    </div>
  );
}

// ─── Dati form ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  email: '', twitch_username: '',
  avg_viewers: '', hours_per_month: '', total_followers: '',
  monthly_follower_growth: '', current_subs: '',
  main_games: '', stream_schedule: '', social_links: '',
};

const NUM_FIELDS = [
  { key: 'avg_viewers',             label: 'Spettatori medi per live',  placeholder: 'Es. 50' },
  { key: 'hours_per_month',         label: 'Ore stremate al mese',       placeholder: 'Es. 40' },
  { key: 'total_followers',         label: 'Follower totali',            placeholder: 'Es. 500' },
  { key: 'monthly_follower_growth', label: 'Crescita follower mensile',  placeholder: 'Es. 30' },
  { key: 'current_subs',            label: 'Sub attuali',               placeholder: 'Es. 10' },
];

const TEXT_FIELDS = [
  { key: 'main_games',      label: 'Giochi principali', placeholder: 'Es. Valorant, Minecraft, GTA V' },
  { key: 'stream_schedule', label: 'Orari delle live',  placeholder: 'Es. Venerdì e Sabato dalle 21:00' },
  { key: 'social_links',    label: 'Social / Link',     placeholder: 'Es. Instagram @gcernu, Discord discord.gg/gcernu' },
];

const MAX_NUM     = 9_999_999;
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const DANGEROUS   = /<[^>]*>|javascript:|on\w+=/i;

function validate(form) {
  const errors = {};
  if (!form.email.trim())                     errors.email = "L'email è obbligatoria.";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Inserisci un'email valida.";
  if (form.twitch_username.trim()) {
    if (!USERNAME_RE.test(form.twitch_username.trim()))       errors.twitch_username = 'Solo lettere, numeri e underscore.';
    else if (form.twitch_username.trim().length > 25)         errors.twitch_username = 'Massimo 25 caratteri.';
  }
  for (const f of NUM_FIELDS) {
    const raw = form[f.key];
    if (raw !== '') {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) errors[f.key] = 'Solo numeri interi positivi.';
      else if (n > MAX_NUM)              errors[f.key] = `Massimo ${MAX_NUM.toLocaleString('it-IT')}.`;
    }
  }
  for (const f of TEXT_FIELDS) {
    if (form[f.key].trim() && DANGEROUS.test(form[f.key])) errors[f.key] = 'Caratteri non consentiti.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

function FocusInput({ type = 'text', value, onChange, placeholder, required, error }) {
  const BASE = { width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0d0d', color: '#f0f0f0', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' };
  return (
    <>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ ...BASE, border: `1px solid ${error ? '#f87171' : '#2a2a2a'}` }}
        onFocus={e  => (e.target.style.borderColor = error ? '#f87171' : PURPLE)}
        onBlur={e   => (e.target.style.borderColor = error ? '#f87171' : '#2a2a2a')}
      />
      {error && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
    </>
  );
}

// ─── Pagina principale ────────────────────────────────────────────────────────
export default function AnalisiPage({ user, loading: authLoading, onLogout }) {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [slides, setSlides]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(p => ({ ...p, [k]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors } = validate(form);
    if (!isValid) { setFieldErrors(errors); return; }
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setSlides(null);
    try {
      const r = await axios.post('/api/analytics/analyze', form, { timeout: 45_000 });
      setSlides(parseSlides(r.data.analysis, form.twitch_username));
    } catch (err) {
      setError(err.response?.data?.error ?? "Errore durante l'analisi. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setSlides(null); setForm(EMPTY_FORM); setError(null); };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0d0d0d', color: '#f0f0f0' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(12px)', borderColor: '#1e1e1e' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: '#6b6b6b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b6b')}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4">
              <path d="M10 3L4 8l6 5" />
            </svg>
            StreaMindAI
          </Link>
          <AccountMenu user={user} loading={authLoading} onLogout={onLogout} />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* ── Hero ── */}
        {!slides && !loading && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-6"
              style={{ borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)', color: PURPLE }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: PURPLE }} />
              Motore AI StreaMindAI &nbsp;·&nbsp; Completamente gratuito
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
              Analisi gratuita del tuo<br />
              <span style={{ color: PURPLE }}>canale Twitch</span>
            </h1>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#a0a0a0' }}>
              Inserisci i dati del tuo canale e StreaMindAI genera una presentazione strategica personalizzata —
              punti di forza, aree di crescita, giochi consigliati e un piano d'azione in 90 giorni.
            </p>
          </div>
        )}

        {/* ── Form ── */}
        {!slides && !loading && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-2xl border p-6 sm:p-8 space-y-5" style={{ backgroundColor: '#111', borderColor: '#222' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a4a' }}>Dati canale</p>

              <div>
                <label className="block text-sm font-medium mb-1">Email <span style={{ color: PURPLE }}>*</span></label>
                <p className="text-xs mb-2" style={{ color: '#6b6b6b' }}>Riceverai l'analisi anche via email.</p>
                <FocusInput type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="la-tua@email.com" required error={fieldErrors.email} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username Twitch <span className="text-xs" style={{ color: '#6b6b6b' }}>(max 25 caratteri)</span></label>
                <FocusInput value={form.twitch_username} onChange={e => set('twitch_username', e.target.value)} placeholder="gcernu" error={fieldErrors.twitch_username} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {NUM_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-1">{f.label}</label>
                    <FocusInput type="number" value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} error={fieldErrors[f.key]} />
                  </div>
                ))}
              </div>

              {TEXT_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1">{f.label}</label>
                  <FocusInput value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} error={fieldErrors[f.key]} />
                </div>
              ))}
            </div>

            {error && (
              <p className="text-sm px-4 py-3 rounded-lg border" style={{ color: '#f87171', backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-xl font-bold text-base text-white transition-all duration-150"
              style={{ backgroundColor: PURPLE, boxShadow: '0 0 24px rgba(139,92,246,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = PURPLE)}
            >
              Analizza il mio canale →
            </button>
            <p className="text-center text-xs" style={{ color: '#4a4a4a' }}>
              Analisi generata da StreaMindAI &nbsp;·&nbsp; Ogni email/canale può essere analizzato una sola volta
            </p>
          </form>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="py-20 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: PURPLE }} />
            <div className="text-center">
              <p className="font-semibold mb-1">StreaMindAI sta analizzando il tuo canale…</p>
              <p className="text-sm" style={{ color: '#6b6b6b' }}>Il motore AI sta elaborando i dati — circa 15-30 secondi</p>
            </div>
          </div>
        )}

        {/* ── Slideshow risultato ── */}
        {slides && (
          <SlideShow slides={slides} username={form.twitch_username} onReset={resetForm} />
        )}
      </div>
    </div>
  );
}
