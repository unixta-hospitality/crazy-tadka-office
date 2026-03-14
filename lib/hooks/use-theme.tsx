'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme-preference';
const DEFAULT_THEME: Theme = 'dark';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  // Initialise from localStorage on mount (avoids Next.js SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const resolved: Theme = stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME;
    setThemeState(resolved);
    applyTheme(resolved);
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
