import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import SlideShow, { parseSlides } from '../components/SlideShow.jsx';
import { getToken } from '../utils/auth.js';

const PURPLE = '#8B5CF6';
const GREEN  = '#4ade80';

const EMPTY_FORM = {
  twitch_username:  '',
  total_followers:  '',
  avg_viewers:      '',
  main_games:       '',
  years_active:     '',
  current_subs:     '',
  hours_per_week:   '',
  main_goal:        '',
  has_socials:      false,
  social_links:     '',
  stream_schedule:  '',
};

// ── Componenti UI ─────────────────────────────────────────────────────────────

function TwitchBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: GREEN, border: '1px solid rgba(74,222,128,0.25)' }}>
      ✓ Twitch
    </span>
  );
}

function Field({ label, children, badge }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-medium">{label}</label>
        {badge && <TwitchBadge />}
      </div>
      {children}
    </div>
  );
}

function TextInput({ type = 'text', value, onChange, placeholder, readOnly }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: '8px',
        backgroundColor: readOnly ? '#0a0a0a' : '#0d0d0d', color: '#f0f0f0',
        fontSize: '14px', outline: 'none', transition: 'border-color 0.15s',
        boxSizing: 'border-box', border: '1px solid #2a2a2a',
        cursor: readOnly ? 'default' : 'text',
      }}
      onFocus={e => { if (!readOnly) e.target.style.borderColor = PURPLE; }}
      onBlur={e  => { if (!readOnly) e.target.style.borderColor = '#2a2a2a'; }}
    />
  );
}

function SelectInput({ value, onChange, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={onChange}
        style={{
          width: '100%', padding: '10px 36px 10px 14px', borderRadius: '8px',
          backgroundColor: '#0d0d0d', color: value ? '#f0f0f0' : '#6b6b6b',
          fontSize: '14px', border: '1px solid #2a2a2a',
          outline: 'none', cursor: 'pointer', appearance: 'none', boxSizing: 'border-box',
        }}
        onFocus={e => (e.target.style.borderColor = PURPLE)}
        onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
      >
        {children}
      </select>
      <svg viewBox="0 0 16 16" fill="none" stroke="#6b6b6b" strokeWidth="1.5" strokeLinecap="round"
        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', pointerEvents: 'none' }}>
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} aria-pressed={value}
      style={{
        flexShrink: 0, width: '44px', height: '24px', borderRadius: '12px',
        backgroundColor: value ? PURPLE : '#2a2a2a',
        transition: 'background-color 0.2s', border: 'none', cursor: 'pointer', position: 'relative',
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: value ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '9px',
        backgroundColor: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  );
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function DashboardAnalisiPage({ user }) {
  const [pageState, setPageState]       = useState('loading'); // loading | noAnalysis | hasAnalysis
  const [slides, setSlides]             = useState(null);
  const [analysisId, setAnalysisId]     = useState(null);
  const [nextGenAt, setNextGenAt]       = useState(null);
  const [form, setForm]                 = useState({ ...EMPTY_FORM, twitch_username: user?.twitch_username ?? '' });
  const [fetchedFields, setFetchedFields] = useState({});
  const [generating, setGenerating]     = useState(false);
  const [error, setError]               = useState(null);
  const [showRegenForm, setShowRegenForm] = useState(false);

  useEffect(() => {
    const token = getToken();
    fetch('/api/analytics/my-analysis', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.analysis) {
          setSlides(parseSlides(data.analysis, user?.twitch_username ?? ''));
          setAnalysisId(data.id ?? null);
          setNextGenAt(data.next_generation_at ?? null);
          if (data.form_data) setForm(prev => ({ ...prev, ...data.form_data }));
          setPageState('hasAnalysis');
          return;
        }
        // Nessuna analisi — pre-carica dati da Twitch
        fetch('/api/analytics/twitch-data', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then(tw => {
            const prefills = { twitch_username: tw?.twitch_username ?? user?.twitch_username ?? '' };
            const fetched  = {};
            if (tw?.total_followers != null) { prefills.total_followers = String(tw.total_followers); fetched.total_followers = true; }
            if (tw?.main_games)              { prefills.main_games      = tw.main_games;              fetched.main_games      = true; }
            if (tw?.years_active != null)    { prefills.years_active    = String(tw.years_active);    fetched.years_active    = true; }
            if (tw?.avg_viewers  != null)    { prefills.avg_viewers     = String(tw.avg_viewers);     fetched.avg_viewers     = true; }
            setForm(prev => ({ ...prev, ...prefills }));
            setFetchedFields(fetched);
            setPageState('noAnalysis');
          })
          .catch(() => setPageState('noAnalysis'));
      })
      .catch(() => setPageState('noAnalysis'));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const canRegenerate = nextGenAt ? new Date(nextGenAt) <= new Date() : true;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    const token = getToken();
    try {
      const r = await fetch('/api/analytics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  const formBody = (submitLabel) => (
    <form onSubmit={handleGenerate} className="space-y-4">

      {/* Sezione 1: Dati Twitch */}
      <div className="rounded-2xl border p-6 sm:p-8 space-y-5" style={{ backgroundColor: '#111', borderColor: '#222' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a4a' }}>Dati estratti da Twitch</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Follower totali" badge={fetchedFields.total_followers}>
            <TextInput type="number" value={form.total_followers} onChange={e => set('total_followers', e.target.value)} placeholder="Es. 500" />
          </Field>
          <Field label="Spettatori medi per live" badge={fetchedFields.avg_viewers}>
            <TextInput type="number" value={form.avg_viewers} onChange={e => set('avg_viewers', e.target.value)} placeholder="Es. 30" />
          </Field>
        </div>

        <Field label="Giochi principali (ultimi 5)" badge={fetchedFields.main_games}>
          <TextInput value={form.main_games} onChange={e => set('main_games', e.target.value)} placeholder="Es. Valorant, Minecraft, GTA V" />
        </Field>

        <Field label="Anni di attività su Twitch" badge={fetchedFields.years_active}>
          <TextInput type="number" value={form.years_active} onChange={e => set('years_active', e.target.value)} placeholder="Es. 3" />
        </Field>
      </div>

      {/* Sezione 2: Dati manuali */}
      <div className="rounded-2xl border p-6 sm:p-8 space-y-5" style={{ backgroundColor: '#111', borderColor: '#222' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a4a' }}>Completa il profilo</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Sub attuali">
            <TextInput type="number" value={form.current_subs} onChange={e => set('current_subs', e.target.value)} placeholder="Es. 10" />
          </Field>
          <Field label="Ore live a settimana">
            <SelectInput value={form.hours_per_week} onChange={e => set('hours_per_week', e.target.value)}>
              <option value="" disabled>Seleziona...</option>
              <option value="1-2 ore">1-2 ore</option>
              <option value="3-5 ore">3-5 ore</option>
              <option value="6-9 ore">6-9 ore</option>
              <option value="10-19 ore">10-19 ore</option>
              <option value="20+ ore">20+ ore</option>
            </SelectInput>
          </Field>
        </div>

        <Field label="Obiettivo principale">
          <SelectInput value={form.main_goal} onChange={e => set('main_goal', e.target.value)}>
            <option value="" disabled>Seleziona...</option>
            <option value="Crescere i follower">Crescere i follower</option>
            <option value="Aumentare i sub">Aumentare i sub</option>
            <option value="Monetizzare il canale">Monetizzare il canale</option>
            <option value="Costruire una community">Costruire una community solida</option>
          </SelectInput>
        </Field>

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium">Usi i social per promuovere le live?</p>
            <p className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>TikTok, Instagram, Twitter/X, YouTube Shorts…</p>
          </div>
          <Toggle value={form.has_socials} onChange={v => set('has_socials', v)} />
        </div>

        {form.has_socials && (
          <Field label="Link social / Linktree (opzionale)">
            <TextInput value={form.social_links} onChange={e => set('social_links', e.target.value)} placeholder="Es. linktr.ee/mionome o @mionome" />
          </Field>
        )}

        <Field label="Orari di streaming (opzionale)">
          <TextInput value={form.stream_schedule} onChange={e => set('stream_schedule', e.target.value)} placeholder="Es. Venerdì e Sabato dalle 21:00" />
        </Field>
      </div>

      {error && (
        <p className="text-sm px-4 py-3 rounded-lg border"
          style={{ color: '#f87171', backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
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
          <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-150"
            style={{ backgroundColor: PURPLE }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = PURPLE)}
          >
            {submitLabel}
          </button>
          {showRegenForm && (
            <button type="button" onClick={() => { setShowRegenForm(false); setError(null); }}
              className="px-4 py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: '#a0a0a0' }}>
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

      {/* Loading */}
      {pageState === 'loading' && (
        <div className="py-16 flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: PURPLE }} />
        </div>
      )}

      {/* Nessuna analisi */}
      {pageState === 'noAnalysis' && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">La mia analisi</h2>
            <p style={{ color: '#a0a0a0', fontSize: '14px' }}>
              Genera la tua prima analisi strategica — 12 sezioni con roadmap 90 giorni.{' '}
              I campi <TwitchBadge /> sono stati pre-compilati automaticamente dal tuo profilo.
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
            formBody('Genera analisi →')
          )}
        </>
      )}

      {/* Analisi esistente */}
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
              {formBody('Rigenera analisi →')}
            </div>
          )}

          <SlideShow slides={slides} username={user?.twitch_username ?? ''} analysisId={analysisId} />
        </>
      )}
    </>
  );
}
