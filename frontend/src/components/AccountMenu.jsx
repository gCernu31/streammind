import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const PURPLE   = '#8B5CF6';
const PURPLE_H = '#7C3AED';

export default function AccountMenu({ user, loading, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (loading) {
    return <div className="w-28 h-9 rounded-lg animate-pulse" style={{ backgroundColor: '#1e1e1e' }} />;
  }

  if (!user) {
    return (
      <a
        href="/api/auth/twitch?redirect_to=/"
        className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2 rounded-lg transition-all duration-150"
        style={{ backgroundColor: PURPLE }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = PURPLE_H}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = PURPLE}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
        </svg>
        Accedi con Twitch
      </a>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer"
        style={{
          backgroundColor: '#151515',
          borderColor: open ? 'rgba(139,92,246,0.5)' : '#262626',
        }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.display_name}
            className="w-7 h-7 rounded-full flex-shrink-0"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: '#3a3a3d' }}
          >
            {(user.display_name || '?')[0].toUpperCase()}
          </div>
        )}
        <span className="text-sm font-semibold text-white hidden sm:block max-w-[120px] truncate">
          {user.display_name}
        </span>
        <svg
          className="w-3.5 h-3.5 transition-transform duration-150"
          style={{ color: '#6b6b6b', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-44 rounded-xl border overflow-hidden z-50"
          style={{
            backgroundColor: '#151515',
            borderColor: '#262626',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors"
            style={{ color: '#f0f0f0' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e1e1e'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => setOpen(false)}
          >
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#6b6b6b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            Dashboard
          </Link>
          <div style={{ borderTop: '1px solid #262626' }} />
          <button
            className="flex items-center gap-2.5 px-4 py-3 text-sm w-full text-left transition-colors"
            style={{ color: '#f87171' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e1e1e'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => { onLogout(); setOpen(false); }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Disconnetti
          </button>
        </div>
      )}
    </div>
  );
}
