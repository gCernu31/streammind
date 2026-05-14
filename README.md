# StreaMindAI

> Dai una mente al tuo stream.

Pannello web SaaS multi-tenant per creare e gestire bot AI personalizzati per Twitch.  
Ogni streamer si autentica con Twitch OAuth, configura il proprio bot e paga via Stripe.

---

## Stack

| Layer | Tecnologie |
|-------|-----------|
| **Backend** | Node.js 20 · Express · PostgreSQL |
| **Frontend** | React 18 · Vite · Tailwind CSS |
| **Auth** | Twitch OAuth 2.0 · JWT (7 giorni) |
| **Pagamenti** | Stripe Checkout · Customer Portal · Webhook |
| **AI** | Gemini (system prompt generato dinamicamente) |
| **Hosting** | Railway (Docker) |

---

## Setup locale

### 1. Clona e installa

```bash
git clone <repo>
cd hally-dashboard
npm run install:all
```

### 2. Configura le variabili d'ambiente

```bash
cp .env.example backend/.env
# Apri backend/.env e compila tutti i valori
```

### 3. Applica lo schema al database

```bash
npm run migrate
```

### 4. Avvia in sviluppo

```bash
# Terminale 1 — Backend  (porta 3001)
npm run dev:backend

# Terminale 2 — Frontend (porta 5173, proxy → 3001)
npm run dev:frontend
```

Il frontend in dev fa proxy automatico di `/api/*` verso `localhost:3001` (vite.config.js).

---

## Deploy su Railway

### Prerequisiti

- Account [Railway](https://railway.app)
- Servizio PostgreSQL su Railway (genera `DATABASE_URL` automaticamente)
- App Twitch su [dev.twitch.tv](https://dev.twitch.tv/console/apps)
- Account Stripe con 3 prodotti creati (Base/Pro/Elite)

### Passaggi

**1. Crea il progetto Railway**

```bash
# Installa Railway CLI (opzionale)
npm install -g @railway/cli
railway login
railway init
```

Oppure usa l'interfaccia web: **New Project → Deploy from GitHub repo**.

**2. Aggiungi PostgreSQL**

Dal dashboard Railway: **New → Database → PostgreSQL**.  
Railway inietterà `DATABASE_URL` automaticamente nell'ambiente.

**3. Configura le variabili d'ambiente**

Nel pannello Railway → *Variables*, aggiungi:

| Variabile | Valore |
|-----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://streamindai.com` |
| `JWT_SECRET` | stringa casuale 64+ caratteri |
| `TWITCH_CLIENT_ID` | da dev.twitch.tv |
| `TWITCH_CLIENT_SECRET` | da dev.twitch.tv |
| `TWITCH_REDIRECT_URI` | `https://streamindai.com/api/auth/twitch/callback` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_PRICE_STARTER` | ID prezzo Starter (9€) |
| `STRIPE_PRICE_CREATOR` | ID prezzo Creator (19€) |
| `STRIPE_PRICE_ELITE` | ID prezzo Elite (35€) |
| `STRIPE_PRICE_SIGNATURE` | ID prezzo Signature (99€) |
| `SMTP_HOST` | host SMTP (es. smtp.brevo.com) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | username SMTP |
| `SMTP_PASS` | password SMTP |
| `FROM_EMAIL` | `noreply@streamindai.com` |
| `APP_URL` | `https://streamindai.com` |

**4. Configura il dominio su Railway**

Railway → progetto StreaMindAI → **Settings → Domains → Add Domain** → `streamindai.com`

Aggiungi i record DNS generati da Railway su Cloudflare (CNAME o A record).

**5. Configura il webhook Stripe**

Nel [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks):

- Endpoint URL: `https://streamindai.com/webhooks/stripe`
- Eventi da ascoltare:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.subscription.trial_will_end`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

Copia il **Webhook signing secret** (`whsec_...`) in `STRIPE_WEBHOOK_SECRET`.

**6. Configura l'app Twitch**

Su [dev.twitch.tv](https://dev.twitch.tv/console/apps), nella tua app aggiungi:

```
OAuth Redirect URL: https://streamindai.com/api/auth/twitch/callback
```

**6. Deploy**

```bash
railway up
# oppure fai push su GitHub se hai collegato il repo
```

Railway eseguirà automaticamente:
1. Build multi-stage del Dockerfile (frontend → dist, backend → deps)
2. `start.sh`: migrazione schema + avvio Express
3. Health check su `/api/health`

---

## Struttura del progetto

```
/
├── Dockerfile              # Build multi-stage (frontend + backend)
├── railway.toml            # Configurazione Railway
├── .env.example            # Template variabili d'ambiente
├── .dockerignore
│
├── /backend
│   ├── server.js           # Entry point Express (CORS, static, routes)
│   ├── db.js               # Pool PostgreSQL
│   ├── schema.sql          # Schema DB multi-tenant (idempotente)
│   ├── migrate.js          # Runner migrazioni
│   ├── start.sh            # migrate + avvio (usato in Docker)
│   ├── /middleware
│   │   └── auth.js         # authenticateToken / requireAuth
│   ├── /routes
│   │   ├── auth.js         # Twitch OAuth + /api/auth/me
│   │   ├── config.js       # GET/PUT /api/config
│   │   ├── memory.js       # CRUD /api/memories
│   │   ├── dashboard.js    # GET /api/stats
│   │   └── subscription.js # Stripe Checkout/Portal/Webhook
│   └── /services
│       └── promptBuilder.js # generateBotPrompt(streamerId)
│
└── /frontend
    ├── index.html
    ├── vite.config.js      # Proxy /api → localhost:3001 in dev
    ├── tailwind.config.js
    └── /src
        ├── App.jsx          # Router + ProtectedRoute + useAuth
        ├── /pages
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── ConfigPage.jsx
        │   ├── MemoryPage.jsx
        │   └── SubscriptionPage.jsx
        └── /components
            ├── Layout.jsx
            └── Sidebar.jsx
```

---

## API Reference

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| `GET` | `/api/health` | — | Health check + DB |
| `GET` | `/api/me` | ✓ | Profilo utente corrente |
| `GET` | `/api/auth/twitch` | — | Redirect OAuth Twitch |
| `GET` | `/api/auth/twitch/callback` | — | Callback OAuth |
| `GET` | `/api/config` | ✓ | Configurazione bot |
| `PUT` | `/api/config` | ✓ | Aggiorna configurazione |
| `GET` | `/api/memories` | ✓ | Lista memorie (paginata, filtrabile) |
| `POST` | `/api/memories` | ✓ | Crea memoria |
| `DELETE` | `/api/memories/:id` | ✓ | Elimina memoria |
| `GET` | `/api/stats` | ✓ | Statistiche dashboard |
| `GET` | `/api/subscription` | ✓ | Stato abbonamento |
| `GET` | `/api/subscription/invoices` | ✓ | Storico fatture |
| `POST` | `/api/subscription/create` | ✓ | Crea Stripe Checkout Session |
| `POST` | `/api/subscription/portal` | ✓ | Apre Customer Portal |
| `POST` | `/api/subscription/cancel` | ✓ | Cancella abbonamento |
| `POST` | `/webhooks/stripe` | — | Webhook Stripe (raw body) |

---

## Piani

| Piano | Prezzo | Funzionalità |
|-------|--------|-------------|
| **Base** | 7€/mese | Bot AI base, 5 personaggi, memoria 30 giorni |
| **Pro** | 15€/mese | Tutto illimitato, song request Spotify, personalità custom |
| **Elite** | 29€/mese | Tutto Pro + supporto prioritario + accesso anticipato |

---

## Sviluppo

### Generazione JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Reset database locale

```bash
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run migrate
```

### Test webhook Stripe in locale

```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
```
