import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth.js';

const PAGE_SIZE = 20;

const CATEGORIES = ['utente', 'inside_joke', 'evento', 'promessa', 'nome_gioco'];

const CAT_COLORS = {
  utente:      'bg-blue-900/40 text-blue-400 border-blue-800',
  inside_joke: 'bg-purple-900/40 text-purple-400 border-purple-800',
  evento:      'bg-yellow-900/40 text-yellow-500 border-yellow-800',
  promessa:    'bg-red-900/40 text-red-400 border-red-800',
  nome_gioco:  'bg-green-900/40 text-green-400 border-green-800',
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <path d="M8 2v12M2 8h12" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
    <circle cx="6.5" cy="6.5" r="4" />
    <path d="M10 10l3.5 3.5" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5">
    <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l.8 9.5c0 .3.2.5.5.5h7.4c.3 0 .5-.2.5-.5L13 4" />
  </svg>
);
const IconDownload = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
    <path d="M8 2v8M5 7l3 3 3-3M2 13h12" />
  </svg>
);
const IconClose = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

// ─── Badge categoria ──────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CAT_COLORS[category] ?? 'bg-zinc-800 text-hally-text-muted border-hally-border'}`}>
      {category}
    </span>
  );
}

// ─── Modal aggiungi memoria ───────────────────────────────────────────────────
const EMPTY_FORM = { category: '', subject: '', content: '', game_context: '' };

function AddModal({ onClose, onAdded }) {
  const [form, setForm]   = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.content) { setError('Categoria e Contenuto sono obbligatori.'); return; }
    setSaving(true);
    setError('');
    try {
      const token = getToken();
      const r = await axios.post('/api/memories', form, { headers: { Authorization: `Bearer ${token}` } });
      onAdded(r.data);
      onClose();
    } catch {
      setError('Errore nel salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-hally-bg-card border border-hally-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hally-border">
          <h2 className="font-semibold text-base">Aggiungi memoria</h2>
          <button onClick={onClose} className="text-hally-text-muted hover:text-hally-text transition-colors">
            <IconClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Categoria <span className="text-red-400">*</span>
            </label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Seleziona categoria…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Soggetto</label>
            <input
              className="input"
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
              placeholder="Es. nome utente o argomento"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Contenuto <span className="text-red-400">*</span>
            </label>
            <textarea
              className="input min-h-[90px] resize-none"
              value={form.content}
              onChange={e => set('content', e.target.value)}
              placeholder="Descrizione della memoria…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Gioco</label>
            <input
              className="input"
              value={form.game_context}
              onChange={e => set('game_context', e.target.value)}
              placeholder="Es. Minecraft, Fortnite…"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Salvataggio…' : 'Aggiungi memoria'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Paginazione ──────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btn = (label, target, disabled = false) => (
    <button
      key={label}
      onClick={() => !disabled && onChange(target)}
      disabled={disabled}
      className="px-3 py-1.5 text-sm rounded border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ borderColor: '#262626', color: '#6b6b6b' }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1">
      {btn('‹', page - 1, page === 1)}

      {start > 1 && (
        <>
          {btn(1, 1)}
          {start > 2 && <span className="text-hally-text-muted text-sm px-1">…</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="px-3 py-1.5 text-sm rounded border transition-colors"
          style={p === page
            ? { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }
            : { borderColor: '#262626', color: '#6b6b6b' }
          }
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-hally-text-muted text-sm px-1">…</span>}
          {btn(totalPages, totalPages)}
        </>
      )}

      {btn('›', page + 1, page === totalPages)}
    </div>
  );
}

// ─── Pagina principale ────────────────────────────────────────────────────────
export default function MemoryPage() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [deleting, setDeleting]   = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('streammindai_token');
    axios.get('/api/memories', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setMemories(r.data?.memories ?? r.data ?? []))
      .catch(() => setMemories([]))
      .finally(() => setLoading(false));
  }, []);

  // Filtro + ricerca client-side
  const filtered = useMemo(() => {
    let list = memories;
    if (filterCat) list = list.filter(m => m.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.subject?.toLowerCase().includes(q) ||
        m.content?.toLowerCase().includes(q) ||
        m.game_context?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [memories, filterCat, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterCat = (cat) => { setFilterCat(cat); setPage(1); };
  const handleSearch    = (v)   => { setSearch(v);      setPage(1); };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questa memoria?')) return;
    setDeleting(id);
    try {
      const token = getToken();
      await axios.delete(`/api/memories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch {
      alert('Errore nell\'eliminazione.');
    } finally {
      setDeleting(null);
    }
  };

  const handleAdded = (newMem) => {
    setMemories(prev => [newMem, ...prev]);
    setPage(1);
  };

  const handleExportCSV = () => {
    const header = ['ID', 'Categoria', 'Soggetto', 'Contenuto', 'Gioco', 'Data'];
    const rows = filtered.map(m => [
      m.id,
      m.category ?? '',
      m.subject  ?? '',
      `"${(m.content ?? '').replace(/"/g, '""')}"`,
      m.game_context ?? '',
      m.created_at ? new Date(m.created_at).toLocaleDateString('it-IT') : '',
    ]);
    const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `memorie_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* ── Titolo ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Memoria</h1>
        <p className="text-hally-text-muted text-sm">
          StreaMindAI salva automaticamente ricordi dalla tua chat. Puoi visualizzarli, aggiungerli ed eliminarli qui.
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-hally-text-muted pointer-events-none">
            <IconSearch />
          </span>
          <input
            className="input pl-9 text-sm"
            placeholder="Cerca soggetto, contenuto, gioco…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        <span className="text-xs text-hally-text-muted hidden sm:block">
          {filtered.length} {filtered.length === 1 ? 'memoria' : 'memorie'}
        </span>

        <div className="flex-1 hidden sm:block" />

        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <IconDownload />
          Esporta CSV
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <IconPlus />
          Aggiungi memoria
        </button>
      </div>

      {/* ── Filtri categoria ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {['', ...CATEGORIES].map(cat => (
          <button
            key={cat || '_all'}
            onClick={() => handleFilterCat(cat)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150"
            style={filterCat === cat
              ? { backgroundColor: 'rgba(139,92,246,0.18)', borderColor: '#8B5CF6', color: '#8B5CF6' }
              : { backgroundColor: 'transparent', borderColor: '#262626', color: '#6b6b6b' }
            }
          >
            {cat || 'Tutte'}
          </button>
        ))}
      </div>

      {/* ── Contenuto ── */}
      {loading ? (
        <div className="text-hally-text-muted text-sm py-10 text-center">Caricamento memorie…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-3xl mb-3">🧠</p>
          <p className="text-hally-text-muted text-sm">
            {memories.length === 0
              ? 'Nessuna memoria salvata ancora. StreaMindAI inizierà ad imparare dalla tua chat.'
              : 'Nessuna memoria corrisponde ai filtri selezionati.'}
          </p>
        </div>
      ) : (
        <>
          {/* Tabella */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hally-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-hally-text-muted w-14">#ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-hally-text-muted w-32">Categoria</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-hally-text-muted w-36">Soggetto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-hally-text-muted">Contenuto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-hally-text-muted w-28">Gioco</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-hally-text-muted w-24">Data</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-hally-border">
                  {paginated.map(m => (
                    <tr key={m.id} className="hover:bg-hally-bg-hover transition-colors group">
                      <td className="px-4 py-3 text-hally-text-muted text-xs font-mono">{m.id}</td>
                      <td className="px-4 py-3">
                        {m.category && <CategoryBadge category={m.category} />}
                      </td>
                      <td className="px-4 py-3 font-medium text-hally-text max-w-[9rem] truncate">
                        {m.subject || <span className="text-hally-text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-hally-text-muted max-w-xs">
                        <span className="line-clamp-2 leading-snug">{m.content}</span>
                      </td>
                      <td className="px-4 py-3 text-hally-text-muted text-xs">
                        {m.game_context || <span>—</span>}
                      </td>
                      <td className="px-4 py-3 text-hally-text-muted text-xs whitespace-nowrap">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString('it-IT') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deleting === m.id}
                          title="Elimina memoria"
                          className="opacity-0 group-hover:opacity-100 text-hally-text-muted hover:text-red-400 transition-all disabled:opacity-40"
                        >
                          {deleting === m.id
                            ? <span className="text-xs">…</span>
                            : <IconTrash />
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer paginazione */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-hally-text-muted">
              Pagina {page} di {totalPages} — {filtered.length} {filtered.length === 1 ? 'memoria' : 'memorie'}
            </p>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </>
      )}

      {showModal && <AddModal onClose={() => setShowModal(false)} onAdded={handleAdded} />}
    </div>
  );
}
