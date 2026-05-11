/**
 * Limiti e funzionalità per ogni piano StreaMind.
 * Importare questo file ovunque servano controlli sul piano.
 *
 * Convenzione: -1 = illimitato, false = non disponibile
 */

export const PLAN_LIMITS = {

  starter: {
    // Limiti messaggi
    userMessagesPerSession:    3,
    channelMessagesPerSession: 100,
    monthlyMessages:           2_000,

    // Funzionalità
    characters:          5,
    songRequest:         false,
    memory:              false,
    discord:             false,
    analytics:           false,
    customEventMessages: false,

    // Risposte automatiche eventi Twitch
    events: ['follow', 'subscribe'],
  },

  creator: {
    userMessagesPerSession:    5,
    channelMessagesPerSession: 300,
    monthlyMessages:           6_000,

    characters:          -1,      // illimitati
    songRequest:         true,
    memory:              true,    // memoria base
    discord:             true,
    analytics:           false,
    customEventMessages: false,

    events: ['follow', 'subscribe', 'gift_sub', 'cheer', 'hype_train', 'raid'],
  },

  elite: {
    userMessagesPerSession:    10,
    channelMessagesPerSession: 600,
    monthlyMessages:           13_000,

    characters:          -1,
    songRequest:         true,
    memory:              true,    // avanzata con game_context
    discord:             true,
    analytics:           true,
    customEventMessages: true,

    events: ['follow', 'subscribe', 'gift_sub', 'cheer', 'hype_train', 'raid'],
  },

  signature: {
    userMessagesPerSession:    20,
    channelMessagesPerSession: 1_500,
    monthlyMessages:           33_000,

    characters:          -1,
    songRequest:         true,
    memory:              true,
    discord:             true,
    analytics:           true,
    customEventMessages: true,

    events: ['follow', 'subscribe', 'gift_sub', 'cheer', 'hype_train', 'raid'],
  },

};

/** Restituisce i limiti per un piano, con fallback a starter se non trovato. */
export function getLimits(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;
}

/** Nomi leggibili dei piani */
export const PLAN_LABELS = {
  starter:   'Starter',
  creator:   'Creator',
  elite:     'Elite',
  signature: 'Signature',
};

/** Prezzi mensili in euro */
export const PLAN_PRICES = {
  starter:   9,
  creator:   19,
  elite:     39,
  signature: 99,
};
