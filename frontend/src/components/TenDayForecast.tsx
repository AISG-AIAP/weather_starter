import { CalendarIcon, CloudIcon } from './icons';
import type { DailyForecast, WeatherSnapshot } from '../types';

interface TenDayForecastProps {
  weather: WeatherSnapshot;
}

interface WeekRange {
  min: number;
  max: number;
}

function labelForDate(date: string, index: number): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return index === 0 ? 'Today' : date;
  return new Intl.DateTimeFormat([], { weekday: 'short' }).format(parsed);
}

function formatTemperature(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${Math.round(value)}°`
    : '--°';
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function computeWeekRange(days: DailyForecast[]): WeekRange | null {
  const lows = days.map((day) => day.temperature_low_c).filter(isFiniteNumber);
  const highs = days
    .map((day) => day.temperature_high_c)
    .filter(isFiniteNumber);
  if (lows.length === 0 || highs.length === 0) return null;
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  if (max === min) return null;
  return { min, max };
}

function barOffsets(day: DailyForecast, range: WeekRange | null) {
  if (!range) return null;
  const { min, max } = range;
  const span = max - min;
  const low = day.temperature_low_c;
  const high = day.temperature_high_c;
  if (!isFiniteNumber(low) || !isFiniteNumber(high)) return null;
  const left = ((low - min) / span) * 100;
  const right = ((max - high) / span) * 100;
  return { left, right };
}

export function TenDayForecast({ weather }: TenDayForecastProps) {
  const days = weather.daily_forecast;
  const range = computeWeekRange(days);

  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-xl">
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
        <CalendarIcon />
        <span>{days.length}-Day Forecast</span>
      </header>
      <ul className="divide-y divide-white/5">
        {days.length > 0 ? (
          days.map((day, index) => {
            const offsets = barOffsets(day, range);
            return (
              <li
                key={day.date}
                className="grid grid-cols-[5rem_2rem_3rem_1fr_3rem] items-center gap-3 px-4 py-3 text-sm"
              >
                <span className="font-medium text-white/95">
                  {labelForDate(day.date, index)}
                </span>
                <CloudIcon className="h-5 w-5 text-white/80" />
                <span className="tabular-nums text-white/60">
                  {formatTemperature(day.temperature_low_c)}
                </span>
                <div className="relative h-1.5 rounded-full bg-white/10">
                  {offsets && (
                    <div
                      className="absolute top-0 h-1.5 rounded-full bg-gradient-to-r from-sky-300/80 via-amber-300/70 to-orange-300/80"
                      style={{
                        left: `${offsets.left}%`,
                        right: `${offsets.right}%`,
                      }}
                    />
                  )}
                </div>
                <span className="text-right tabular-nums text-white/95">
                  {formatTemperature(day.temperature_high_c)}
                </span>
                {day.forecast && (
                  <span className="col-span-5 -mt-1 truncate text-xs text-white/60">
                    {day.forecast}
                  </span>
                )}
              </li>
            );
          })
        ) : (
          <li className="px-4 py-4 text-sm text-white/55">
            Forecast unavailable.
          </li>
        )}
      </ul>
    </section>
  );
}
