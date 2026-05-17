import { createContext, useContext, useState } from 'react';

const Ctx = createContext({ dirty: false, setDirty: () => {} });

export function ConfigDirtyProvider({ children }) {
  const [dirty, setDirty] = useState(false);
  return <Ctx.Provider value={{ dirty, setDirty }}>{children}</Ctx.Provider>;
}

export const useConfigDirty = () => useContext(Ctx);
