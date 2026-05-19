import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const PURPLE = '#8b5cf6';

const PLAN_LABELS = {
  starter:   'Starter',
  creator:   'Creator',
  elite:     'Elite',
  signature: 'Signature',
};

const STEPS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    title: 'Configura il bot',
    desc: 'Personalizza la personalità, le risposte automatiche e i comandi dalla pagina Configurazione.',
    href: '/config',
    cta: 'Configura ora',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
    ),
    title: 'Connetti Twitch',
    desc: 'Assicurati che il bot sia connesso al tuo canale. Vai alla Dashboard per vedere lo stato.',
    href: '/dashboard',
    cta: 'Vai alla Dashboard',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
    title: 'Testalo in chat',
    desc: 'Scrivi !hally nella tua chat Twitch per vedere il bot in azione in tempo reale.',
    href: '/dashboard',
    cta: 'Monitora la chat',
  },
];

export default function SuccessPage({ user }) {
  const [searchParams] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const plan = searchParams.get('plan') ?? '';
  const planLabel = PLAN_LABELS[plan] ?? null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 py-16"
      style={{ backgroundColor: '#0a0a0a', color: '#f0f0f0' }}
    >
      {/* Glow background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 70%)',
        }}
      />

      <div
        className="relative w-full max-w-2xl transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
      >
        {/* Check icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.4)' }}
          >
            <svg className="w-10 h-10" style={{ color: PURPLE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        </div>

        {/* Titolo */}
        <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-3 tracking-tight">
          Benvenuto su StreaMindAI!
        </h1>
        <p className="text-center text-lg mb-2" style={{ color: '#a0a0a0' }}>
          Il tuo abbonamento è attivo. Hai <strong style={{ color: '#f0f0f0' }}>7 giorni di prova gratuita</strong> — nessun addebito oggi.
        </p>

        {/* Piano attivato */}
        {planLabel && (
          <div
            className="mx-auto mt-6 mb-10 w-fit px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: PURPLE }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: PURPLE }} />
            Piano {planLabel} attivato
          </div>
        )}

        {/* Passi successivi */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ backgroundColor: '#111', border: '1px solid #222' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: '#666' }}>
            Prossimi passi
          </h2>
          <div className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl p-4 transition-colors duration-150"
                style={{ backgroundColor: '#191919', border: '1px solid #252525' }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: PURPLE }}
                >
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: PURPLE, color: '#fff' }}
                    >
                      {i + 1}
                    </span>
                    <p className="font-semibold text-sm" style={{ color: '#f0f0f0' }}>{step.title}</p>
                  </div>
                  <p className="text-sm" style={{ color: '#888' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA principale */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={user ? '/dashboard' : '/login'}
            className="flex items-center justify-center gap-2 font-semibold text-white px-8 py-3.5 rounded-xl text-base transition-all duration-150"
            style={{ backgroundColor: PURPLE, boxShadow: '0 0 24px rgba(139,92,246,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 32px rgba(139,92,246,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = PURPLE; e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.35)'; }}
          >
            Vai alla Dashboard
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            to="/config"
            className="flex items-center justify-center font-medium px-8 py-3.5 rounded-xl text-base transition-colors duration-150 border"
            style={{ borderColor: '#262626', color: '#a0a0a0', backgroundColor: '#151515' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#383838'; e.currentTarget.style.color = '#f0f0f0'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#262626'; e.currentTarget.style.color = '#a0a0a0'; }}
          >
            Configura il bot
          </Link>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: '#444' }}>
          Hai domande? Scrivici su{' '}
          <a href="/contatti" className="underline" style={{ color: '#666' }}>
            contatti
          </a>{' '}
          — risponderemo in poche ore.
        </p>
      </div>
    </div>
  );
}
