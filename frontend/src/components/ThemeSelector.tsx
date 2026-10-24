import { useEffect, useState } from 'react';
import { defaultTheme, isThemeId, themes, type ThemeId } from '../theme';

const storageKey = 'weather-starter-theme';

function getInitialTheme(): ThemeId {
  if (typeof window === 'undefined') return defaultTheme;

  const savedTheme = window.localStorage.getItem(storageKey);
  return isThemeId(savedTheme) ? savedTheme : defaultTheme;
}

export function ThemeSelector() {
  const [theme, setTheme] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  return (
    <label className="theme-selector">
      <span className="sr-only">Visual theme</span>
      <select
        aria-label="Visual theme"
        value={theme}
        onChange={(event) => {
          const nextTheme = event.target.value;
          if (isThemeId(nextTheme)) setTheme(nextTheme);
        }}
      >
        {themes.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 12 8" aria-hidden="true">
        <path d="m1 1 5 5 5-5" />
      </svg>
    </label>
  );
}
