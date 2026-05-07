import { createContext, useContext, useEffect, useState } from 'react';
import type { ProviderProps } from '../types';

interface Theme {
  id: string;
  label: string;
}

interface ThemeContextValue {
  themeId: string;
  setThemeId: (themeId: string) => void;
  themes: Theme[];
}

export const THEMES: Theme[] = [{ id: 'apple', label: 'Apple' }];

export const DEFAULT_THEME_ID = 'apple';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: ProviderProps) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
  }, [themeId]);

  const value = {
    themeId,
    setThemeId,
    themes: THEMES,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
