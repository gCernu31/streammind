import { NavLink } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Icone SVG inline
// ---------------------------------------------------------------------------

const IconDashboard = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0">
    <rect x="1" y="1" width="6.2" height="6.2" rx="1.2"/>
    <rect x="8.8" y="1" width="6.2" height="6.2" rx="1.2"/>
    <rect x="1" y="8.8" width="6.2" height="6.2" rx="1.2"/>
    <rect x="8.8" y="8.8" width="6.2" height="6.2" rx="1.2"/>
  </svg>
);

const IconBot = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <rect x="3" y="4" width="10" height="9" rx="1.5"/>
    <path d="M5 4V2.5m6 1.5V2.5M1 8h2m10 0h2"/>
    <circle cx="5.5" cy="8" r="1" fill="currentColor" stroke="none"/>
    <circle cx="10.5" cy="8" r="1" fill="currentColor" stroke="none"/>
    <path d="M6 11h4"/>
  </svg>
);

const IconMemory = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 .9.3 1.8.7 2.5C3.8 9.2 3.5 10 3.5 11c0 2 1.6 3.5 3.5 3.5h2c2 0 3.5-1.6 3.5-3.5 0-1-.3-1.8-.7-2.5.4-.7.7-1.6.7-2.5C12.5 3.5 10.5 1.5 8 1.5Z"/>
    <path d="M8 1.5v13"/>
  </svg>
);

const IconSubscription = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M1.5 5.5 4 2h8l2.5 3.5L8 14 1.5 5.5Z"/>
    <path d="M1.5 5.5h13M5.5 2 4 5.5M10.5 2l1.5 3.5"/>
  </svg>
);

const IconGuide = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M2 2.5A.5.5 0 0 1 2.5 2H10a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5H2.5a.5.5 0 0 1-.5-.5v-11Z"/>
    <path d="M10.5 4H14v9.5a.5.5 0 0 1-.5.5H10.5"/>
    <path d="M4.5 5.5h4M4.5 8h4M4.5 10.5h2.5"/>
  </svg>
);

function BrainWaveLogo({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <path d="M18 4C14.134 4 11 7.134 11 11C11 11.55 11.06 12.09 11.17 12.6C10 13.38 9.3 14.64 9.3 16C9.3 17.77 10.33 19.3 11.82 20.03C12 21.1 12.44 22.1 13.1 22.9L13.5 27H18V4Z" fill="#8B5CF6"/>
      <path d="M18 4C21.866 4 25 7.134 25 11C25 11.55 24.94 12.09 24.83 12.6C26 13.38 26.7 14.64 26.7 16C26.7 17.77 25.67 19.3 24.18 20.03C24 21.1 23.56 22.1 22.9 22.9L22.5 27H18V4Z" fill="#8B5CF6" fillOpacity="0.6"/>
      <line x1="18" y1="4.5" x2="18" y2="27" stroke="#0d0d0d" strokeWidth="1.5"/>
      <path d="M4 32C6.5 30 8.5 32 11 30C13.5 28 15.5 31 18 29C20.5 27 22.5 30 25 30C27.5 30 29.5 32 32 32" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dati navigazione
// ---------------------------------------------------------------------------

const navItems = [
  { to: '/dashboard',    Icon: IconDashboard,    label: 'Dashboard' },
  { to: '/config',       Icon: IconBot,          label: 'Il Mio Bot' },
  { to: '/memory',       Icon: IconMemory,       label: 'Memoria' },
  { to: '/subscription', Icon: IconSubscription, label: 'Abbonamento' },
];

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export default function Sidebar({ user, onLogout, open, onClose }) {
  return (
    <>
      {/* Overlay mobile (scuro dietro il drawer) */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Aside — drawer su mobile, sticky su desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col w-64
          bg-hally-bg-card border-r border-hally-border
          transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo + X (mobile) */}
        <div className="px-5 py-4 border-b border-hally-border flex items-center gap-2.5">
          <a
            href="/"
            className="flex items-center gap-2.5 flex-1 hover:opacity-80 transition-opacity"
            onClick={onClose}
          >
            <BrainWaveLogo className="w-6 h-6" />
            <span className="font-extrabold text-base tracking-tight text-hally-text">StreaMindAI</span>
          </a>
          {/* ← button — solo mobile */}
          <button
            onClick={onClose}
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover transition-colors flex-shrink-0"
            aria-label="Chiudi menu"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M10 3L4 8l6 5" />
            </svg>
          </button>
        </div>

        {/* Nav principale */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-hally-orange-muted text-hally-orange'
                    : 'text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? '#8B5CF6' : undefined }}>
                    <Icon />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}

          {/* Separator */}
          <div className="my-2 border-t border-hally-border" />

          {/* Guida */}
          <NavLink
            to="/guide"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-hally-orange-muted text-hally-orange'
                  : 'text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? '#8B5CF6' : undefined }}>
                  <IconGuide />
                </span>
                Guida
              </>
            )}
          </NavLink>

          {/* Torna al sito */}
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover transition-all duration-150"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <path d="M2 8h12M2 8l4-4M2 8l4 4"/>
            </svg>
            Torna al sito
          </a>
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-3 border-t border-hally-border">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-hally-bg-hover transition-colors group">
            {user?.avatar
              ? <img src={user.avatar} alt={user.display_name} className="w-8 h-8 rounded-full border border-hally-border shrink-0" />
              : <div className="w-8 h-8 rounded-full bg-hally-orange-muted border border-hally-orange/30 flex items-center justify-center shrink-0 text-xs font-bold text-hally-orange">
                  {user?.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-hally-text truncate leading-tight">{user?.display_name ?? '—'}</p>
              <p className="text-xs text-hally-text-muted truncate leading-tight">@{user?.twitch_username ?? '—'}</p>
            </div>
            <button
              onClick={() => { onLogout(); onClose(); }}
              title="Esci"
              className="w-9 h-9 flex items-center justify-center rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity text-hally-text-muted hover:text-red-400 hover:bg-hally-bg-hover flex-shrink-0"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
                <path d="M6 2H2.5A.5.5 0 0 0 2 2.5v11a.5.5 0 0 0 .5.5H6M11 11l3-3-3-3M6 8h8"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
