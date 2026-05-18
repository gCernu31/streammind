import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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

function FocusInput({ type = 'text', value, onChange, placeholder, readOnly }) {
  return (
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
        border: '1px solid #2a2a2a',
        cursor: readOnly ? 'default' : 'text',
      }}
      onFocus={e => { if (!readOnly) e.target.style.borderColor = PURPLE; }}
      onBlur={e  => { if (!readOnly) e.target.style.borderColor = '#2a2a2a'; }}
    />
  );
}

export default function DashboardAnalisiPage({ user }) {
  const [pageState, setPageState] = useState('loading'); // loading | noAnalysis | hasAnalysis
  const [slides, setSlides] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [nextGenAt, setNextGenAt] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, twitch_username: user?.twitch_username ?? '' });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showRegenForm, setShowRegenForm] = useState(false);

  useEffect(() => {
    const token = getToken();
    fetch('/api/analytics/my-analysis', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.analysis) {
          setSlides(parseSlides(data.analysis, user?.twitch_username ?? ''));
          setAnalysisId(data.id ?? null);
          setNextGenAt(data.next_generation_at ?? null);
          if (data.form_data) {
            setForm(prev => ({ ...prev, ...data.form_data }));
          }
          setPageState('hasAnalysis');
          return;
        }
        // Nessuna analisi — pre-carica dati da Twitch
        fetch('/api/analytics/twitch-data', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(tw => {
            if (tw) {
              setForm(prev => ({
                ...prev,
                twitch_username: tw.twitch_username ?? user?.twitch_username ?? prev.twitch_username,
                total_followers: tw.total_followers != null ? String(tw.total_followers) : prev.total_followers,
                main_games:      tw.main_games ?? prev.main_games,
              }));
            }
            setPageState('noAnalysis');
          })
          .catch(() => setPageState('noAnalysis'));
      })
      .catch(() => setPageState('noAnalysis'));
  }, []);

  const canRegenerate = nextGenAt ? new Date(nextGenAt) <= new Date() : true;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
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
      setSlides(parseSlides(data.analysis, user?.twitch_username ?? ''));
      setAnalysisId(data.id ?? null);
      setNextGenAt(new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString());
      setShowRegenForm(false);
      setPageState('hasAnalysis');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const formSection = (submitLabel) => (
    <form onSubmit={handleGenerate} className="space-y-5">
      <div className="rounded-2xl border p-6 sm:p-8 space-y-5" style={{ backgroundColor: '#111', borderColor: '#222' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a4a' }}>Dati canale</p>

        <div>
          <label className="block text-sm font-medium mb-1">Username Twitch</label>
          <FocusInput
            value={form.twitch_username}
            onChange={e => setForm(p => ({ ...p, twitch_username: e.target.value }))}
            placeholder="Il tuo username"
            readOnly={!!user?.twitch_username}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {NUM_FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <FocusInput
                type="number"
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>

        {TEXT_FIELDS.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium mb-1">{f.label}</label>
            <FocusInput
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
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

      {generating ? (
        <div className="flex items-center gap-3 text-sm" style={{ color: '#a0a0a0' }}>
          <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#333', borderTopColor: PURPLE }} />
          Generazione in corso — circa 20-40 secondi…
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-150"
            style={{ backgroundColor: PURPLE }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = PURPLE)}
          >
            {submitLabel}
          </button>
          {showRegenForm && (
            <button
              type="button"
              onClick={() => { setShowRegenForm(false); setError(null); }}
              className="px-4 py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: '#a0a0a0' }}
            >
              Annulla
            </button>
          )}
        </div>
      )}
    </form>
  );

  return (
    <>
      <Helmet><title>La mia analisi | StreaMindAI</title></Helmet>

      {/* ── Loading ── */}
      {pageState === 'loading' && (
        <div className="py-16 flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: PURPLE }} />
        </div>
      )}

      {/* ── Nessuna analisi ── */}
      {pageState === 'noAnalysis' && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">La mia analisi</h2>
            <p style={{ color: '#a0a0a0', fontSize: '14px' }}>
              Genera la tua prima analisi strategica del canale Twitch — 12 sezioni con roadmap 90 giorni.
            </p>
          </div>

          {generating ? (
            <div className="py-16 flex flex-col items-center gap-5">
              <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: PURPLE }} />
              <div className="text-center">
                <p className="font-semibold mb-1">StreaMindAI sta analizzando il tuo canale…</p>
                <p className="text-sm" style={{ color: '#6b6b6b' }}>Circa 20-40 secondi</p>
              </div>
            </div>
          ) : (
            formSection('Genera analisi →')
          )}
        </>
      )}

      {/* ── Analisi esistente ── */}
      {pageState === 'hasAnalysis' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold">La mia analisi</h2>
            <div className="flex items-center gap-3">
              {nextGenAt && (
                <p className="text-xs" style={{ color: '#6b6b6b' }}>
                  {canRegenerate
                    ? 'Rigenerazione disponibile'
                    : `Rigenera dal ${new Date(nextGenAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`}
                </p>
              )}
              <button
                onClick={() => { setShowRegenForm(v => !v); setError(null); }}
                disabled={!canRegenerate}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: canRegenerate ? 'rgba(139,92,246,0.1)' : '#141414',
                  border: `1px solid ${canRegenerate ? 'rgba(139,92,246,0.3)' : '#222'}`,
                  color: canRegenerate ? PURPLE : '#3a3a3a',
                  cursor: canRegenerate ? 'pointer' : 'not-allowed',
                }}
              >
                🔄 Rigenera
              </button>
            </div>
          </div>

          {showRegenForm && (
            <div className="mb-8">
              <p className="text-sm mb-4" style={{ color: '#a0a0a0' }}>
                Aggiorna i dati del canale per rigenerare l'analisi con le informazioni più recenti.
              </p>
              {formSection('Rigenera analisi →')}
            </div>
          )}

          <SlideShow
            slides={slides}
            username={user?.twitch_username ?? ''}
            analysisId={analysisId}
          />
        </>
      )}
    </>
  );
}
