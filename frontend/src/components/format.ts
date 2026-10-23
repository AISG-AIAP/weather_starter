export function formatTemperature(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)}°` : '--°';
}

export function formatTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatHumidity(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)}%` : '--';
}

export function formatRainfall(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)} mm` : '--';
}

export function formatWind(speed: number | null | undefined, direction: number | null | undefined): string {
  if (!speed || !direction) return '--';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(direction / 22.5) % 16;
  return `${Math.round(speed)} kt ${dirs[index]}`;
}

export function getAirQualityLabel(psi: number | null | undefined): { label: string; color: string } {
  if (!psi) return { label: '--', color: 'text-white/50' };
  if (psi <= 50) return { label: 'Good', color: 'text-green-400' };
  if (psi <= 100) return { label: 'Moderate', color: 'text-yellow-400' };
  if (psi <= 200) return { label: 'Unhealthy', color: 'text-orange-400' };
  return { label: 'Hazardous', color: 'text-red-400' };
}
