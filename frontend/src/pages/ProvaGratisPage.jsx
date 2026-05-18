import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AccountMenu from '../components/AccountMenu.jsx';
import SlideShow, { parseSlides } from '../components/SlideShow.jsx';
import { getToken } from '../utils/auth.js';

const PURPLE = '#8B5CF6';

const EMPTY_FORM = {
  twitch_username: '',
  avg_viewers: '', hours_per_month: '', total_followers: '',
  monthly_follower_growth: '', current_subs: '',
  main_games: '', stream_schedule: '', social_links: '',
};

const NUM_FIELDS = [
  { key: 'avg_viewers',             label: 'Spettatori medi per live',  placeholder: 'Es. 50' },
  { key: 'hours_per_month',         label: 'Ore stremate al mese',       placeholder: 'Es. 40' },
  { key: 'total_followers',         label: 'Follower totali',            placeholder: 'Es. 500' },
  { key: 'monthly_follower_growth', label: 'Crescita follower mensile',  placeholder: 'Es. 30' },
  { key: 'current_subs',            label: 'Sub attuali',                placeholder: 'Es. 10' },
];

const TEXT_FIELDS = [
  { key: 'main_games',      label: 'Giochi principali', placeholder: 'Es. Valorant, Minecraft, GTA V' },
  { key: 'stream_schedule', label: 'Orari delle live',  placeholder: 'Es. Venerdì e Sabato dalle 21:00' },
  { key: 'social_links',    label: 'Social / Link',     placeholder: 'Es. Instagram @mionome' },
];

function FocusInput({ type = 'text', value, onChange, placeholder, error, readOnly }) {
  return (
    <>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: readOnly ? '#0a0a0a' : '#0d0d0d',
          color: '#f0f0f0',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
          border: `1px solid ${error ? '#f87171' : '#2a2a2a'}`,
          cursor: readOnly ? 'default' : 'text',
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = error ? '#f87171' : PURPLE; }}
        onBlur={e  => { if (!readOnly) e.target.style.borderColor = error ? '#f87171' : '#2a2a2a'; }}
      />
      {error && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
    </>
  );
}

function BlurredPreview() {
  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #222', marginBottom: '32px' }}>
      <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', backgroundColor: '#111', padding: '32px 36px' }}>
        <p style={{ color: PURPLE, fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>📊 Situazione Attuale del Canale</p>
        <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>
          Il tuo canale ha registrato una crescita del 23% negli ultimi 30 giorni, con una media di 47 spettatori per live.
          Questo ti posiziona nel top 15% dei canali italiani della categoria — un risultato solido con ampio margine di crescita.
        </p>
        <p style={{ color: PURPLE, fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>🎯 Punteggio Canale</p>
        <div style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '2.2' }}>
          <p><strong style={{ color: '#f0f0f0' }}>Community</strong>: 7/10 — La tua community è coinvolta e attiva</p>
          <p><strong style={{ color: '#f0f0f0' }}>Monetizzazione</strong>: 5/10 — Potenziale non ancora sfruttato appieno</p>
          <p><strong style={{ color: '#f0f0f0' }}>Discovery</strong>: 8/10 — Ottima visibilità nella categoria</p>
          <p><strong style={{ color: '#f0f0f0' }}>Costanza</strong>: 6/10 — Lo schedule può essere ottimizzato</p>
        </div>
        <p style={{ color: PURPLE, fontWeight: 700, fontSize: '15px', margin: '20px 0 10px' }}>⚡ Quick Wins (Settimana 1)</p>
        <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.7' }}>
          Streamare il martedì sera tra le 20:00 e le 23:00 potrebbe aumentare gli spettatori medi del 18% in 2 settimane...
        </p>
      </div>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(to bottom, rgba(13,13,13,0.5) 0%, rgba(13,13,13,0.92) 100%)',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔒</div>
        <p style={{ color: '#f0f0f0', fontWeight: 700, fontSize: '17px', marginBottom: '4px' }}>Analisi bloccata</p>
        <p style={{ color: '#a0a0a0', fontSize: '13px' }}>Accedi con Twitch per generare la tua analisi personale</p>
      </div>
    </div>
  );
}

export default function ProvaGratisPage({ user, loading: authLoading, onLogout }) {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState('loading'); // loading | A | B | C
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [slides, setSlides] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPageState('A');
      return;
    }

    const ss = user.subscription_status;
    if (ss === 'active' || ss === 'trialing' || ss === 'cancelling') {
      navigate('/analisi', { replace: true });
      return;
    }

    const token = getToken();

    fetch('/api/analytics/my-analysis', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.analysis) {
          setSlides(parseSlides(data.analysis, user.twitch_username ?? ''));
          setAnalysisId(data.id ?? null);
          setPageState('C');
          return;
        }
        setPrefillLoading(true);
        return fetch('/api/analytics/twitch-data', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(tw => {
            const prefills = {
              twitch_username: tw?.twitch_username ?? user.twitch_username ?? '',
            };
            if (tw?.total_followers != null) prefills.total_followers = String(tw.total_followers);
            if (tw?.main_games) prefills.main_games = tw.main_games;
            setForm(prev => ({ ...prev, ...prefills }));
            if (tw?.total_followers != null || tw?.main_games) setPrefilled(true);
            setPageState('B');
          })
          .catch(() => {
            setForm(prev => ({ ...prev, twitch_username: user.twitch_username ?? '' }));
            setPageState('B');
          })
          .finally(() => setPrefillLoading(false));
      })
      .catch(() => {
        setForm(prev => ({ ...prev, twitch_username: user.twitch_username ?? '' }));
        setPageState('B');
        setPrefillLoading(false);
      });
  }, [authLoading, user]);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(p => ({ ...p, [k]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setFieldErrors({});
    const token = getToken();
    try {
      const r = await fetch('/api/analytics/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Errore durante la generazione.");
      setSlides(parseSlides(data.analysis, user?.twitch_username ?? form.twitch_username));
      setAnalysisId(data.id ?? null);
      setPageState('C');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0d0d0d', color: '#f0f0f0' }}>
      <Helmet>
        <title>Analisi Gratuita Canale Twitch | StreaMindAI</title>
        <meta name="description" content="Ottieni un'analisi strategica gratuita del tuo canale Twitch con StreaMindAI. Piano di crescita personalizzato, roadmap 90 giorni e consigli pratici per streamer italiani." />
        <link rel="canonical" href="https://streamindai.com/prova-gratis" />
        <meta property="og:title" content="Analisi Gratuita Canale Twitch | StreaMindAI" />
        <meta property="og:description" content="Analisi AI gratuita per il tuo canale Twitch. Roadmap 90 giorni, punteggio canale e piano settimanale personalizzato." />
        <meta property="og:url" content="https://streamindai.com/prova-gratis" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(12px)', borderColor: '#1e1e1e' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: '#6b6b6b' }}
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

        {/* ── Loading iniziale ── */}
        {pageState === 'loading' && (
          <div className="py-24 flex justify-center">
            <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: PURPLE }} />
          </div>
        )}

        {/* ── State A: non loggato ── */}
        {pageState === 'A' && (
          <>
            <div className="text-center mb-10">
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-6"
                style={{ borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)', color: PURPLE }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: PURPLE }} />
                Motore AI StreaMindAI &nbsp;·&nbsp; Completamente gratuito
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
                Ottieni la tua analisi gratuita del<br />
                <span style={{ color: PURPLE }}>canale Twitch</span>
              </h1>
              <p className="text-base max-w-xl mx-auto mb-8" style={{ color: '#a0a0a0' }}>
                StreaMindAI analizza il tuo canale e genera un report con 12 sezioni — punti di forza,
                gap da colmare, giochi consigliati e un piano d'azione in 90 giorni.
              </p>

              <a
                href="/api/auth/twitch?redirect_to=/prova-gratis"
                className="inline-flex items-center gap-3 font-bold text-white px-8 py-4 rounded-xl text-base transition-all duration-150"
                style={{ backgroundColor: '#9146ff', boxShadow: '0 0 32px rgba(145,70,255,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7c27eb')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#9146ff')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                </svg>
                Accedi con Twitch — è gratis
              </a>
              <p className="text-xs mt-4" style={{ color: '#4a4a4a' }}>
                Nessuna carta di credito · Solo login Twitch richiesto
              </p>
            </div>

            <BlurredPreview />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['📊', 'Situazione attuale'],
                ['🎯', 'Punteggio canale'],
                ['💪', 'Asset strategici'],
                ['⚠️', 'Gap da colmare'],
                ['🚀', 'Roadmap 90 giorni'],
                ['💡', 'Piano settimanale'],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', color: '#6b6b6b' }}
                >
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── State B: form con pre-fill ── */}
        {pageState === 'B' && (
          <>
            {generating ? (
              <div className="py-20 flex flex-col items-center gap-5">
                <div className="w-14 h-14 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: PURPLE }} />
                <div className="text-center">
                  <p className="font-semibold mb-1">StreaMindAI sta analizzando il tuo canale…</p>
                  <p className="text-sm" style={{ color: '#6b6b6b' }}>Il motore AI sta elaborando i dati — circa 20-40 secondi</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div
                    className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-4"
                    style={{ borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)', color: PURPLE }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PURPLE }} />
                    {user?.display_name ? `Ciao, ${user.display_name}!` : 'Ciao!'}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3">
                    Completa i dati del tuo canale
                  </h1>
                  <p style={{ color: '#a0a0a0', fontSize: '15px' }}>
                    StreaMindAI genera un'analisi personalizzata basata sui tuoi dati reali.
                    {prefilled && ' Alcuni campi sono stati pre-compilati automaticamente da Twitch.'}
                  </p>
                </div>

                {prefillLoading && (
                  <div className="flex items-center gap-2 text-sm mb-4" style={{ color: '#6b6b6b' }}>
                    <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#333', borderTopColor: PURPLE }} />
                    Recupero dati da Twitch...
                  </div>
                )}

                {prefilled && !prefillLoading && (
                  <div
                    className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg border mb-5"
                    style={{ backgroundColor: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.18)', color: '#a0a0a0' }}
                  >
                    <span style={{ color: PURPLE }}>✓</span>
                    <span>Dati parziali estratti da Twitch — completa i campi mancanti per un'analisi più precisa</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="rounded-2xl border p-6 sm:p-8 space-y-5" style={{ backgroundColor: '#111', borderColor: '#222' }}>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a4a' }}>Dati canale</p>

                    <div>
                      <label className="block text-sm font-medium mb-1">Username Twitch</label>
                      <FocusInput
                        value={form.twitch_username}
                        onChange={e => set('twitch_username', e.target.value)}
                        placeholder="Il tuo username"
                        readOnly={!!user?.twitch_username}
                        error={fieldErrors.twitch_username}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {NUM_FIELDS.map(f => (
                        <div key={f.key}>
                          <label className="block text-sm font-medium mb-1">{f.label}</label>
                          <FocusInput
                            type="number"
                            value={form[f.key]}
                            onChange={e => set(f.key, e.target.value)}
                            placeholder={f.placeholder}
                            error={fieldErrors[f.key]}
                          />
                        </div>
                      ))}
                    </div>

                    {TEXT_FIELDS.map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium mb-1">{f.label}</label>
                        <FocusInput
                          value={form[f.key]}
                          onChange={e => set(f.key, e.target.value)}
                          placeholder={f.placeholder}
                          error={fieldErrors[f.key]}
                        />
                      </div>
                    ))}
                  </div>

                  {error && (
                    <p
                      className="text-sm px-4 py-3 rounded-lg border"
                      style={{ color: '#f87171', backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}
                    >
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
                    Genera la mia analisi →
                  </button>
                  <p className="text-center text-xs" style={{ color: '#4a4a4a' }}>
                    Analisi generata da StreaMindAI · Un'analisi per account
                  </p>
                </form>
              </>
            )}
          </>
        )}

        {/* ── State C: risultati + banner upgrade ── */}
        {pageState === 'C' && slides && (
          <>
            <SlideShow
              slides={slides}
              username={user?.twitch_username ?? ''}
              analysisId={analysisId}
            />

            <div
              className="mt-8 rounded-2xl border p-8 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))',
                borderColor: 'rgba(139,92,246,0.25)',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
                Porta la tua crescita al livello successivo
              </p>
              <h2 className="text-xl font-extrabold mb-3">StreaMindAI lavora per te ogni sera</h2>
              <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: '#a0a0a0' }}>
                Il bot AI risponde alla tua chat in tempo reale, ricorda gli utenti abituali e ottimizza
                il coinvolgimento automaticamente. L'analisi si rigenera ogni mese con i tuoi dati aggiornati.
              </p>
              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 font-bold text-white px-7 py-3.5 rounded-xl text-sm transition-all duration-150"
                style={{ backgroundColor: PURPLE }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = PURPLE)}
              >
                Inizia la prova gratuita 7 giorni →
              </Link>
              <p className="text-xs mt-3" style={{ color: '#4a4a4a' }}>
                Annulla quando vuoi · Nessun addebito oggi
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
