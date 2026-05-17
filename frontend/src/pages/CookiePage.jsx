import LegalLayout, { LegalContent } from '../components/LegalLayout.jsx';

const CONTENT = `
# Cookie Policy di StreaMindAI

## Cosa sono i cookie

I cookie sono piccoli file di testo salvati sul tuo dispositivo quando visiti un sito web. Servono a ricordare le tue preferenze e a garantire il corretto funzionamento del sito.

## Cookie che utilizziamo

**Cookie tecnici necessari (non richiedono consenso):**
- **auth_token** — mantiene la tua sessione di login attiva (durata: 30 giorni). Senza questo cookie non è possibile rimanere autenticati.
- **smai_cookie_accepted** — ricorda che hai accettato questa Cookie Policy (durata: 1 anno, salvato in localStorage).

Questi cookie sono strettamente necessari per il funzionamento del servizio e non possono essere disabilitati senza compromettere le funzionalità del sito.

**Cookie analitici:**
- Al momento non utilizziamo Google Analytics, Meta Pixel o altri strumenti di tracciamento comportamentale. Se dovessimo aggiungerli in futuro, aggiorneremo questa policy e ti chiederemo il consenso esplicito.

**Cookie di terze parti:**
- **Stripe:** cookie tecnici necessari per la gestione sicura dei pagamenti. Consulta la Cookie Policy di Stripe per i dettagli.
- **Twitch:** cookie necessari per l'autenticazione OAuth. Consulta la Cookie Policy di Twitch per i dettagli.

## Come gestire i cookie

Puoi configurare il tuo browser per bloccare o eliminare i cookie, ma tieni presente che:
- Bloccare i cookie tecnici impedirà il funzionamento del login e di altre funzionalità essenziali
- Puoi eliminare i cookie in qualsiasi momento dalle impostazioni del browser

**Istruzioni per i principali browser:**
- Chrome: Impostazioni → Privacy e sicurezza → Cookie e altri dati dei siti
- Firefox: Impostazioni → Privacy e sicurezza → Cookie e dati dei siti
- Safari: Preferenze → Privacy → Gestisci dati sito web

## Aggiornamenti alla Cookie Policy

Se dovessimo modificare significativamente l'uso dei cookie, ti informeremo tramite banner sul sito o via email.

## Contatti

Per domande sui cookie: **support@streamindai.com**
`;

export default function CookiePage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      description="Cookie Policy di StreaMindAI — quali cookie utilizziamo e come gestirli."
      canonical="/cookie"
      lastUpdate="Maggio 2026"
    >
      <LegalContent text={CONTENT} />
    </LegalLayout>
  );
}
