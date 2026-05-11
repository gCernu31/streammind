import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Logo cervello + onda (SVG inline, lilla)
// ---------------------------------------------------------------------------

function BrainWaveLogo({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      {/* Lobo sinistro */}
      <path
        d="M18 4C14.134 4 11 7.134 11 11C11 11.55 11.06 12.09 11.17 12.6C10 13.38 9.3 14.64 9.3 16C9.3 17.77 10.33 19.3 11.82 20.03C12 21.1 12.44 22.1 13.1 22.9L13.5 27H18V4Z"
        fill="#8B5CF6"
      />
      {/* Lobo destro */}
      <path
        d="M18 4C21.866 4 25 7.134 25 11C25 11.55 24.94 12.09 24.83 12.6C26 13.38 26.7 14.64 26.7 16C26.7 17.77 25.67 19.3 24.18 20.03C24 21.1 23.56 22.1 22.9 22.9L22.5 27H18V4Z"
        fill="#8B5CF6"
        fillOpacity="0.7"
      />
      {/* Solco centrale */}
      <line x1="18" y1="4.5" x2="18" y2="27" stroke="#0d0d0d" strokeWidth="1.5" />
      {/* Onda */}
      <path
        d="M4 32C6.5 30 8.5 32 11 30C13.5 28 15.5 31 18 29C20.5 27 22.5 30 25 30C27.5 30 29.5 32 32 32"
        stroke="#8B5CF6"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dati statici
// ---------------------------------------------------------------------------

const PURPLE   = '#8B5CF6';
const PURPLE_H = '#7C3AED';

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    title: 'AI Personalizzata',
    desc: 'Definisci personalità, tono e stile. StreaMindAI diventa unica per la tua community — non un bot generico, ma un\'entità che conosce la tua stream.',
    detail: 'Motore AI proprietario StreaMindAI',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
      </svg>
    ),
    title: 'Song Request Spotify',
    desc: 'I tuoi viewer possono richiedere canzoni direttamente in chat. StreaMindAI le aggiunge alla coda Spotify in tempo reale.',
    detail: 'Limite configurabile per sub e non-sub',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'EventSub in Tempo Reale',
    desc: 'Ringraziamenti automatici per follow, sub, bit e raid. StreaMindAI celebra ogni momento importante della tua stream.',
    detail: 'Follow · Sub · Bit · Raid · Hype Train',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
    title: 'Memoria Persistente',
    desc: 'StreaMindAI impara dalla tua chat e ricorda inside joke, eventi, promesse e preferenze. La community si sente riconosciuta ad ogni stream.',
    detail: 'Apprendimento automatico ogni 20 messaggi',
  },
];

const steps = [
  { n: '01', title: 'Accedi con Twitch', desc: 'Un click. Usi il tuo account Twitch esistente, nessuna nuova password.' },
  { n: '02', title: 'Configura StreaMindAI', desc: 'Dai una personalità al bot, imposta i comandi e personalizza le risposte in pochi minuti.' },
  { n: '03', title: 'Live sul tuo canale', desc: 'StreaMindAI è attiva automaticamente. La tua community inizia a interagire da subito.' },
];

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '9',
    desc: 'Per chi inizia',
    features: [
      'Bot AI base con personalità configurabile',
      'Max 5 personaggi configurabili',
      'Comandi standard (!hally info, !hally [domanda])',
      'Risposte automatiche: follow e sub',
      '2.000 messaggi/mese',
    ],
    cta: 'Inizia con Starter',
    highlight: false,
  },
  {
    id: 'creator',
    name: 'Creator',
    price: '19',
    desc: 'Per streamer in crescita',
    features: [
      'Bot AI completamente personalizzato',
      'Personaggi illimitati',
      'Song request Spotify (!sr)',
      'Memoria base (apprendimento automatico)',
      'Eventi: follow, sub, gift, bit, hype train, raid + shoutout',
      'Discord: notifiche live e video',
      'Comandi custom configurabili',
      '6.000 messaggi/mese',
    ],
    cta: 'Scegli Creator',
    highlight: false,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '39',
    desc: 'Il più scelto',
    badge: 'Più popolare',
    features: [
      'Tutto di Creator',
      'Memoria avanzata con contesto di gioco',
      'Analytics canale AI (analisi dati stream)',
      'Messaggi eventi completamente personalizzabili',
      'Supporto prioritario',
      'Onboarding personalizzato',
      '13.000 messaggi/mese',
    ],
    cta: 'Vai con Elite',
    highlight: true,
  },
  {
    id: 'signature',
    name: 'Signature',
    price: '99',
    desc: 'Il massimo, senza limiti',
    features: [
      'Tutto di Elite',
      'Setup completamente personalizzato',
      'Call mensile 1:1 con il team StreaMindAI',
      'Supporto WhatsApp diretto',
      'Accesso anticipato alle nuove funzionalità',
      '33.000 messaggi/mese',
    ],
    cta: 'Signature Experience',
    highlight: false,
  },
];


// ---------------------------------------------------------------------------
// Mockup chat Twitch animato
// ---------------------------------------------------------------------------

const chatMessages = [
  { user: 'darkwolf_99',  color: '#9147ff', text: '!bot qual è il tuo gioco preferito?' },
  { user: 'StreaMindAI', color: PURPLE, badge: 'BOT', text: 'Dipende dall\'umore! Ma se mi costringi a scegliere… God of War. gCernu ne ha parlato per ore 😄' },
  { user: 'streamer_fan', color: '#00c8ff', text: '!sr Blinding Lights - The Weeknd' },
  { user: 'StreaMindAI', color: PURPLE, badge: 'BOT', text: '✅ Aggiunta alla coda Spotify! Posizione #2 🎵' },
  { user: 'luigi_gamer',  color: '#ff4e6a', text: 'primo follow della serata!' },
  { user: 'StreaMindAI', color: PURPLE, badge: 'BOT', text: '🎉 Benvenuto luigi_gamer! Primo follow = cuore speciale nel nostro stream ❤️' },
  { user: 'marta_plays',  color: '#43b581', text: '!bot cosa sta giocando oggi?' },
  { user: 'StreaMindAI', color: PURPLE, badge: 'BOT', text: 'Oggi è serata Elden Ring! gCernu ha giurato di finire il boss stasera… vedremo 😂' },
];

function TwitchChatMockup() {
  const [visible, setVisible] = useState(2);

  useEffect(() => {
    if (visible >= chatMessages.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 1400);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#18181b] shadow-2xl shadow-black/60 font-sans">
      {/* Barra titolo */}
      <div className="bg-[#0e0e10] px-4 py-3 flex items-center justify-between border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
            <span className="w-3 h-3 rounded-full bg-[#febc2e]"></span>
            <span className="w-3 h-3 rounded-full bg-[#28c840]"></span>
          </div>
          <span className="text-[#efeff1] text-xs font-medium ml-2">💬 Chat — #gcernu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-[#bf94ff] text-xs font-semibold">LIVE</span>
          <span className="text-[#adadb8] text-xs ml-1">1.2k</span>
        </div>
      </div>

      {/* Messaggi */}
      <div className="px-3 py-3 space-y-2.5 min-h-[280px]">
        {chatMessages.slice(0, visible).map((msg, i) => (
          <div key={i} className="text-sm leading-snug" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            {msg.badge && (
              <span
                className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5 align-middle"
                style={{ backgroundColor: PURPLE, color: '#fff' }}
              >
                {msg.badge}
              </span>
            )}
            <span className="font-bold" style={{ color: msg.color }}>{msg.user}</span>
            <span className="text-[#adadb8]">: </span>
            <span className={msg.badge ? 'text-[#efeff1]' : 'text-[#c0c0c0]'}>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="border-t border-[#2a2a2a] px-3 py-2.5">
        <div className="bg-[#3a3a3d] rounded-md px-3 py-2 text-xs text-[#adadb8]">
          Invia un messaggio…
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo chat interattiva
// ---------------------------------------------------------------------------

const DEMO_KEY = 'streammindai_demo_count';
const DEMO_MAX = 3;

function DemoChat() {
  const isLoggedIn = !!localStorage.getItem('streammindai_token');

  const [unlocked, setUnlocked] = useState(isLoggedIn);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Ciao! Sono Hally 🎃 l\'IA demo di StreaMindAI. Scrivimi qualcosa e ti mostro cosa posso fare!' },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [count, setCount]     = useState(() => {
    try { return parseInt(sessionStorage.getItem(DEMO_KEY) || '0'); } catch { return 0; }
  });
  const bottomRef = useRef(null);
  const exhausted = count >= DEMO_MAX;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading || exhausted) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text }]);
    setLoading(true);

    const newCount = count + 1;
    setCount(newCount);
    try { sessionStorage.setItem(DEMO_KEY, String(newCount)); } catch {}

    try {
      const r    = await fetch('/api/demo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text }),
      });
      const data = await r.json();
      const reply = data.reply || 'Non riesco a rispondere in questo momento.';
      setMessages(prev => [...prev, { from: 'bot', text: reply, showPowered: newCount >= DEMO_MAX }]);
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: 'Errore di connessione. Riprova!', showPowered: false }]);
    } finally {
      setLoading(false);
    }

    if (newCount >= DEMO_MAX) {
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'limit' }]);
      }, 600);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <section id="demo" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
            Provalo ora
          </p>
          <h2 className="text-4xl font-extrabold mb-4">Parla con Hally, la nostra demo</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: '#a0a0a0' }}>
            Scrivi qualcosa in chat e scopri come StreaMindAI risponde in tempo reale sul tuo canale Twitch.
          </p>
        </div>

        <div className="max-w-xl mx-auto relative">

          {/* Overlay blocco — visibile solo se non sbloccato */}
          {!unlocked && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl gap-5 backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(13,13,13,0.82)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              <div className="text-4xl">🎃</div>
              <div className="text-center px-6">
                <p className="text-base font-bold text-white mb-1">Accedi con Twitch per provare Hally</p>
                <p className="text-sm" style={{ color: '#a0a0a0' }}>È gratis. Nessuna carta richiesta.</p>
              </div>
              <Link
                to="/login"
                className="flex items-center gap-2.5 font-bold text-white px-7 py-3 rounded-xl text-sm transition-all duration-150"
                style={{ backgroundColor: '#9147ff' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#772ce8'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#9147ff'}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                </svg>
                Accedi con Twitch
              </Link>
            </div>
          )}

          {/* Finestra chat */}
          <div
            className="rounded-t-xl overflow-hidden border"
            style={{ backgroundColor: '#18181b', borderColor: '#2a2a2a' }}
          >
            {/* Barra titolo */}
            <div
              className="px-4 py-3 flex items-center justify-between border-b"
              style={{ backgroundColor: '#0e0e10', borderColor: '#2a2a2a' }}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-[#efeff1] text-xs font-medium ml-2">💬 Chat — #gcernu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold" style={{ color: PURPLE }}>LIVE</span>
              </div>
            </div>

            {/* Messaggi */}
            <div className="px-4 py-4 space-y-4 overflow-y-auto" style={{ minHeight: '280px', maxHeight: '320px' }}>
              {messages.map((msg, i) => {
                if (msg.from === 'limit') return (
                  <div key={i} className="rounded-xl p-4 text-center text-sm font-semibold border"
                    style={{ backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                    Hai esaurito i messaggi demo! 🎃<br />
                    <Link to="/login" className="underline mt-1 inline-block" style={{ color: PURPLE }}>
                      Registrati per creare la tua AI personalizzata →
                    </Link>
                  </div>
                );

                if (msg.from === 'user') return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[75%]">
                      <p className="text-xs text-right mb-1" style={{ color: '#6b6b6b' }}>Tu</p>
                      <div
                        className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white"
                        style={{ backgroundColor: PURPLE }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );

                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 border"
                      style={{ backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)' }}
                    >
                      🎃
                    </div>
                    <div className="max-w-[75%]">
                      <p className="text-xs mb-1 font-semibold" style={{ color: PURPLE }}>Hally</p>
                      <div
                        className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm"
                        style={{ backgroundColor: '#2a2a2d', color: '#efeff1' }}
                      >
                        {msg.text}
                      </div>
                      {msg.showPowered && (
                        <p className="text-[10px] mt-1.5" style={{ color: '#4a4a4a' }}>
                          Powered by StreaMindAI —{' '}
                          <Link to="/login" className="underline hover:opacity-80 transition-opacity" style={{ color: '#6b6b6b' }}>
                            Crea il tuo bot personalizzato →
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 border"
                    style={{ backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)' }}
                  >
                    🎃
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ backgroundColor: '#2a2a2d' }}>
                    <div className="flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6b6b6b] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6b6b6b] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6b6b6b] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div
            className="rounded-b-xl border-x border-b p-3 flex gap-2"
            style={{ backgroundColor: '#0e0e10', borderColor: '#2a2a2a' }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={loading || exhausted}
              placeholder={exhausted ? 'Messaggi demo esauriti — registrati per continuare' : 'Scrivi un messaggio a Hally…'}
              className="flex-1 text-sm rounded-lg px-4 py-2.5 outline-none transition-colors"
              style={{
                backgroundColor: exhausted ? '#1a1a1a' : '#1e1e21',
                color: exhausted ? '#4a4a4a' : '#efeff1',
                border: '1px solid #2a2a2a',
              }}
            />
            <button
              onClick={send}
              disabled={loading || exhausted || !input.trim()}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: PURPLE }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = PURPLE_H; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = PURPLE; }}
            >
              Invia
            </button>
          </div>

          {/* Contatore messaggi */}
          {unlocked && !exhausted && (
            <p className="text-center text-xs mt-3" style={{ color: '#4a4a4a' }}>
              {DEMO_MAX - count} {DEMO_MAX - count === 1 ? 'messaggio rimasto' : 'messaggi rimasti'} nella demo
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#262626]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <BrainWaveLogo className="w-7 h-7 group-hover:opacity-80 transition-opacity" />
          <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-[#8B5CF6] transition-colors">
            StreaMindAI
          </span>
        </a>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#a0a0a0]">
          <a href="#features" className="hover:text-white transition-colors">Funzionalità</a>
          <a href="#how"      className="hover:text-white transition-colors">Come funziona</a>
          <a href="#pricing"  className="hover:text-white transition-colors">Prezzi</a>
          <Link to="/analisi" className="hover:text-white transition-colors" style={{ color: PURPLE }}>Analisi Gratis</Link>
        </nav>

        {/* CTA */}
        <Link
          to="/login"
          className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2 rounded-lg transition-all duration-150"
          style={{ backgroundColor: PURPLE }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = PURPLE_H}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = PURPLE}
        >
          Inizia Gratis
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0d0d0d', color: '#f0f0f0' }}>
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Sfondo glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(139,92,246,0.13) 0%, transparent 70%)' }}
        />
        {/* Griglia decorativa */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Testo */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 border text-xs font-medium px-3 py-1.5 rounded-full mb-8"
                style={{ borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)', color: PURPLE }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: PURPLE }}></span>
                In produzione su Twitch
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
                Dai una mente<br />
                <span style={{ color: PURPLE }}>alla tua stream</span>
              </h1>

              <p className="text-lg lg:text-xl mb-10 max-w-xl mx-auto lg:mx-0" style={{ color: '#a0a0a0' }}>
                StreaMindAI risponde in chat, ringrazia i tuoi follower, gestisce le song request e impara dalla tua community — tutto in automatico, tutto personalizzabile.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 justify-center lg:justify-start">
                <Link
                  to="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold text-white px-8 py-3.5 rounded-xl text-base transition-all duration-150 shadow-lg"
                  style={{ backgroundColor: PURPLE, boxShadow: '0 0 24px rgba(139,92,246,0.35)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = PURPLE_H; e.currentTarget.style.boxShadow = '0 0 32px rgba(139,92,246,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = PURPLE; e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.35)'; }}
                >
                  Inizia Gratis
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <a
                  href="#pricing"
                  className="w-full sm:w-auto flex items-center justify-center font-medium px-8 py-3.5 rounded-xl text-base transition-colors duration-150 border"
                  style={{ borderColor: '#262626', color: '#a0a0a0', backgroundColor: '#151515' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#383838'; e.currentTarget.style.color = '#f0f0f0'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#262626'; e.currentTarget.style.color = '#a0a0a0'; }}
                >
                  Vedi i prezzi
                </a>
              </div>

              <p className="mt-6 text-sm" style={{ color: '#6b6b6b' }}>
                Nessuna carta di credito · Cancelli quando vuoi
              </p>
            </div>

            {/* Mockup chat */}
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
              <TwitchChatMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNZIONALITÀ ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
              Funzionalità
            </p>
            <h2 className="text-4xl font-extrabold mb-4">Tutto quello che ti serve</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#a0a0a0' }}>
              Un bot completo, non solo risposte AI. StreaMindAI gestisce ogni aspetto della tua stream in modo intelligente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-xl p-7 border transition-all duration-200 cursor-default"
                style={{ backgroundColor: '#151515', borderColor: '#262626' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'; e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#262626'; e.currentTarget.style.backgroundColor = '#151515'; }}
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
                  style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: PURPLE }}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#a0a0a0' }}>{f.desc}</p>
                <p className="text-xs font-medium" style={{ color: '#6b6b6b' }}>{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO CHAT ────────────────────────────────────────────────────── */}
      <DemoChat />

      {/* ── COME FUNZIONA ────────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-6" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
              Come funziona
            </p>
            <h2 className="text-4xl font-extrabold mb-4">Pronto in 3 minuti</h2>
            <p className="text-lg" style={{ color: '#a0a0a0' }}>
              Nessuna configurazione tecnica. Nessun server da gestire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute" />
            {steps.map((step, i) => (
              <div key={i} className="text-center md:text-left">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-xl font-black mb-5 border"
                  style={{ backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)', color: PURPLE }}
                >
                  {step.n}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#a0a0a0' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISCORD INTEGRATION ──────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-10 md:p-14 flex flex-col md:flex-row items-center gap-10 border"
            style={{ backgroundColor: '#151515', borderColor: '#262626', background: 'linear-gradient(135deg, #151515 0%, #100e1a 100%)' }}
          >
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
                style={{ backgroundColor: 'rgba(88,101,242,0.15)', color: '#8891f2', border: '1px solid rgba(88,101,242,0.3)' }}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.01.04.028.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                Integrazione Discord
              </div>
              <h2 className="text-3xl font-extrabold mb-4">
                Connesso al tuo<br />server Discord
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: '#a0a0a0' }}>
                Quando vai live, StreaMindAI avvisa automaticamente il tuo server Discord con @everyone e il link diretto alla stream. Nessun bot Discord aggiuntivo necessario.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: '#a0a0a0' }}>
                {['Notifica automatica go-live', 'Annuncio nuovi video YouTube', 'Canali configurabili liberamente'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span style={{ color: PURPLE }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Discord preview */}
            <div
              className="w-full md:w-72 rounded-xl overflow-hidden border text-sm flex-shrink-0"
              style={{ backgroundColor: '#313338', borderColor: '#1e1f22' }}
            >
              <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ borderColor: '#1e1f22', backgroundColor: '#2b2d31' }}>
                <span className="text-[#949ba4] text-xs"># 📢 annunci</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}
                  >
                    <BrainWaveLogo className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-white text-xs font-semibold">StreaMindAI</span>
                      <span
                        className="text-[10px] px-1 py-0.5 rounded font-semibold"
                        style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: PURPLE }}
                      >
                        BOT
                      </span>
                    </div>
                    <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: '#2b2d31', borderLeft: `4px solid ${PURPLE}` }}>
                      <p className="text-white font-semibold mb-1">🔴 gCernu è LIVE!</p>
                      <p style={{ color: '#b5bac1' }}>Sta giocando a Elden Ring — vieni a guardare!</p>
                      <p className="mt-2 font-medium" style={{ color: PURPLE }}>🔗 twitch.tv/gcernu</p>
                    </div>
                    <p style={{ color: '#5865f2', fontSize: '11px' }} className="mt-1">@everyone</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
              Prezzi
            </p>
            <h2 className="text-4xl font-extrabold mb-4">Semplici e trasparenti</h2>
            <p className="text-lg" style={{ color: '#a0a0a0' }}>
              Nessuna commissione. Nessun costo nascosto. Cancelli quando vuoi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl p-7 border flex flex-col relative transition-all duration-200"
                style={{
                  backgroundColor: plan.highlight ? '#1a1a1a' : '#151515',
                  borderColor: plan.highlight ? PURPLE : '#262626',
                  boxShadow: plan.highlight ? '0 0 40px rgba(139,92,246,0.12)' : 'none',
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full text-white"
                    style={{ backgroundColor: PURPLE }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm" style={{ color: '#6b6b6b' }}>{plan.desc}</p>
                </div>

                <div className="mb-7 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold" style={{ color: PURPLE }}>{plan.price}€</span>
                  <span className="text-sm" style={{ color: '#6b6b6b' }}>/mese</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: PURPLE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span style={{ color: '#a0a0a0' }}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login"
                  className="block text-center font-semibold py-3 rounded-xl text-sm transition-all duration-150"
                  style={
                    plan.highlight
                      ? { backgroundColor: PURPLE, color: '#fff' }
                      : { backgroundColor: '#1e1e1e', color: '#f0f0f0', border: '1px solid #262626' }
                  }
                  onMouseEnter={e => {
                    if (plan.highlight) e.currentTarget.style.backgroundColor = PURPLE_H;
                    else e.currentTarget.style.borderColor = '#383838';
                  }}
                  onMouseLeave={e => {
                    if (plan.highlight) e.currentTarget.style.backgroundColor = PURPLE;
                    else e.currentTarget.style.borderColor = '#262626';
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-8 text-sm" style={{ color: '#6b6b6b' }}>
            Hai dubbi? Scrivici su Discord — rispondiamo entro poche ore.
          </p>
        </div>
      </section>

      {/* ── CTA FINALE ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <BrainWaveLogo className="w-14 h-14" />
          </div>
          <h2 className="text-4xl font-extrabold mb-4">
            Dai una mente alla tua stream, oggi
          </h2>
          <p className="text-lg mb-10" style={{ color: '#a0a0a0' }}>
            Unisciti agli streamer italiani che stanno già usando StreaMindAI per coinvolgere la loro community ogni sera.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 font-bold text-white px-10 py-4 rounded-xl text-base transition-all duration-150 shadow-lg"
            style={{ backgroundColor: PURPLE, boxShadow: '0 0 32px rgba(139,92,246,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = PURPLE_H; e.currentTarget.style.boxShadow = '0 0 48px rgba(139,92,246,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = PURPLE; e.currentTarget.style.boxShadow = '0 0 32px rgba(139,92,246,0.35)'; }}
          >
            Inizia Gratis con Twitch
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-12" style={{ borderColor: '#1e1e1e', backgroundColor: '#0a0a0a' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <BrainWaveLogo className="w-6 h-6" />
                <span className="text-lg font-extrabold text-white">StreaMindAI</span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: '#6b6b6b' }}>
                Dai una mente alla tua stream. L'AI che trasforma il tuo canale Twitch in un'esperienza indimenticabile.
              </p>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-10">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#6b6b6b' }}>Prodotto</h4>
                <ul className="space-y-3 text-sm" style={{ color: '#a0a0a0' }}>
                  <li><a href="#features" className="hover:text-white transition-colors">Funzionalità</a></li>
                  <li><a href="#pricing"  className="hover:text-white transition-colors">Prezzi</a></li>
                  <li><a href="#how"      className="hover:text-white transition-colors">Come funziona</a></li>
                  <li><Link to="/analisi" className="hover:text-white transition-colors">Analisi Gratis</Link></li>
                  <li><Link to="/login"   className="hover:text-white transition-colors">Accedi</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#6b6b6b' }}>Legale</h4>
                <ul className="space-y-3 text-sm" style={{ color: '#a0a0a0' }}>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Termini di Servizio</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contatti</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: '#1e1e1e' }}>
            <p className="text-xs" style={{ color: '#6b6b6b' }}>
              © 2025 StreaMindAI — Fatto con ❤️ per gli streamer italiani
            </p>
            <p className="text-xs" style={{ color: '#6b6b6b' }}>
              Non affiliato con Twitch Interactive, Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
