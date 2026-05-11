import { useEffect, useState } from 'react';
import axios from 'axios';

// ─── Piani ────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    features: [
      'Bot AI base con personalità configurabile',
      'Max 5 personaggi configurabili',
      'Comandi standard (!hally info, !hally [domanda])',
      'Risposte automatiche: follow e sub',
      '2.000 messaggi/mese',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 19,
    features: [
      'Bot AI completamente personalizzato',
      'Personaggi illimitati',
      'Song request Spotify (!sr)',
      'Memoria base (apprendimento automatico)',
      'Eventi: follow, sub, gift, bit, hype train, raid + shoutout',
      'Discord: notifiche live e video',
      'Comandi custom configurabili',
      '6.000 messaggi/mese',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 39,
    highlight: true,
    badge: 'Più popolare',
    features: [
      'Tutto di Creator',
      'Memoria avanzata con contesto di gioco',
      'Analytics canale AI (analisi dati stream)',
      'Messaggi eventi completamente personalizzabili',
      'Supporto prioritario',
      'Onboarding personalizzato',
      '13.000 messaggi/mese',
    ],
  },
  {
    id: 'signature',
    name: 'Signature',
    price: 99,
    features: [
      'Tutto di Elite',
      'Setup completamente personalizzato',
      'Call mensile 1:1 con il team StreaMindAI',
      'Supporto WhatsApp diretto',
      'Accesso anticipato alle nuove funzionalità',
      '33.000 messaggi/mese',
      'Supporto prioritario',
      'Accesso anticipato feature',
    ],
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
    <path d="M2.5 8.5l4 4 7-8" />
  </svg>
);

const IconExternal = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M7 3H3.5A.5.5 0 0 0 3 3.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V9M9 2h5v5M8 8l5.5-5.5" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_VARIANTS = {
  active:     { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  color: '#4ade80', dot: '#4ade80', label: 'Attivo' },
  cancelling: { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  color: '#fbbf24', dot: '#fbbf24', label: 'In scadenza' },
  past_due:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', color: '#f87171', dot: '#f87171', label: 'Pagamento scaduto' },
  inactive:   { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)', color: '#9ca3af', dot: '#9ca3af', label: 'Inattivo' },
};

function StatusBadge({ status }) {
  const v = STATUS_VARIANTS[status] ?? STATUS_VARIANTS.inactive;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
      style={{ backgroundColor: v.bg, borderColor: v.border, color: v.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: v.dot }} />
      {v.label}
    </span>
  );
}

// ─── Modal conferma cancellazione ─────────────────────────────────────────────
function CancelModal({ onConfirm, onClose, loading }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-hally-bg-card border border-hally-border rounded-xl p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold">Cancellare l'abbonamento?</h3>
          <button onClick={onClose} className="text-hally-text-muted hover:text-hally-text transition-colors">
            <IconClose />
          </button>
        </div>
        <p className="text-sm text-hally-text-muted mb-5 leading-relaxed">
          Il bot rimarrà attivo fino alla fine del periodo corrente. Non verranno effettuati ulteriori addebiti.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors border"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', color: '#f87171' }}
          >
            {loading ? 'Cancellazione…' : 'Sì, cancella'}
          </button>
          <button onClick={onClose} className="flex-1 btn-secondary text-sm">
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagina principale ────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const [sub, setSub]           = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [invLoading, setInvLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCancel, setShowCancel]   = useState(false);
  const [cancelling, setCancelling]   = useState(false);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('streammindai_token')}` });

  useEffect(() => {
    axios.get('/api/subscription', { headers: headers() })
      .then(r => setSub(r.data))
      .catch(() => setSub({ status: 'inactive', plan: null }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios.get('/api/subscription/invoices', { headers: headers() })
      .then(r => setInvoices(r.data.invoices ?? []))
      .catch(() => setInvoices([]))
      .finally(() => setInvLoading(false));
  }, [sub?.status]);

  const handleCheckout = async (planId) => {
    setCheckingOut(planId);
    try {
      const r = await axios.post('/api/subscription/checkout', { plan: planId }, { headers: headers() });
      if (r.data.checkout_url) window.location.href = r.data.checkout_url;
      else alert(r.data.error ?? 'Pagamenti non ancora configurati.');
    } catch (err) {
      alert(err.response?.data?.error ?? 'Errore imprevisto.');
    } finally {
      setCheckingOut(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const r = await axios.post('/api/subscription/portal', {}, { headers: headers() });
      if (r.data.portal_url) window.location.href = r.data.portal_url;
    } catch (err) {
      alert(err.response?.data?.error ?? 'Errore imprevisto.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await axios.post('/api/subscription/cancel', {}, { headers: headers() });
      setSub(prev => ({ ...prev, status: 'cancelling' }));
      setShowCancel(false);
    } catch (err) {
      alert(err.response?.data?.error ?? 'Errore imprevisto.');
    } finally {
      setCancelling(false);
    }
  };

  const isActive = sub?.status === 'active' || sub?.status === 'cancelling' || sub?.status === 'past_due';
  const currentPlan = PLANS.find(p => p.id === sub?.plan);

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Abbonamento</h1>
        <p className="text-hally-text-muted text-sm">Gestisci il tuo piano StreaMindAI e la fatturazione.</p>
      </div>

      {/* ── Piano attuale ── */}
      <div className="card mb-8">
        <h2 className="font-semibold mb-4">Piano attuale</h2>
        {loading ? (
          <p className="text-hally-text-muted text-sm">Caricamento…</p>
        ) : isActive ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <StatusBadge status={sub.status} />
                <span className="font-bold text-lg capitalize">{sub.plan}</span>
                {currentPlan && (
                  <span className="text-hally-text-muted text-sm">— {currentPlan.price}€/mese</span>
                )}
              </div>
              {sub.subscription_end && (
                <p className="text-xs text-hally-text-muted">
                  {sub.status === 'cancelling' ? 'Attivo fino al' : 'Prossimo rinnovo il'}{' '}
                  <span className="text-hally-text font-medium">{fmt(sub.subscription_end)}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                {portalLoading ? 'Caricamento…' : 'Gestisci piano'}
                {!portalLoading && <IconExternal />}
              </button>
              {sub.status !== 'cancelling' && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1.5"
                >
                  Cancella abbonamento
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status="inactive" />
            <p className="text-hally-text-muted text-sm">
              Scegli un piano qui sotto per attivare StreaMindAI sul tuo canale.
            </p>
          </div>
        )}
      </div>

      {/* ── Piani ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {PLANS.map(plan => {
          const isCurrent = sub?.plan === plan.id && isActive;
          return (
            <div
              key={plan.id}
              className="card flex flex-col relative pt-6"
              style={plan.highlight
                ? { borderColor: '#8B5CF6', boxShadow: '0 0 0 1px rgba(139,92,246,0.2), 0 4px 24px rgba(139,92,246,0.08)' }
                : {}
              }
            >
              {/* Badge "Più popolare" */}
              {plan.badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: '#8B5CF6', color: '#fff' }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Badge piano attuale */}
              {isCurrent && (
                <div
                  className="self-start text-xs font-semibold px-3 py-1 rounded-full border mb-3"
                  style={{ backgroundColor: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.35)', color: '#8B5CF6' }}
                >
                  Piano attuale
                </div>
              )}

              <div className="font-bold text-lg mb-1">{plan.name}</div>
              <div className="mb-5">
                <span className="text-3xl font-extrabold" style={{ color: '#8B5CF6' }}>{plan.price}€</span>
                <span className="text-hally-text-muted text-sm">/mese</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0" style={{ color: '#8B5CF6' }}><IconCheck /></span>
                    <span className="text-hally-text-muted">{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button disabled className="btn-secondary w-full text-sm opacity-50 cursor-not-allowed">
                  Piano attuale
                </button>
              ) : plan.highlight ? (
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={!!checkingOut}
                  className="w-full text-sm font-semibold py-2.5 rounded-lg transition-colors duration-150 disabled:opacity-60 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                >
                  {checkingOut === plan.id ? 'Reindirizzamento…' : `Attiva ${plan.name}`}
                </button>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={!!checkingOut}
                  className="btn-secondary w-full text-sm font-semibold disabled:opacity-60"
                >
                  {checkingOut === plan.id ? 'Reindirizzamento…' : `Attiva ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Storico fatture ── */}
      <div className="card">
        <h2 className="font-semibold mb-4">Storico fatture</h2>
        {invLoading ? (
          <p className="text-hally-text-muted text-sm">Caricamento fatture…</p>
        ) : invoices.length === 0 ? (
          <p className="text-hally-text-muted text-sm">Nessuna fattura ancora.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hally-border">
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-hally-text-muted">Fattura</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-hally-text-muted">Data</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-hally-text-muted">Importo</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-hally-text-muted">Stato</th>
                  <th className="px-3 py-2.5 w-14" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hally-border">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-hally-bg-hover transition-colors">
                    <td className="px-3 py-3 font-mono text-xs text-hally-text-muted">{inv.number ?? inv.id.slice(0, 12)}</td>
                    <td className="px-3 py-3 text-hally-text-muted text-xs whitespace-nowrap">
                      {fmt(inv.created)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-hally-text">
                      {inv.amount.toFixed(2)}{inv.currency === 'eur' ? '€' : ` ${inv.currency.toUpperCase()}`}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        inv.status === 'paid'
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : inv.status === 'open'
                          ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800'
                          : 'bg-zinc-800 text-hally-text-muted border-hally-border'
                      }`}>
                        {inv.status === 'paid' ? 'Pagata' : inv.status === 'open' ? 'In attesa' : inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {inv.pdf_url && (
                        <a
                          href={inv.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-hally-text-muted hover:text-hally-text transition-colors"
                        >
                          PDF <IconExternal />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal cancellazione ── */}
      {showCancel && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
          loading={cancelling}
        />
      )}
    </div>
  );
}
