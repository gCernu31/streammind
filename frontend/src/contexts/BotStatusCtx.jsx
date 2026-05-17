import { createContext, useContext, useState } from 'react';

// botActive: true = verde, false = rosso, null = grigio (non configurato / caricamento)
const Ctx = createContext({ botActive: null, setBotActive: () => {} });

export function BotStatusProvider({ children }) {
  const [botActive, setBotActive] = useState(null);
  return <Ctx.Provider value={{ botActive, setBotActive }}>{children}</Ctx.Provider>;
}

export const useBotStatus = () => useContext(Ctx);
