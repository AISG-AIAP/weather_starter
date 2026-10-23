export type ConditionCategory = 'thunderstorm' | 'rain' | 'snow' | 'clear' | 'cloudy';

export function classifyCondition(condition: string | null | undefined): ConditionCategory {
  const lower = condition?.toLowerCase() ?? '';
  if (lower.includes('thundery') || lower.includes('thunderstorm')) return 'thunderstorm';
  if (lower.includes('rain') || lower.includes('showers')) return 'rain';
  if (lower.includes('snow') || lower.includes('sleet')) return 'snow';
  if (lower.includes('clear') || lower.includes('sunny')) return 'clear';
  return 'cloudy';
}
