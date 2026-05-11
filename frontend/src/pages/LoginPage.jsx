import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('streammindai_token');
    if (token) navigate('/dashboard');

    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      console.error('Errore login:', params.get('error'));
    }
  }, [navigate]);

  const handleTwitchLogin = () => {
    window.location.href = '/api/auth/twitch';
  };

  return (
    <div className="min-h-screen bg-hally-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-hally-orange mb-2">StreaMindAI</div>
          <p className="text-hally-text-muted text-sm">Dai una mente alla tua stream</p>
        </div>

        {/* Card login */}
        <div className="card text-center">
          <h1 className="text-lg font-semibold mb-2">Accedi al pannello</h1>
          <p className="text-hally-text-muted text-sm mb-6">
            Usa il tuo account Twitch per accedere. Nessuna password richiesta.
          </p>

          <button
            onClick={handleTwitchLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#9146FF] hover:bg-[#7c2ff3] text-white font-semibold py-3 px-5 rounded-lg transition-colors duration-150"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
            </svg>
            Accedi con Twitch
          </button>

          <p className="text-xs text-hally-text-muted mt-4">
            Accedendo, accetti i Termini di Servizio e la Privacy Policy.
          </p>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-hally-text-muted hover:text-hally-text transition-colors">
            ← Torna alla home
          </a>
        </div>
      </div>
    </div>
  );
}
