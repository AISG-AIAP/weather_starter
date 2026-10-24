export const themes = [
  {
    id: 'apple',
    name: 'Apple',
  },
  {
    id: 'atmospheric-glass',
    name: 'Atmospheric Glass',
  },
  {
    id: 'meteorological-station',
    name: 'Meteorological Station',
  },
  {
    id: 'soft-forecast',
    name: 'Soft Forecast',
  },
  {
    id: 'midnight-radar',
    name: 'Midnight Radar',
  },
  {
    id: 'editorial-weather',
    name: 'Editorial Weather',
  },
  {
    id: 'solar-minimal',
    name: 'Solar Minimal',
  },
  {
    id: 'retro-broadcast',
    name: 'Retro Broadcast',
  },
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export const defaultTheme: ThemeId = 'apple';

export function isThemeId(value: string | null): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}
