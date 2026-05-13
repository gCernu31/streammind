import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';

const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/config':       'Il Mio Bot',
  '/memory':       'Memoria',
  '/subscription': 'Abbonamento',
  '/guide':        'Guida',
};

export default function Layout({ user, onLogout, children }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'StreaMindAI';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [botName, setBotName] = useState('Il tuo bot');

  // Chiudi drawer al cambio di rotta
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('streammindai_token');
    fetch('/api/config', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => setBotName(data?.bot_name || 'Il tuo bot'))
      .catch(() => {});
  }, [user]);

  return (
    <div className="flex min-h-screen bg-hally-bg">
      <Sidebar
        user={user}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 shrink-0 border-b border-hally-border bg-hally-bg-card flex items-center justify-between px-4 sm:px-6 gap-4">
          <div className="flex items-center gap-3">
            {/* Hamburger — visibile solo mobile */}
            <button
              className="md:hidden p-2 rounded-lg text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Titolo pagina */}
            <h1 className="text-sm font-semibold text-hally-text">{title}</h1>
          </div>

          {/* Destra: bot badge + user */}
          <div className="flex items-center gap-3">
            {/* Nome bot */}
            <div
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
              style={{ backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.25)', color: '#8B5CF6' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              {botName}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-hally-border hidden sm:block" />

            {/* Avatar + nome Twitch */}
            <div className="flex items-center gap-2.5">
              {user?.avatar
                ? <img src={user.avatar} alt={user.display_name} className="w-7 h-7 rounded-full border border-hally-border" />
                : <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border"
                    style={{ backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', color: '#8B5CF6' }}
                  >
                    {user?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
              }
              <div className="hidden sm:block leading-tight">
                <p className="text-xs font-semibold text-hally-text">{user?.display_name}</p>
                <p className="text-xs text-hally-text-muted">@{user?.twitch_username}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Contenuto pagina */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
