import { useEffect, useState } from 'react';
import axios from 'axios';

// ─── Giorni della settimana ───────────────────────────────────────────────────
const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function DayPills({ selected, onChange }) {
  const toggle = (day) =>
    onChange(selected.includes(day) ? selected.filter(d => d !== day) : [...selected, day]);
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map(day => (
        <button
          key={day}
          type="button"
          onClick={() => toggle(day)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border"
          style={
            selected.includes(day)
              ? { backgroundColor: 'rgba(139,92,246,0.18)', borderColor: '#8B5CF6', color: '#8B5CF6' }
              : { backgroundColor: 'transparent', borderColor: '#262626', color: '#6b6b6b' }
          }
        >
          {day}
        </button>
      ))}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      title={checked ? 'Attivo' : 'Disattivato'}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none"
      style={{ backgroundColor: checked ? '#8B5CF6' : '#333' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(3px)' }}
      />
    </button>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-hally-text">{label}</label>
      {hint && <p className="text-xs text-hally-text-muted mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="font-semibold text-base border-b border-hally-border pb-3 mb-5">{children}</h2>;
}

const IconPlus = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <path d="M8 2v12M2 8h12" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5">
    <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l.8 9.5c0 .3.2.5.5.5h7.4c.3 0 .5-.2.5-.5L13 4" />
  </svg>
);

// ─── Messaggi eventi ──────────────────────────────────────────────────────────
const EVENT_LABELS = {
  follow:     { label: 'Nuovo follower',  hint: 'Var: {username}',                    placeholder: 'Es. Benvenuto/a {username}! Grazie per il follow! ❤️' },
  subscribe:  { label: 'Nuova sub',       hint: 'Var: {username}, {months}',          placeholder: 'Es. {username} è diventato/a supporter! Grazie mille! ⭐' },
  gift_sub:   { label: 'Gift sub',        hint: 'Var: {gifter}, {recipient}, {count}',placeholder: 'Es. {gifter} ha regalato una sub a {recipient}! 🎁' },
  cheer:      { label: 'Cheer bits',      hint: 'Var: {username}, {bits}',            placeholder: 'Es. {username} ha cheered {bits} bits! 💜' },
  hype_train: { label: 'Hype Train',      hint: 'Var: {username}, {level}',           placeholder: 'Es. HYPE TRAIN avviato da {username}! 🚂' },
  raid:       { label: 'Raid in arrivo',  hint: 'Var: {raider}, {count}',             placeholder: 'Es. RAID di {raider} con {count} persone! 🎯' },
};

const EMPTY_EVENT_MESSAGES = Object.fromEntries(Object.keys(EVENT_LABELS).map(k => [k, '']));

// ─── Filtro termini bannabili Twitch ─────────────────────────────────────────
const BANNED = [
  { r: /\bn[i!1l]+g{1,2}[ae3]r+s?\b/i,  cat: 'insulto razziale' },
  { r: /\bn[i!1l]+g{1,2}[ae3]s?\b/i,    cat: 'insulto razziale' },
  { r: /\bspics?\b/i,                    cat: 'insulto razziale' },
  { r: /\bgooks?\b/i,                    cat: 'insulto razziale' },
  { r: /\bwetbacks?\b/i,                 cat: 'insulto razziale' },
  { r: /\bkik[e3]s?\b/i,                 cat: 'insulto razziale' },
  { r: /\bcoons?\b/i,                    cat: 'insulto razziale' },
  { r: /\bzingaracc[oi]\b/i,             cat: 'insulto razziale' },
  { r: /\bterron[ei]\b/i,                cat: 'insulto razziale' },
  { r: /\bf[a4]g+[o0]ts?\b/i,           cat: "linguaggio d'odio" },
  { r: /\bf[a4]gs?\b/i,                  cat: "linguaggio d'odio" },
  { r: /\bdyk[e3]s?\b/i,                 cat: "linguaggio d'odio" },
  { r: /\btr[a4]nn[iy]s?\b/i,            cat: "linguaggio d'odio" },
  { r: /\bporn[o]?\b/i,                  cat: 'contenuto sessuale esplicito' },
  { r: /\bcunts?\b/i,                    cat: 'contenuto sessuale esplicito' },
];

function detectBanned(text) {
  if (!text) return null;
  for (const { r, cat } of BANNED) {
    if (r.test(text)) return cat;
  }
  return null;
}

// ─── Default config vuota ─────────────────────────────────────────────────────
const EMPTY = {
  bot_name: '',
  creator_name: '',
  bot_personality: '',
  twitch_username: '',
  stream_schedule: { days: [], time_start: '21:00', time_end: '00:00' },
  social_links: { linktree: '', instagram: '', youtube: '', discord: '' },
  characters: [],
  custom_commands: [],
  event_messages: { ...EMPTY_EVENT_MESSAGES },
};

let _mid = 1;
let _kid = 1;
const newMember = () => ({ id: _mid++, twitch_username: '', nickname: '', description: '' });
const newCmd    = () => ({ id: _kid++, trigger: '', response: '', active: true });

// ─── Pagina principale ────────────────────────────────────────────────────────
export default function ConfigPage() {
  const [config, setConfig]       = useState(null);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [banError, setBanError]   = useState(null);
  const [plan, setPlan]           = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('streammindai_token');
    axios.get('/api/config', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const d = r.data ?? {};
        setConfig({
          ...EMPTY,
          ...d,
          stream_schedule: d.stream_schedule ?? EMPTY.stream_schedule,
          social_links:    d.social_links    ?? EMPTY.social_links,
          characters:      d.characters      ?? [],
          custom_commands: d.custom_commands ?? [],
          event_messages:  d.event_messages  ?? { ...EMPTY_EVENT_MESSAGES },
        });
      })
      .catch(() => setConfig({ ...EMPTY }));

    axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setPlan(r.data.subscription?.plan ?? 'starter'))
      .catch(() => setPlan('starter'));
  }, []);

  const set       = (k, v)      => setConfig(p => ({ ...p, [k]: v }));
  const setNested = (k, sub, v) => setConfig(p => ({ ...p, [k]: { ...p[k], [sub]: v } }));

  // Membri
  const addMember    = ()         => set('characters', [...config.characters, newMember()]);
  const removeMember = id         => set('characters', config.characters.filter(c => c.id !== id));
  const updateMember = (id, f, v) => set('characters', config.characters.map(c => c.id === id ? { ...c, [f]: v } : c));

  // Commands
  const addCmd    = ()           => set('custom_commands', [...config.custom_commands, newCmd()]);
  const removeCmd = id           => set('custom_commands', config.custom_commands.filter(c => c.id !== id));
  const updateCmd = (id, f, v)   => set('custom_commands', config.custom_commands.map(c => c.id === id ? { ...c, [f]: v } : c));

  const handleSave = async () => {
    setBanError(null);

    // Controllo termini bannabili Twitch
    const fields = [
      { val: config.bot_name,        label: 'Nome bot' },
      { val: config.bot_personality, label: 'Personalità' },
    ];
    for (const { val, label } of fields) {
      const cat = detectBanned(val);
      if (cat) {
        setBanError(`Il campo "${label}" contiene ${cat} non consentito dalle linee guida Twitch.`);
        return;
      }
    }
    for (const m of config.characters ?? []) {
      const cat = detectBanned(m.nickname) || detectBanned(m.description);
      if (cat) {
        setBanError(`Un membro contiene ${cat} non consentito dalle linee guida Twitch.`);
        return;
      }
    }

    setSaveState('saving');
    try {
      const token = localStorage.getItem('streammindai_token');
      await axios.put('/api/config', config, { headers: { Authorization: `Bearer ${token}` } });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 4000);
    }
  };

  if (!config) {
    return <div className="text-hally-text-muted text-sm py-8 text-center">Caricamento configurazione...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Il Mio Bot</h1>
        <p className="text-hally-text-muted text-sm">Personalizza come StreaMindAI si comporta nel tuo canale.</p>
      </div>

      <div className="space-y-6">

        {/* ── IDENTITÀ ── */}
        <div className="card">
          <SectionTitle>Identità</SectionTitle>
          <div className="space-y-5">

            <Field label="Nome" hint="Come si chiama StreaMindAI in chat. Es. StreamBot, MaxAI, NightBot…">
              <input
                className="input"
                value={config.bot_name}
                onChange={e => set('bot_name', e.target.value)}
                placeholder="Es. StreamBot"
              />
            </Field>

            <Field label="Come chiami il tuo streamer" hint="Il nome con cui StreaMindAI si riferisce a te in chat.">
              <input
                className="input"
                value={config.creator_name}
                onChange={e => set('creator_name', e.target.value)}
                placeholder="Es. Signor gCernu, Boss, Il Capo…"
              />
            </Field>

            <Field label="Personalità base" hint="Descrivi il carattere di StreaMindAI: tono, stile, humour, riferimenti alla tua community.">
              <textarea
                className="input min-h-[148px] resize-y"
                value={config.bot_personality}
                onChange={e => set('bot_personality', e.target.value)}
                placeholder={`Es. Sei un bot diretto e ironico, ami i giochi indie e i meme della community. Usi un tono informale, a volte sarcasmo leggero, ma sempre rispettoso. Conosci le reference interne della chat come "modacoda" e "la regola del giovedì".`}
              />
            </Field>

          </div>
        </div>

        {/* ── CANALE ── */}
        <div className="card">
          <SectionTitle>Canale</SectionTitle>
          <div className="space-y-5">

            <Field label="Username Twitch">
              <input
                className="input"
                value={config.twitch_username}
                onChange={e => set('twitch_username', e.target.value)}
                placeholder="Es. gcernu"
              />
            </Field>

            <Field label="Orari streaming" hint="Seleziona i giorni in cui vai in live e l'orario di solito.">
              <DayPills
                selected={config.stream_schedule.days}
                onChange={days => setNested('stream_schedule', 'days', days)}
              />
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-hally-text-muted w-8">Dalle</span>
                  <input
                    type="time"
                    className="input w-32 text-sm py-1.5"
                    value={config.stream_schedule.time_start}
                    onChange={e => setNested('stream_schedule', 'time_start', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-hally-text-muted w-4">alle</span>
                  <input
                    type="time"
                    className="input w-32 text-sm py-1.5"
                    value={config.stream_schedule.time_end}
                    onChange={e => setNested('stream_schedule', 'time_end', e.target.value)}
                  />
                </div>
              </div>
            </Field>

            <Field label="Linktree / Link principale">
              <input
                className="input"
                value={config.social_links.linktree}
                onChange={e => setNested('social_links', 'linktree', e.target.value)}
                placeholder="https://linktr.ee/gcernu"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Instagram">
                <input
                  className="input"
                  value={config.social_links.instagram}
                  onChange={e => setNested('social_links', 'instagram', e.target.value)}
                  placeholder="@handle"
                />
              </Field>
              <Field label="YouTube">
                <input
                  className="input"
                  value={config.social_links.youtube}
                  onChange={e => setNested('social_links', 'youtube', e.target.value)}
                  placeholder="youtube.com/canale"
                />
              </Field>
              <Field label="Discord">
                <input
                  className="input"
                  value={config.social_links.discord}
                  onChange={e => setNested('social_links', 'discord', e.target.value)}
                  placeholder="discord.gg/invito"
                />
              </Field>
            </div>

          </div>
        </div>

        {/* ── MEMBRI ── */}
        <div className="card">
          <SectionTitle>Membri</SectionTitle>
          <p className="text-xs text-hally-text-muted mb-4">
            Aggiungi i membri fissi della tua community. StreaMindAI li riconoscerà per nome e si comporterà di conseguenza.
          </p>

          <div className="space-y-3 mb-4">
            {config.characters.length === 0 && (
              <p className="text-sm text-hally-text-muted py-6 text-center border border-dashed border-hally-border rounded-lg">
                Nessun membro aggiunto ancora.
              </p>
            )}
            {config.characters.map(member => (
              <div
                key={member.id}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg border border-hally-border bg-hally-bg"
              >
                <div>
                  <label className="text-xs text-hally-text-muted block mb-1">Username Twitch</label>
                  <input
                    className="input text-sm"
                    value={member.twitch_username}
                    onChange={e => updateMember(member.id, 'twitch_username', e.target.value)}
                    placeholder="Es. xX_modacoda_Xx"
                  />
                </div>
                <div>
                  <label className="text-xs text-hally-text-muted block mb-1">Soprannome</label>
                  <input
                    className="input text-sm"
                    value={member.nickname}
                    onChange={e => updateMember(member.id, 'nickname', e.target.value)}
                    placeholder="Es. Il Moderatore"
                  />
                </div>
                <div className="relative">
                  <label className="text-xs text-hally-text-muted block mb-1">Descrizione comportamento</label>
                  <input
                    className="input text-sm pr-8"
                    value={member.description}
                    onChange={e => updateMember(member.id, 'description', e.target.value)}
                    placeholder="Es. Moderatore storico, sempre ironico"
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="absolute right-2.5 top-[26px] text-hally-text-muted hover:text-red-400 transition-colors"
                    title="Rimuovi membro"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMember}
            className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:opacity-80"
            style={{ color: '#8B5CF6' }}
          >
            <IconPlus />
            Aggiungi membro
          </button>
        </div>

        {/* ── MESSAGGI EVENTI ── */}
        <div className="card relative overflow-hidden">
          <SectionTitle>Messaggi eventi</SectionTitle>

          {/* Lock overlay per piani inferiori a elite */}
          {plan !== null && plan !== 'elite' && plan !== 'signature' && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
              style={{ backgroundColor: 'rgba(13,13,13,0.88)', backdropFilter: 'blur(4px)' }}
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-6 h-6" style={{ color: '#8B5CF6' }}>
                  <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <p className="font-semibold mb-1">Disponibile dal piano Elite</p>
              <p className="text-xs text-center max-w-xs mb-4" style={{ color: '#6b6b6b' }}>
                Personalizza i messaggi per ogni evento Twitch — follow, sub, cheer, raid e altro.
              </p>
              <a
                href="/subscription"
                className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-colors duration-150"
                style={{ backgroundColor: '#8B5CF6' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7C3AED'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8B5CF6'}
              >
                Aggiorna piano →
              </a>
            </div>
          )}

          <p className="text-xs text-hally-text-muted mb-5">
            Personalizza cosa dice StreaMindAI per ogni evento Twitch. Lascia vuoto per usare la risposta automatica.
          </p>

          <div className="space-y-4">
            {Object.entries(EVENT_LABELS).map(([key, meta]) => (
              <div key={key} className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 items-start">
                <div className="pt-2">
                  <p className="text-sm font-medium text-hally-text">{meta.label}</p>
                  <p className="text-[11px] text-hally-text-muted mt-0.5">{meta.hint}</p>
                </div>
                <input
                  className="input text-sm"
                  value={config?.event_messages?.[key] ?? ''}
                  onChange={e => setConfig(p => ({
                    ...p,
                    event_messages: { ...p.event_messages, [key]: e.target.value },
                  }))}
                  placeholder={meta.placeholder}
                  disabled={plan !== null && plan !== 'elite' && plan !== 'signature'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── COMANDI ── */}
        <div className="card">
          <SectionTitle>Comandi personalizzati</SectionTitle>
          <p className="text-xs text-hally-text-muted mb-4">
            Crea comandi custom per la tua chat. Quando qualcuno scrive il trigger, StreaMindAI risponde con il testo configurato.
          </p>

          <div className="space-y-3 mb-4">
            {config.custom_commands.length === 0 && (
              <p className="text-sm text-hally-text-muted py-6 text-center border border-dashed border-hally-border rounded-lg">
                Nessun comando personalizzato ancora.
              </p>
            )}
            {config.custom_commands.map(cmd => (
              <div
                key={cmd.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-hally-border bg-hally-bg"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-hally-text-muted block mb-1">Trigger</label>
                    <input
                      className="input text-sm font-mono"
                      value={cmd.trigger}
                      onChange={e => updateCmd(cmd.id, 'trigger', e.target.value)}
                      placeholder="Es. !social, !discord, !orario"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-hally-text-muted block mb-1">Risposta</label>
                    <input
                      className="input text-sm"
                      value={cmd.response}
                      onChange={e => updateCmd(cmd.id, 'response', e.target.value)}
                      placeholder="Es. Seguimi su instagram: @gcernu"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2.5 pt-5 shrink-0">
                  <Toggle
                    checked={cmd.active}
                    onChange={v => updateCmd(cmd.id, 'active', v)}
                  />
                  <button
                    type="button"
                    onClick={() => removeCmd(cmd.id)}
                    className="text-hally-text-muted hover:text-red-400 transition-colors"
                    title="Rimuovi comando"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCmd}
            className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:opacity-80"
            style={{ color: '#8B5CF6' }}
          >
            <IconPlus />
            Aggiungi comando
          </button>
        </div>

      </div>

      {/* ── SALVA ── */}
      <div className="mt-8 space-y-3">
        {banError && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-lg border text-sm"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#f87171' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4 flex-shrink-0 mt-0.5">
              <path d="M8 6v3M8 11.5v.5M3.3 13h9.4L8 3 3.3 13z" />
            </svg>
            <span>{banError} Rimuovi il termine prima di salvare.</span>
          </div>
        )}

        <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="btn-primary min-w-[170px]"
        >
          {saveState === 'saving' ? 'Salvataggio...' : 'Salva configurazione'}
        </button>

        {saveState === 'saved' && (
          <span className="text-green-400 text-sm flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M2.5 8.5l4 4 7-8" />
            </svg>
            Salvato con successo
          </span>
        )}

        {saveState === 'error' && (
          <span className="text-red-400 text-sm flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M8 6v3M8 11.5v.5M3.3 13h9.4L8 3 3.3 13z" />
            </svg>
            Errore nel salvataggio
          </span>
        )}
        </div>
      </div>
    </div>
  );
}
