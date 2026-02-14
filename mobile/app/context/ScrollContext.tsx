// mobile/app/context/ScrollContext.tsx
import { createContext, useContext, useState } from 'react';

const ScrollContext = createContext({
  scrollEnabled: true,
  setScrollEnabled: (enabled: boolean) => { },
});

export const useScrollEnabled = () => useContext(ScrollContext);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [scrollEnabled, setScrollEnabled] = useState(true);
  return (
    <ScrollContext.Provider value={{ scrollEnabled, setScrollEnabled }}>
      {children}
    </ScrollContext.Provider>
  );
}
