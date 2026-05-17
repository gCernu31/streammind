import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

const PURPLE = '#8B5CF6';

if (typeof document !== 'undefined' && !document.getElementById('smai-spin')) {
  const s = document.createElement('style');
  s.id = 'smai-spin';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}

// ── Parser: markdown → array di slide ─────────────────────────────────────────
export function parseSlides(text, username) {
  const slides = [];
  slides.push({ type: 'cover', username });
  const sections = text.split(/^### /m).filter(Boolean);
  for (const raw of sections) {
    const lines   = raw.split('\n');
    const title   = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    slides.push({ type: 'section', title, content });
  }
  slides.push({ type: 'cta' });
  return slides;
}

// ── Formatta testo inline (bold) ───────────────────────────────────────────────
function fmt(text) {
  if (!text) return null;
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ color: '#f0f0f0', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
      : p
  );
}

// ── Render contenuto sezione ───────────────────────────────────────────────────
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

// ── Slide cover ────────────────────────────────────────────────────────────────
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

// ── Slide CTA ──────────────────────────────────────────────────────────────────
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

// ── Presentazione a slide ──────────────────────────────────────────────────────
// Props:
//   slides      — array di slide da parseSlides()
//   username    — username Twitch (opzionale)
//   analysisId  — ID per link condivisibile (opzionale, mostra bottone "Copia link")
//   onReset     — callback per tornare al form (opzionale, mostra "Nuova analisi")
export default function SlideShow({ slides, username, analysisId, onReset }) {
  const [idx, setIdx]             = useState(0);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied]       = useState(false);
  const cardRef = useRef(null);
  const total   = slides.length;

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

  const copyShareLink = useCallback(() => {
    if (!analysisId) return;
    const url = `${window.location.origin}/analisi/${analysisId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  }, [analysisId]);

  const downloadPDF = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const card  = cardRef.current;
      const W     = card.offsetWidth;
      const H     = card.offsetHeight;
      const pdf   = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
      const saved = idx;
      for (let i = 0; i < total; i++) {
        setIdx(i);
        await new Promise(r => setTimeout(r, 120));
        const canvas = await html2canvas(card, { backgroundColor: '#111111', scale: 2, useCORS: true, logging: false });
        const img = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage([W, H], 'landscape');
        pdf.addImage(img, 'PNG', 0, 0, W, H);
      }
      pdf.save(`analisi-${username || 'twitch'}-streamindai.pdf`);
      setIdx(saved);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setExporting(false);
    }
  };

  const slide = slides[idx];

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Header slide */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: '#4a4a4a', fontWeight: 600 }}>
          {idx + 1} / {total}
        </div>
        {onReset && (
          <button
            onClick={onReset}
            style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #2a2a2a', color: '#6b6b6b', background: '#111', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#f0f0f0'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#6b6b6b'; }}
          >
            Nuova analisi
          </button>
        )}
      </div>

      {/* Card slide */}
      <div
        ref={cardRef}
        style={{ background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '40px 44px', minHeight: '420px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(139,92,246,0.06)', filter: 'blur(40px)', pointerEvents: 'none' }} />
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
        <button
          onClick={prev}
          disabled={idx === 0}
          style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #2a2a2a', background: idx === 0 ? 'transparent' : '#111', color: idx === 0 ? '#333' : '#a0a0a0', cursor: idx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
          onMouseEnter={e => { if (idx > 0) { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#f0f0f0'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = idx === 0 ? '#333' : '#a0a0a0'; }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: '16px', height: '16px' }}>
            <path d="M10 3L4 8l6 5" />
          </svg>
        </button>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{ width: i === idx ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i === idx ? PURPLE : '#2a2a2a', border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.2s' }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={idx === total - 1}
          style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid', borderColor: idx === total - 1 ? '#2a2a2a' : PURPLE, background: idx === total - 1 ? 'transparent' : 'rgba(139,92,246,0.12)', color: idx === total - 1 ? '#333' : PURPLE, cursor: idx === total - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
          onMouseEnter={e => { if (idx < total - 1) e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = idx === total - 1 ? 'transparent' : 'rgba(139,92,246,0.12)'; }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: '16px', height: '16px' }}>
            <path d="M6 3l6 5-6 5" />
          </svg>
        </button>
      </div>

      {/* Toolbar inferiore: hint + PDF + Link condivisibile */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', gap: '8px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '12px', color: '#2e2e2e', flexShrink: 0 }}>
          ← → per navigare tra le slide
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Bottone link condivisibile */}
          {analysisId && (
            <button
              onClick={copyShareLink}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: 600,
                padding: '7px 14px', borderRadius: '8px',
                border: copied ? '1px solid rgba(34,197,94,0.4)' : '1px solid #2a2a2a',
                background: copied ? 'rgba(34,197,94,0.08)' : '#111',
                color: copied ? '#4ade80' : '#6b6b6b',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#f0f0f0'; } }}
              onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#6b6b6b'; } }}
            >
              {copied ? (
                <>
                  <svg style={{ width: '13px', height: '13px' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 8l4 4 6-6" />
                  </svg>
                  Copiato!
                </>
              ) : (
                <>
                  <svg style={{ width: '13px', height: '13px' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M10 2H6a2 2 0 00-2 2v8a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2z" />
                    <path d="M10 2v0a2 2 0 012 2v7" />
                  </svg>
                  Copia link
                </>
              )}
            </button>
          )}

          {/* Bottone scarica PDF */}
          <button
            onClick={downloadPDF}
            disabled={exporting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 600,
              padding: '7px 14px', borderRadius: '8px',
              border: '1px solid rgba(139,92,246,0.35)',
              background: exporting ? 'transparent' : 'rgba(139,92,246,0.08)',
              color: exporting ? '#4a4a4a' : '#a78bfa',
              cursor: exporting ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!exporting) { e.currentTarget.style.background = 'rgba(139,92,246,0.16)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = exporting ? 'transparent' : 'rgba(139,92,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'; }}
          >
            {exporting ? (
              <>
                <svg style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                </svg>
                Generazione PDF…
              </>
            ) : (
              <>
                <svg style={{ width: '13px', height: '13px' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M8 2v8M5 7l3 3 3-3M2 13h12" />
                </svg>
                Scarica PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
