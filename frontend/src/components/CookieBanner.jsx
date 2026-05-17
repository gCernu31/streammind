import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'smai_cookie_accepted';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: '#111', borderTop: '1px solid #2a2a2a',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', flexWrap: 'wrap',
      }}
    >
      <p style={{ margin: 0, fontSize: '13px', color: '#a0a0a0', flex: '1', minWidth: '200px' }}>
        Utilizziamo cookie tecnici necessari per il funzionamento del sito.{' '}
        <Link to="/cookie" style={{ color: '#8B5CF6', textDecoration: 'underline' }}>
          Leggi di più
        </Link>
      </p>
      <button
        onClick={accept}
        style={{
          background: '#8B5CF6', color: '#fff', border: 'none',
          padding: '8px 20px', borderRadius: '8px',
          fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#7C3AED')}
        onMouseLeave={e => (e.currentTarget.style.background = '#8B5CF6')}
      >
        Accetta
      </button>
    </div>
  );
}
