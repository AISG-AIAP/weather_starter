import { CloudIcon, SunIcon } from './icons';
import type { ForecastPeriod } from '../types';

interface HourlyStripProps {
  periods?: ForecastPeriod[];
}

function shortenLabel(label: string): string {
  if (!label) return '';
  const start = label.split(' to ')[0];
  return start.replace(/\s\d{4}\b/, '');
}

export function HourlyStrip({ periods = [] }: HourlyStripProps) {
  if (periods.length === 0) {
    return (
      <section className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-xl">
        <p className="border-b border-white/10 px-4 py-2 text-[12px] text-white/85">
          Forecast unavailable from this data source.
        </p>
        <div className="flex min-h-[5rem] items-center justify-center text-sm text-white/55">
          --
        </div>
      </section>
    );
  }

  const slots = periods.map((period, index) => ({
    key: `${period.label}-${index}`,
    label: index === 0 ? 'Now' : shortenLabel(period.label),
    forecast: period.forecast,
  }));

  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-xl">
      <p className="border-b border-white/10 px-4 py-2 text-[12px] text-white/85">
        24-hour regional forecast.
      </p>
      <div
        className="grid divide-x divide-white/5"
        style={{
          gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))`,
        }}
      >
        {slots.map((slot) => {
          const isFair = slot.forecast?.toLowerCase().includes('fair');
          return (
            <div
              key={slot.key}
              className="flex flex-col items-center gap-2 px-2 py-4 text-center"
            >
              <div className="text-xs font-medium text-white/85">
                {slot.label}
              </div>
              {isFair ? (
                <SunIcon className="h-7 w-7 text-amber-300" />
              ) : (
                <CloudIcon className="h-7 w-7 text-white/85" />
              )}
              <div className="text-xs leading-snug text-white/90">
                {slot.forecast}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
