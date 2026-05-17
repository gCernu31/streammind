import { useState } from 'react';
import { Link } from 'react-router-dom';

const PURPLE = '#8B5CF6';

export default function LoginPage() {
  const [accepted, setAccepted] = useState(false);

  const handleTwitchLogin = () => {
    if (!accepted) return;
    const redirectTo = new URLSearchParams(window.location.search).get('redirect_to') || '/';
    const refCode    = localStorage.getItem('streammindai_ref');
    const url        = `/api/auth/twitch?redirect_to=${encodeURIComponent(redirectTo)}${refCode ? `&ref=${encodeURIComponent(refCode)}` : ''}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-hally-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold mb-2" style={{ color: PURPLE }}>StreaMindAI</div>
          <p className="text-hally-text-muted text-sm">Dai una mente alla tua stream</p>
        </div>

        {/* Card login */}
        <div className="card text-center">
          <h1 className="text-lg font-semibold mb-2">Accedi al pannello</h1>
          <p className="text-hally-text-muted text-sm mb-6">
            Usa il tuo account Twitch per accedere. Nessuna password richiesta.
          </p>

          {/* Checkbox termini */}
          <label className="flex items-start gap-2.5 text-left mb-5 cursor-pointer group">
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              className="mt-0.5 flex-shrink-0"
              style={{ accentColor: PURPLE, width: '15px', height: '15px' }}
            />
            <span className="text-xs text-hally-text-muted leading-relaxed">
              Ho letto e accetto i{' '}
              <Link to="/termini" target="_blank" rel="noreferrer" className="underline hover:text-hally-text transition-colors" style={{ color: PURPLE }}>
                Termini di Servizio
              </Link>
              {' '}e la{' '}
              <Link to="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-hally-text transition-colors" style={{ color: PURPLE }}>
                Privacy Policy
              </Link>
            </span>
          </label>

          <button
            onClick={handleTwitchLogin}
            disabled={!accepted}
            className="w-full flex items-center justify-center gap-3 text-white font-semibold py-3 px-5 rounded-lg transition-colors duration-150"
            style={{
              backgroundColor: accepted ? '#9146FF' : '#3a3a3a',
              cursor: accepted ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => { if (accepted) e.currentTarget.style.backgroundColor = '#7c2ff3'; }}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = accepted ? '#9146FF' : '#3a3a3a')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
            </svg>
            Accedi con Twitch
          </button>

          {!accepted && (
            <p className="text-xs mt-2" style={{ color: '#f59e0b' }}>
              Accetta i termini per continuare
            </p>
          )}

          <p className="text-xs text-hally-text-muted mt-4">
            Accedendo, confermando di avere almeno 16 anni.
          </p>
        </div>

        <div className="text-center mt-6 space-y-2">
          <a href="/" className="block text-sm text-hally-text-muted hover:text-hally-text transition-colors">
            ← Torna alla home
          </a>
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: '#4a4a4a' }}>
            <Link to="/privacy" className="hover:text-hally-text transition-colors">Privacy</Link>
            <Link to="/termini" className="hover:text-hally-text transition-colors">Termini</Link>
            <Link to="/cookie"  className="hover:text-hally-text transition-colors">Cookie</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
