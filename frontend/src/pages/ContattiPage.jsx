import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import LegalLayout from '../components/LegalLayout.jsx';

const PURPLE = '#8B5CF6';

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#d0d0d0', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '5px' }}>{error}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', error }) {
  const border = `1px solid ${error ? '#f87171' : '#2a2a2a'}`;
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#0d0d0d', color: '#f0f0f0', fontSize: '14px', outline: 'none', border, boxSizing: 'border-box', transition: 'border-color 0.15s' }}
      onFocus={e  => (e.target.style.borderColor = error ? '#f87171' : PURPLE)}
      onBlur={e   => (e.target.style.borderColor = error ? '#f87171' : '#2a2a2a')}
    />
  );
}

function Textarea({ value, onChange, placeholder, error }) {
  const border = `1px solid ${error ? '#f87171' : '#2a2a2a'}`;
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={5}
      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#0d0d0d', color: '#f0f0f0', fontSize: '14px', outline: 'none', border, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
      onFocus={e  => (e.target.style.borderColor = error ? '#f87171' : PURPLE)}
      onBlur={e   => (e.target.style.borderColor = error ? '#f87171' : '#2a2a2a')}
    />
  );
}

const EMPTY = { nome: '', email: '', messaggio: '', privacy: false };

export default function ContattiPage() {
  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState]   = useState('idle'); // idle | loading | success | error
  const [serverError, setServerError] = useState('');

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.nome.trim())              e.nome      = 'Il nome è obbligatorio.';
    if (!form.email.trim())             e.email     = "L'email è obbligatoria.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Email non valida.';
    if (!form.messaggio.trim())         e.messaggio = 'Il messaggio è obbligatorio.';
    else if (form.messaggio.trim().length < 10) e.messaggio = 'Messaggio troppo breve (min. 10 caratteri).';
    if (!form.privacy)                  e.privacy   = 'Devi accettare la Privacy Policy.';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setState('loading');
    setServerError('');
    try {
      await axios.post('/api/contact/general', {
        nome:      form.nome.trim(),
        email:     form.email.trim(),
        messaggio: form.messaggio.trim(),
      }, { timeout: 15_000 });
      setState('success');
    } catch (err) {
      setServerError(err.response?.data?.error ?? 'Errore nell\'invio. Riprova o scrivi a support@streamindai.com.');
      setState('error');
    }
  };

  return (
    <LegalLayout
      title="Contatti"
      description="Contatta il team di StreaMindAI. Siamo qui per aiutarti con il tuo bot AI per Twitch."
      canonical="/contatti"
    >
      <Helmet>
        <meta name="robots" content="index,follow" />
      </Helmet>

      <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Contattaci</h1>
      <p style={{ fontSize: '15px', color: '#6b6b6b', marginBottom: '40px' }}>
        Hai domande o hai bisogno di supporto? Compila il form e ti risponderemo entro poche ore.
      </p>

      {state === 'success' ? (
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#f0f0f0', fontWeight: 700, marginBottom: '8px' }}>Messaggio inviato!</h2>
          <p style={{ color: '#6b6b6b', fontSize: '14px' }}>
            Abbiamo ricevuto il tuo messaggio e ti risponderemo all'indirizzo <strong style={{ color: '#d0d0d0' }}>{form.email}</strong> entro poche ore.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <Field label="Nome *" error={errors.nome}>
              <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Il tuo nome" error={errors.nome} />
            </Field>

            <Field label="Email *" error={errors.email}>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="la-tua@email.com" error={errors.email} />
            </Field>

            <Field label="Messaggio *" error={errors.messaggio}>
              <Textarea value={form.messaggio} onChange={e => set('messaggio', e.target.value)} placeholder="Scrivi il tuo messaggio..." error={errors.messaggio} />
            </Field>

            {/* Checkbox privacy */}
            <div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={form.privacy} onChange={e => set('privacy', e.target.checked)}
                  style={{ marginTop: '3px', accentColor: PURPLE, flexShrink: 0 }}
                />
                <span style={{ fontSize: '13px', color: '#8a8a8a', lineHeight: '1.6' }}>
                  Ho letto e accetto la{' '}
                  <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: PURPLE }}>Privacy Policy</a>
                  {' '}e acconsento al trattamento dei dati personali per rispondere alla mia richiesta. *
                </span>
              </label>
              {errors.privacy && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px', marginLeft: '24px' }}>{errors.privacy}</p>}
            </div>
          </div>

          {state === 'error' && serverError && (
            <p style={{ color: '#f87171', fontSize: '13px', padding: '10px 16px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
              {serverError}
            </p>
          )}

          <button
            type="submit" disabled={state === 'loading'}
            style={{
              background: PURPLE, color: '#fff', border: 'none',
              padding: '14px 32px', borderRadius: '12px',
              fontSize: '15px', fontWeight: 700, cursor: state === 'loading' ? 'default' : 'pointer',
              opacity: state === 'loading' ? 0.7 : 1, transition: 'all 0.15s', alignSelf: 'flex-start',
            }}
            onMouseEnter={e => { if (state !== 'loading') e.currentTarget.style.background = '#7C3AED'; }}
            onMouseLeave={e => (e.currentTarget.style.background = PURPLE)}
          >
            {state === 'loading' ? 'Invio in corso...' : 'Invia messaggio →'}
          </button>

          <p style={{ fontSize: '12px', color: '#3a3a3a' }}>
            In alternativa scrivi direttamente a{' '}
            <a href="mailto:support@streamindai.com" style={{ color: '#555' }}>support@streamindai.com</a>
          </p>
        </form>
      )}
    </LegalLayout>
  );
}
