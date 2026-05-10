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
  const title = PAGE_TITLES[pathname] ?? 'StreamMind';

  const [botName, setBotName] = useState(null);

  // Carica il nome del bot configurato dall'API
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('streammind_token');
    fetch('/api/config', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => data?.bot_name && setBotName(data.bot_name))
      .catch(() => {});
  }, [user]);

  return (
    <div className="flex min-h-screen bg-hally-bg">
      <Sidebar user={user} onLogout={onLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 shrink-0 border-b border-hally-border bg-hally-bg-card flex items-center justify-between px-6 gap-4">
          {/* Titolo pagina */}
          <h1 className="text-sm font-semibold text-hally-text">{title}</h1>

          {/* Destra: bot badge + user */}
          <div className="flex items-center gap-3">
            {/* Nome bot */}
            {botName && (
              <div
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
                style={{ backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.25)', color: '#8B5CF6' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                {botName}
              </div>
            )}

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
          <div className="max-w-5xl mx-auto px-6 py-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
