import type { ReactNode } from 'react';
import { formatTemperature } from './format';
import { CloudCheckIcon, CloudLightningIcon, CloudRainCheckIcon, CloudSnowIcon, CloudIcon } from './icons';

export type HourlyCondition = 'clear' | 'cloudy' | 'rain' | 'thunderstorm' | 'snow';

export interface HourlyForecastEntry {
  time: string;
  condition: HourlyCondition;
  temperature_c: number;
}

interface HourlyTimelineProps {
  entries?: HourlyForecastEntry[];
}

const CONDITION_ICONS: Record<HourlyCondition, ReactNode> = {
  clear: <CloudCheckIcon className="h-6 w-6 text-yellow-400" />,
  cloudy: <CloudIcon className="h-6 w-6 text-white/70" />,
  rain: <CloudRainCheckIcon className="h-6 w-6 text-blue-300" />,
  thunderstorm: <CloudLightningIcon className="h-6 w-6 text-yellow-300" />,
  snow: <CloudSnowIcon className="h-6 w-6 text-cyan-200" />,
};

const PLACEHOLDER_ENTRIES: HourlyForecastEntry[] = [
  { time: 'Now', condition: 'cloudy', temperature_c: 28 },
  { time: '1 PM', condition: 'cloudy', temperature_c: 29 },
  { time: '2 PM', condition: 'rain', temperature_c: 28 },
  { time: '3 PM', condition: 'thunderstorm', temperature_c: 27 },
  { time: '4 PM', condition: 'thunderstorm', temperature_c: 26 },
  { time: '5 PM', condition: 'rain', temperature_c: 27 },
  { time: '6 PM', condition: 'cloudy', temperature_c: 27 },
  { time: '7 PM', condition: 'cloudy', temperature_c: 26 },
  { time: '8 PM', condition: 'clear', temperature_c: 26 },
  { time: '9 PM', condition: 'clear', temperature_c: 25 },
  { time: '10 PM', condition: 'clear', temperature_c: 25 },
  { time: '11 PM', condition: 'cloudy', temperature_c: 24 },
  { time: '12 AM', condition: 'cloudy', temperature_c: 24 },
  { time: '1 AM', condition: 'cloudy', temperature_c: 24 },
  { time: '2 AM', condition: 'clear', temperature_c: 23 },
  { time: '3 AM', condition: 'clear', temperature_c: 23 },
  { time: '4 AM', condition: 'clear', temperature_c: 23 },
  { time: '5 AM', condition: 'clear', temperature_c: 23 },
  { time: '6 AM', condition: 'cloudy', temperature_c: 24 },
  { time: '7 AM', condition: 'cloudy', temperature_c: 25 },
  { time: '8 AM', condition: 'clear', temperature_c: 27 },
  { time: '9 AM', condition: 'clear', temperature_c: 29 },
  { time: '10 AM', condition: 'clear', temperature_c: 30 },
  { time: '11 AM', condition: 'cloudy', temperature_c: 30 },
];

export function HourlyTimeline({ entries = PLACEHOLDER_ENTRIES }: HourlyTimelineProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white/90">Hourly Forecast</h2>

      <div className="mt-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2">
          {entries.map((entry, index) => (
            <div
              key={`${entry.time}-${index}`}
              className="flex w-16 flex-shrink-0 flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-3"
            >
              <div className="text-xs font-medium text-white/70">{entry.time}</div>
              {CONDITION_ICONS[entry.condition]}
              <div className="text-sm font-medium text-white">{formatTemperature(entry.temperature_c)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
