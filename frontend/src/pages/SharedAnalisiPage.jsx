import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import AccountMenu from '../components/AccountMenu.jsx';
import SlideShow, { parseSlides } from '../components/SlideShow.jsx';

const PURPLE = '#8B5CF6';

export default function SharedAnalisiPage({ user, loading: authLoading, onLogout }) {
  const { id } = useParams();
  const [slides, setSlides]     = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    axios.get(`/api/analytics/${id}`)
      .then(r => {
        setSlides(parseSlides(r.data.analysis, r.data.twitch_username));
        setUsername(r.data.twitch_username ?? '');
      })
      .catch(err => {
        setError(err.response?.data?.error ?? 'Analisi non trovata.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const title = username
    ? `Analisi canale di @${username} | StreaMindAI`
    : 'Analisi canale Twitch | StreaMindAI';

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0d0d0d', color: '#f0f0f0' }}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={username ? `Analisi strategica del canale Twitch @${username} generata da StreaMindAI.` : 'Analisi canale Twitch generata da StreaMindAI.'} />
        <meta name="robots" content="noindex,nofollow" />
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

        {/* Loading */}
        {loading && (
          <div className="py-20 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: PURPLE }} />
            <p className="text-sm" style={{ color: '#6b6b6b' }}>Caricamento analisi…</p>
          </div>
        )}

        {/* Errore */}
        {!loading && error && (
          <div className="text-center py-20">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h1 className="text-xl font-bold mb-2">Analisi non trovata</h1>
            <p className="text-sm mb-8" style={{ color: '#6b6b6b' }}>{error}</p>
            <Link
              to="/analisi"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                backgroundColor: PURPLE, color: '#fff', fontWeight: 700,
                padding: '12px 28px', borderRadius: '12px', fontSize: '14px',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = PURPLE)}
            >
              Crea la tua analisi gratuita →
            </Link>
          </div>
        )}

        {/* Slide */}
        {!loading && slides && (
          <>
            {username && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-4"
                  style={{ borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)', color: PURPLE }}>
                  Analisi condivisa · @{username}
                </div>
              </div>
            )}
            <SlideShow slides={slides} username={username} analysisId={id} />
          </>
        )}
      </div>
    </div>
  );
}
