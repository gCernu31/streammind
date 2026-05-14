/**
 * Servizio email StreaMindAI — usa Nodemailer con SMTP configurabile.
 *
 * Variabili d'ambiente richieste:
 *   SMTP_HOST   — es. smtp.sendgrid.net / mail.privateemail.com
 *   SMTP_PORT   — default 587 (465 per SSL)
 *   SMTP_USER   — username SMTP
 *   SMTP_PASS   — password SMTP
 *   FROM_EMAIL  — mittente, default noreply@streamindai.com
 *   FRONTEND_URL — base URL del frontend per i link nelle email
 */

import nodemailer from 'nodemailer';

const FRONTEND = process.env.FRONTEND_URL ?? 'https://streammindai.com';
const FROM     = process.env.FROM_EMAIL   ?? 'noreply@streamindai.com';

function makeTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const transporter = makeTransporter();

export async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.warn('[Email] SMTP non configurato — email non inviata:', subject, '→', to);
    return;
  }
  await transporter.sendMail({ from: `StreaMindAI <${FROM}>`, to, subject, html });
}

// ── Layout HTML comune ────────────────────────────────────────────────────────
function wrapHtml(bodyContent) {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>StreaMindAI</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:system-ui,-apple-system,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0"
  style="background:#151515;border:1px solid #262626;border-radius:16px;padding:44px 40px;max-width:560px">
<tr><td>
  <!-- Logo -->
  <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">StreaMindAI</p>
  <p style="margin:0 0 36px;font-size:12px;color:#8B5CF6;letter-spacing:0.5px;text-transform:uppercase">Il tuo bot Twitch intelligente</p>
  ${bodyContent}
  <!-- Footer -->
  <p style="margin:36px 0 0;font-size:11px;color:#444;border-top:1px solid #262626;padding-top:20px">
    StreaMindAI · <a href="${FRONTEND}" style="color:#6b6b6b;text-decoration:none">${FRONTEND.replace('https://', '')}</a><br>
    Non affiliato con Twitch Interactive, Inc.
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(label, href) {
  return `<table cellpadding="0" cellspacing="0" style="margin-top:28px"><tr><td>
    <a href="${href}"
       style="display:inline-block;background:#8B5CF6;color:#ffffff;font-weight:700;
              font-size:14px;text-decoration:none;padding:14px 28px;border-radius:10px;
              letter-spacing:0.2px">
      ${label}
    </a>
  </td></tr></table>`;
}

// ── Email: promemoria trial (giorno 5, 2 giorni alla scadenza) ────────────────
// Stripe invia customer.subscription.trial_will_end di default 3 giorni prima.
// Configurare in Stripe Dashboard → Settings → Subscriptions a 2 giorni per esattezza.
export async function sendTrialReminderEmail({ to, displayName, planName, trialEnd }) {
  const daysLeft = Math.max(1, Math.round((trialEnd - Date.now()) / 86_400_000));
  const endStr   = new Date(trialEnd).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' });

  await sendEmail({
    to,
    subject: `⏰ Mancano ${daysLeft} giorni — hai già configurato il tuo bot?`,
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        ⏰ Il tuo trial scade tra ${daysLeft} ${daysLeft === 1 ? 'giorno' : 'giorni'}
      </h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        il tuo trial <strong style="color:#8B5CF6">${planName}</strong> scade il
        <strong style="color:#ffffff">${endStr}</strong>.
      </p>
      <p style="margin:0 0 6px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Hai già completato la configurazione?
      </p>
      <ul style="margin:0 0 20px;padding-left:20px;color:#a0a0a0;font-size:14px;line-height:2">
        <li>Personalità del bot</li>
        <li>Membri della community</li>
        <li>Orari e link social</li>
        <li>Comandi personalizzati</li>
      </ul>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#6b6b6b">
        Se non vuoi continuare, cancella prima della scadenza dal pannello — non verrà addebitato nulla.
      </p>
      ${ctaButton('Configura il tuo bot →', `${FRONTEND}/config`)}
    `),
  });
}

// ── Email: trial convertito in abbonamento attivo ─────────────────────────────
export async function sendTrialActivatedEmail({ to, displayName, planName, nextBillingDate }) {
  const dateStr = new Date(nextBillingDate).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  await sendEmail({
    to,
    subject: `🎉 Il tuo abbonamento ${planName} è attivo!`,
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        🎉 Abbonamento attivato
      </h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        il tuo trial è terminato e il piano
        <strong style="color:#8B5CF6">${planName}</strong> è ora attivo.
      </p>
      <p style="margin:0 0 6px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Il primo addebito sarà il
        <strong style="color:#ffffff">${dateStr}</strong>.
      </p>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#6b6b6b">
        Puoi gestire o cancellare il tuo abbonamento in qualsiasi momento dal pannello.
      </p>
      ${ctaButton('Vai alla Dashboard →', `${FRONTEND}/dashboard`)}
    `),
  });
}

// ── Email: form contatto Signature ───────────────────────────────────────────
export async function sendContactFormEmail({ nome, twitchUsername, piano, motivo }) {
  await sendEmail({
    to:      'support@streamindai.com',
    subject: `[${piano}] Nuova richiesta da ${nome} (@${twitchUsername})`,
    html: `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:system-ui,sans-serif;color:#1a1a1a;padding:32px;max-width:600px">
  <h2 style="margin:0 0 6px;color:#8B5CF6">Nuova richiesta ${piano}</h2>
  <p style="margin:0 0 24px;font-size:13px;color:#888">Ricevuta tramite streammindai.com</p>
  <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
    <tr>
      <td style="padding:11px 16px;background:#f5f5f5;border-radius:6px 0 0 0;width:130px;color:#666;font-weight:600">Nome</td>
      <td style="padding:11px 16px;background:#fafafa;border-radius:0 6px 0 0">${nome}</td>
    </tr>
    <tr>
      <td style="padding:11px 16px;background:#f0f0f0;color:#666;font-weight:600">Twitch</td>
      <td style="padding:11px 16px;background:#f7f7f7">@${twitchUsername}</td>
    </tr>
    <tr>
      <td style="padding:11px 16px;background:#f5f5f5;color:#666;font-weight:600">Piano</td>
      <td style="padding:11px 16px;background:#fafafa">${piano}</td>
    </tr>
    <tr>
      <td style="padding:11px 16px;background:#f0f0f0;color:#666;font-weight:600;vertical-align:top">Motivo</td>
      <td style="padding:11px 16px;background:#f7f7f7;line-height:1.6">${motivo.replace(/\n/g, '<br>')}</td>
    </tr>
  </table>
</body>
</html>`,
  });
}
