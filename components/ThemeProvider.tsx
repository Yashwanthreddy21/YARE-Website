'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const ThemeContext = createContext<{ theme: ThemePreference; setTheme: (theme: ThemePreference) => void }>({ theme: 'system', setTheme: () => undefined });

function applyTheme(theme: ThemePreference) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('system');

  useEffect(() => {
    const saved = window.localStorage.getItem('yare-theme') as ThemePreference | null;
    const initial = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    setThemeState(initial);
    applyTheme(initial);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if ((window.localStorage.getItem('yare-theme') ?? 'system') === 'system') applyTheme('system');
    };
    media.addEventListener('change', handleSystemChange);
    return () => media.removeEventListener('change', handleSystemChange);
  }, []);

  const setTheme = (next: ThemePreference) => {
    setThemeState(next);
    window.localStorage.setItem('yare-theme', next);
    applyTheme(next);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
