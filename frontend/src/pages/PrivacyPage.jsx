import LegalLayout, { LegalContent } from '../components/LegalLayout.jsx';

const CONTENT = `
# Privacy Policy di StreaMindAI

**Titolare del trattamento:** Giuseppe Cernuto, P.IVA 01073170142
**Email:** support@streamindai.com

## 1. Introduzione

StreaMindAI ("noi", "nostro", "la piattaforma") è un servizio SaaS che permette agli streamer Twitch di creare bot AI personalizzati per la propria chat. Questa Privacy Policy descrive come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali in conformità al Regolamento (UE) 2016/679 (GDPR).

## 2. Dati che raccogliamo

**Dati forniti direttamente:**
- Username e ID Twitch (tramite autenticazione OAuth)
- Indirizzo email
- Dati di configurazione del bot (nome, personalità, membri)
- Dati di pagamento (gestiti da Stripe — non conserviamo numeri di carta)

**Dati raccolti automaticamente:**
- Messaggi della chat Twitch pubblica del tuo canale (per il funzionamento del bot)
- Dati di utilizzo del servizio (numero di messaggi, comandi utilizzati)
- Log tecnici per la sicurezza del servizio

**Dati di terze parti:**
- Dati del canale Twitch (follower, subscriber, eventi) tramite API Twitch
- Dati Spotify (solo se integrazione attivata) tramite API Spotify

## 3. Come utilizziamo i dati

- **Erogazione del servizio:** per far funzionare il tuo bot AI personalizzato
- **Miglioramento del servizio:** analisi aggregate anonimizzate sull'utilizzo
- **Comunicazioni:** email transazionali (conferma abbonamento, notifiche tecniche)
- **Fatturazione:** gestione abbonamenti tramite Stripe
- **Sicurezza:** prevenzione di abusi e frodi

## 4. Base giuridica del trattamento

- **Esecuzione del contratto:** per erogare il servizio sottoscritto
- **Legittimo interesse:** sicurezza del servizio e prevenzione frodi
- **Consenso:** per comunicazioni promozionali (opzionale)

## 5. Conservazione dei dati

- Dati account: conservati per tutta la durata del contratto + 12 mesi
- Messaggi chat analizzati: conservati per 90 giorni, poi anonimizzati
- Dati di pagamento: gestiti da Stripe secondo le loro policy
- Log tecnici: 30 giorni

## 6. Condivisione dei dati

Non vendiamo i tuoi dati. Li condividiamo solo con:
- **Stripe:** per la gestione dei pagamenti (sede USA, con garanzie adeguate)
- **Twitch:** tramite API per il funzionamento del bot
- **Google (Gemini):** per la generazione delle risposte AI (dati anonimizzati)
- **Resend:** per l'invio di email transazionali
- **Railway:** per l'hosting dell'infrastruttura (sede USA, clausole SCCs)

## 7. I tuoi diritti (GDPR)

Hai diritto a:
- **Accesso:** ricevere copia dei tuoi dati personali
- **Rettifica:** correggere dati inesatti o incompleti
- **Cancellazione:** richiedere la cancellazione dei tuoi dati ("diritto all'oblio")
- **Portabilità:** ricevere i tuoi dati in formato strutturato e leggibile da macchina
- **Opposizione:** opporti al trattamento per legittimo interesse
- **Limitazione:** limitare il trattamento in certi casi previsti dalla legge

Per esercitare questi diritti scrivi a: **support@streamindai.com**
Risponderemo entro 30 giorni dalla ricezione della richiesta.

## 8. Cookie

Utilizziamo solo cookie tecnici necessari per il funzionamento del servizio (sessione di login). Vedi la nostra Cookie Policy per tutti i dettagli.

## 9. Sicurezza

Utilizziamo crittografia SSL/TLS per tutte le comunicazioni, autenticazione JWT per le sessioni, e seguiamo le best practice di sicurezza per proteggere i tuoi dati da accessi non autorizzati.

## 10. Minori

StreaMindAI non è destinata a persone di età inferiore a 16 anni. Se sei un genitore o tutore e ritieni che tuo figlio abbia fornito dati personali, contattaci immediatamente a support@streamindai.com.

## 11. Modifiche alla Privacy Policy

Ti notificheremo via email di eventuali modifiche sostanziali con almeno 30 giorni di preavviso. L'uso continuato del servizio dopo le modifiche costituisce accettazione della nuova versione.

## 12. Autorità di controllo

Hai il diritto di proporre reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it) se ritieni che il trattamento dei tuoi dati violi il GDPR.

## 13. Contatti

Per qualsiasi domanda relativa alla privacy: **support@streamindai.com**
`;

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="Privacy Policy di StreaMindAI. Come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali in conformità al GDPR."
      canonical="/privacy"
      lastUpdate="Maggio 2026"
    >
      <LegalContent text={CONTENT} />
    </LegalLayout>
  );
}
