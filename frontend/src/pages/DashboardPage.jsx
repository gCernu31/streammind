import { useEffect, useState } from 'react';

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
// Helpers
// ---------------------------------------------------------------------------

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

function buildChartData(apiRows) {
  const today = new Date();
  const map = {};
  apiRows.forEach(r => { map[r.date] = r.count; });

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    return { day: DAY_LABELS[d.getDay()], count: map[iso] ?? 0, today: i === 6 };
  });
}

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

function formatExpiry(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Card: Bot Status
// ---------------------------------------------------------------------------

function BotStatusCard({ status, botName, channel }) {
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
      {!online && (
        <p className="text-xs text-hally-text-muted border-t border-hally-border pt-2.5">
          Attiva StreaMindAI per iniziare
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
  const active = status === 'active' || status === 'cancelling';

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
            {expiresAt && <p className="text-xs text-hally-text-muted mt-0.5">Scade il {expiresAt}</p>}
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
            Attiva StreaMindAI →
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

        {yTicks.map(({ y, label }) => (
          <g key={label}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="#1e1e1e" strokeWidth="1"/>
            <text x={pL - 6} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#4a4a4a" fontFamily="Inter, sans-serif">{label}</text>
          </g>
        ))}

        <path d={areaPath} fill="url(#areaGrad)"/>
        <path d={linePath} stroke="#8B5CF6" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

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
            {p.today && (
              <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="10" fill="#8B5CF6" fontWeight="600" fontFamily="Inter, sans-serif">
                {p.count}
              </text>
            )}
          </g>
        ))}

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
  if (memories.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-hally-text">Ultime memorie salvate</h2>
          <a href="/memory" className="text-xs font-medium" style={{ color: '#8B5CF6' }}>Vedi tutte →</a>
        </div>
        <p className="text-xs text-hally-text-muted text-center py-8">
          Nessuna memoria salvata ancora.<br />StreaMindAI inizierà a ricordare non appena sarà attiva.
        </p>
      </div>
    );
  }

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
  const [stats, setStats]     = useState(null);
  const [botName, setBotName] = useState(null);
  const [memories, setMemories] = useState([]);
  const [monthly, setMonthly] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('streammindai_token');
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    fetch('/api/dashboard/stats', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});

    fetch('/api/config', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.bot_name) setBotName(data.bot_name); })
      .catch(() => {});

    fetch('/api/memories?limit=5', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.memories) setMemories(data.memories); })
      .catch(() => {});

    fetch('/api/me', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setMonthly({
          count: data.monthly_messages?.count ?? 0,
          plan:  data.subscription?.plan ?? null,
        });
      })
      .catch(() => {});
  }, []);

  const sub = stats?.subscription ?? {};
  const chartData = buildChartData(stats?.usage_last_7_days ?? []);

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

      {/* ── CTA Configura ──────────────────────────────────────────── */}
      <a
        href="/config"
        className="block w-full rounded-xl border px-6 py-5 transition-all duration-150 group"
        style={{
          background:   'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.05) 100%)',
          borderColor:  'rgba(139,92,246,0.35)',
          boxShadow:    '0 0 24px rgba(139,92,246,0.08)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(139,92,246,0.16)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.08)'; }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572C4.561 14.924 4.561 12.426 6.317 12a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 0 0 2.572-1.065Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-hally-text">Configura il tuo bot</p>
              <p className="text-xs text-hally-text-muted mt-0.5">
                Dai una personalità, aggiungi comandi e imposta gli orari di streaming.
              </p>
            </div>
          </div>
          <span
            className="self-start sm:self-auto flex items-center gap-2 font-bold text-white text-sm px-6 py-2.5 rounded-xl flex-shrink-0 transition-colors duration-150 group-hover:opacity-90"
            style={{ backgroundColor: '#8B5CF6' }}
          >
            Configura ora
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </a>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BotStatusCard
          status={stats?.bot_status ?? 'offline'}
          botName={botName ?? 'Il tuo bot'}
          channel={user?.twitch_username ?? '—'}
        />
        <UsageCard
          value={stats?.messages_today ?? 0}
          delta={stats?.messages_today_delta ?? 0}
        />
        <MemoriesCard
          total={stats?.memories_count ?? 0}
          thisWeek={stats?.memories_this_week ?? 0}
        />
        <SubscriptionCard
          status={sub.status ?? 'inactive'}
          plan={sub.plan ?? null}
          daysRemaining={sub.days_remaining ?? 0}
          totalDays={sub.total_days ?? 30}
          expiresAt={formatExpiry(sub.end)}
          monthly={monthly}
        />
      </div>

      {/* ── Grafico + Feed memorie ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="card">
          <UsageChart data={chartData} />
        </div>
        <div className="card">
          <MemoryFeed memories={memories} />
        </div>
      </div>
    </div>
  );
}
