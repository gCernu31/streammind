import { useEffect, useState } from 'react';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Limiti messaggi mensili per piano
// ---------------------------------------------------------------------------

const MONTHLY_LIMITS = {
  starter:   2_000,
  creator:   6_000,
  elite:     13_000,
  signature: 33_000,
};

// ---------------------------------------------------------------------------
// Dati mock
// ---------------------------------------------------------------------------

const MOCK = {
  botStatus:  'online',
  botName:    'StreamBot',
  channel:    'gcernu',
  uptimeSince: 'Oggi alle 20:15',

  messagesToday:   47,
  messagesTodayDelta: +12,   // rispetto a ieri

  memoriesCount:   284,
  memoriesThisWeek: 8,

  subscription: {
    status:         'active',
    plan:           'Pro',
    daysRemaining:  18,
    totalDays:      30,
    expiresAt:      '27 mag 2025',
  },
};

const MOCK_USAGE = [
  { day: 'Lun', count: 45 },
  { day: 'Mar', count: 67 },
  { day: 'Mer', count: 23 },
  { day: 'Gio', count: 89 },
  { day: 'Ven', count: 134 },
  { day: 'Sab', count: 201 },
  { day: 'Dom', count: 47, today: true },
];

const MOCK_MEMORIES = [
  {
    id: 1,
    category: 'inside_joke',
    subject: 'La caduta del boss',
    content: 'darkwolf_99 è caduto 47 volte sullo stesso boss in Dark Souls — record del canale',
    created_at: '2025-05-09',
  },
  {
    id: 2,
    category: 'utente',
    subject: 'marta_plays',
    content: 'Preferisce i giochi horror, detesta i platformer difficili',
    created_at: '2025-05-08',
  },
  {
    id: 3,
    category: 'promessa',
    subject: 'Sub marathon',
    content: 'gCernu ha promesso una sub marathon al raggiungimento di 600 follower',
    created_at: '2025-05-08',
  },
  {
    id: 4,
    category: 'evento',
    subject: 'Torneo Minecraft',
    content: 'Organizzato torneo comunitario con 12 partecipanti — vince luigi_gamer',
    created_at: '2025-05-07',
  },
  {
    id: 5,
    category: 'nome_gioco',
    subject: 'Elden Ring',
    content: 'Il gioco preferito della community, citato spesso in chat',
    created_at: '2025-05-06',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function catStyle(cat) {
  const m = {
    inside_joke: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
    utente:      { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    promessa:    { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
    evento:      { bg: 'rgba(234,179,8,0.12)',   color: '#fbbf24', border: 'rgba(234,179,8,0.3)' },
    nome_gioco:  { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  };
  return m[cat] ?? { bg: 'rgba(113,113,122,0.12)', color: '#a1a1aa', border: 'rgba(113,113,122,0.3)' };
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Card: Bot Status
// ---------------------------------------------------------------------------

function BotStatusCard({ status, botName, channel, uptimeSince }) {
  const online = status === 'online';
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-hally-text-muted text-xs font-medium uppercase tracking-wider">Stato bot</p>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={online
            ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
            : { backgroundColor: 'rgba(239,68,68,0.12)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }
          }
        >
          <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
      <div>
        <p className="text-xl font-bold text-hally-text truncate">{botName}</p>
        <p className="text-xs text-hally-text-muted mt-0.5">#{channel}</p>
      </div>
      {online && (
        <p className="text-xs text-hally-text-muted border-t border-hally-border pt-2.5">
          Attivo da: <span className="text-hally-text-soft">{uptimeSince}</span>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card: Utilizzi oggi
// ---------------------------------------------------------------------------

function UsageCard({ value, delta }) {
  const up = delta >= 0;
  return (
    <div className="card flex flex-col gap-3">
      <p className="text-hally-text-muted text-xs font-medium uppercase tracking-wider">Utilizzi oggi</p>
      <div>
        <p className="text-4xl font-extrabold text-hally-text">{value}</p>
        <p className="text-xs text-hally-text-muted mt-1">comandi ricevuti</p>
      </div>
      <div
        className="flex items-center gap-1.5 text-xs font-medium border-t border-hally-border pt-2.5"
        style={{ color: up ? '#4ade80' : '#f87171' }}
      >
        <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
          {up
            ? <path d="M6 2L10 7H2L6 2Z"/>
            : <path d="M6 10L2 5H10L6 10Z"/>
          }
        </svg>
        {up ? '+' : ''}{delta} rispetto a ieri
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card: Memorie
// ---------------------------------------------------------------------------

function MemoriesCard({ total, thisWeek }) {
  return (
    <div className="card flex flex-col gap-3">
      <p className="text-hally-text-muted text-xs font-medium uppercase tracking-wider">Memorie salvate</p>
      <div>
        <p className="text-4xl font-extrabold text-hally-text">{total}</p>
        <p className="text-xs text-hally-text-muted mt-1">memoria totale</p>
      </div>
      <div
        className="flex items-center gap-1.5 text-xs font-medium border-t border-hally-border pt-2.5"
        style={{ color: '#8B5CF6' }}
      >
        <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
          <path d="M6 2L10 7H2L6 2Z"/>
        </svg>
        +{thisWeek} questa settimana
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card: Abbonamento + Messaggi mensili
// ---------------------------------------------------------------------------

function SubscriptionCard({ status, plan, daysRemaining, totalDays, expiresAt, monthly }) {
  const pctRemaining = totalDays > 0 ? (daysRemaining / totalDays) * 100 : 0;
  const isLow = daysRemaining < 7;
  const barColor = isLow ? '#f87171' : '#8B5CF6';
  const active = status === 'active';

  const monthlyLimit = MONTHLY_LIMITS[monthly?.plan ?? plan?.toLowerCase() ?? 'starter'] ?? 2_000;
  const monthlyCount = monthly?.count ?? 0;
  const monthlyPct   = Math.min((monthlyCount / monthlyLimit) * 100, 100);
  const monthlyColor = monthlyPct > 85 ? '#f87171' : monthlyPct > 60 ? '#fbbf24' : '#8B5CF6';

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-hally-text-muted text-xs font-medium uppercase tracking-wider">Abbonamento</p>
        {active && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            {plan}
          </span>
        )}
      </div>

      {active ? (
        <>
          <div>
            <p className="text-4xl font-extrabold text-hally-text">
              {daysRemaining}
              <span className="text-lg font-medium text-hally-text-muted ml-1">gg</span>
            </p>
            <p className="text-xs text-hally-text-muted mt-0.5">Scade il {expiresAt}</p>
          </div>
          <div className="border-t border-hally-border pt-2.5 space-y-1.5">
            <div className="h-1.5 rounded-full bg-hally-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pctRemaining}%`, backgroundColor: barColor }}
              />
            </div>
            <p className="text-xs text-hally-text-muted">{pctRemaining.toFixed(0)}% rimanente</p>
          </div>
          {/* Contatore messaggi mensili */}
          <div className="border-t border-hally-border pt-2.5 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-hally-text-muted">Messaggi questo mese</span>
              <span className="font-medium text-hally-text">
                {monthlyCount.toLocaleString('it-IT')} / {monthlyLimit.toLocaleString('it-IT')}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-hally-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${monthlyPct}%`, backgroundColor: monthlyColor }}
              />
            </div>
          </div>
        </>
      ) : (
        <div>
          <p className="text-sm font-medium text-hally-text-muted">Nessun piano attivo</p>
          <a href="/subscription" className="text-xs font-semibold mt-2 inline-block" style={{ color: '#8B5CF6' }}>
            Attiva StreamMind →
          </a>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grafico utilizzi (SVG area chart)
// ---------------------------------------------------------------------------

function UsageChart({ data }) {
  const W = 500, H = 150;
  const pL = 36, pR = 12, pT = 14, pB = 28;
  const cW = W - pL - pR;
  const cH = H - pT - pB;
  const max = Math.max(...data.map(d => d.count), 1);

  const pts = data.map((d, i) => ({
    x: pL + (i / (data.length - 1)) * cW,
    y: pT + (1 - d.count / max) * cH,
    ...d,
  }));

  // Bezier smooth
  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C${cx},${prev.y.toFixed(1)} ${cx},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, '');

  const last = pts.at(-1);
  const first = pts[0];
  const areaPath = `${linePath} L${last.x.toFixed(1)},${(pT + cH).toFixed(1)} L${first.x.toFixed(1)},${(pT + cH).toFixed(1)} Z`;

  const yTicks = [0, 0.5, 1].map(t => ({
    y: pT + (1 - t) * cH,
    label: Math.round(max * t),
  }));

  // Totale della settimana
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-hally-text">Utilizzi ultimi 7 giorni</h2>
          <p className="text-xs text-hally-text-muted mt-0.5">{total} comandi totali</p>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          7 giorni
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '150px' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8B5CF6" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Grid orizzontale */}
        {yTicks.map(({ y, label }) => (
          <g key={label}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="#1e1e1e" strokeWidth="1"/>
            <text x={pL - 6} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#4a4a4a" fontFamily="Inter, sans-serif">{label}</text>
          </g>
        ))}

        {/* Area + linea */}
        <path d={areaPath} fill="url(#areaGrad)"/>
        <path d={linePath} stroke="#8B5CF6" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

        {/* Punti */}
        {pts.map((p, i) => (
          <g key={i}>
            {p.today && (
              <circle cx={p.x} cy={p.y} r="9" fill="rgba(139,92,246,0.15)"/>
            )}
            <circle
              cx={p.x} cy={p.y}
              r={p.today ? 5 : 4}
              fill={p.today ? '#8B5CF6' : '#151515'}
              stroke="#8B5CF6"
              strokeWidth="2.5"
            />
            {/* Label valore per oggi */}
            {p.today && (
              <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="10" fill="#8B5CF6" fontWeight="600" fontFamily="Inter, sans-serif">
                {p.count}
              </text>
            )}
          </g>
        ))}

        {/* Etichette giorni */}
        {pts.map((p, i) => (
          <text
            key={i}
            x={p.x} y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill={p.today ? '#8B5CF6' : '#5a5a5a'}
            fontWeight={p.today ? '600' : '400'}
            fontFamily="Inter, sans-serif"
          >
            {data[i].day}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed ultime memorie
// ---------------------------------------------------------------------------

function MemoryFeed({ memories }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-hally-text">Ultime memorie salvate</h2>
        <a href="/memory" className="text-xs font-medium transition-colors" style={{ color: '#8B5CF6' }}
          onMouseEnter={e => e.currentTarget.style.color = '#7C3AED'}
          onMouseLeave={e => e.currentTarget.style.color = '#8B5CF6'}
        >
          Vedi tutte →
        </a>
      </div>

      <div className="space-y-2.5">
        {memories.map((m) => {
          const s = catStyle(m.category);
          return (
            <div
              key={m.id}
              className="flex items-start gap-3 p-3 rounded-lg border transition-colors duration-150"
              style={{ backgroundColor: '#111', borderColor: '#222' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
            >
              {/* Dot categoria */}
              <div
                className="mt-1 w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded border"
                    style={{ backgroundColor: s.bg, color: s.color, borderColor: s.border }}
                  >
                    {m.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-medium text-hally-text truncate">{m.subject}</span>
                </div>
                <p className="text-xs text-hally-text-muted truncate">{m.content}</p>
              </div>

              <span className="text-[10px] text-hally-text-muted shrink-0 mt-0.5">{formatDate(m.created_at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage({ user }) {
  const { subscription: sub } = MOCK;
  const [monthly, setMonthly] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('streammind_token');
    if (!token) return;
    axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const d = r.data;
        setMonthly({
          count: d.monthly_messages?.count ?? 0,
          plan:  d.subscription?.plan ?? 'starter',
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      {/* Benvenuto */}
      <div>
        <h1 className="text-xl font-bold text-hally-text">
          Ciao, {user?.display_name ?? 'streamer'} 👋
        </h1>
        <p className="text-sm text-hally-text-muted mt-0.5">
          Ecco cosa sta succedendo sul tuo canale oggi.
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BotStatusCard
          status={MOCK.botStatus}
          botName={MOCK.botName}
          channel={MOCK.channel}
          uptimeSince={MOCK.uptimeSince}
        />
        <UsageCard
          value={MOCK.messagesToday}
          delta={MOCK.messagesTodayDelta}
        />
        <MemoriesCard
          total={MOCK.memoriesCount}
          thisWeek={MOCK.memoriesThisWeek}
        />
        <SubscriptionCard
          status={sub.status}
          plan={sub.plan}
          daysRemaining={sub.daysRemaining}
          totalDays={sub.totalDays}
          expiresAt={sub.expiresAt}
          monthly={monthly}
        />
      </div>

      {/* ── Grafico + Feed memorie ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Chart */}
        <div className="card">
          <UsageChart data={MOCK_USAGE} />
        </div>

        {/* Feed */}
        <div className="card">
          <MemoryFeed memories={MOCK_MEMORIES} />
        </div>
      </div>

      {/* ── Quick actions ───────────────────────────────────────────── */}
      <div
        className="rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' }}
      >
        <div>
          <p className="text-sm font-semibold text-hally-text">Il bot è configurato al minimo?</p>
          <p className="text-xs text-hally-text-muted mt-0.5">Personalizza personalità e comandi per la tua community.</p>
        </div>
        <a
          href="/config"
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors duration-150"
          style={{ backgroundColor: '#8B5CF6' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7C3AED'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8B5CF6'}
        >
          Configura il bot →
        </a>
      </div>
    </div>
  );
}
