import type { DailyForecast } from '../types';
import { CloudIcon, CloudLightningIcon, CloudRainIcon } from './icons';
import { formatTemperature } from './format';

interface ForecastDailyCardProps {
  dailyForecasts: DailyForecast[];
}

export function ForecastDailyCard({ dailyForecasts }: ForecastDailyCardProps) {
  if (!dailyForecasts || dailyForecasts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
        <p className="text-center text-sm text-white/60">4-day forecast unavailable</p>
      </div>
    );
  }

  const getConditionIcon = (forecast: string) => {
    const lower = forecast.toLowerCase();
    if (lower.includes('thundery') || lower.includes('thunderstorm')) {
      return <CloudLightningIcon className="h-7 w-7 text-yellow-300" />;
    }
    if (lower.includes('rain') || lower.includes('showers')) {
      return <CloudRainIcon className="h-7 w-7 text-blue-300" />;
    }
    if (lower.includes('fair') || lower.includes('clear') || lower.includes('sunny')) {
      return <CloudIcon className="h-7 w-7 text-yellow-400" />;
    }
    return <CloudIcon className="h-7 w-7 text-white/70" />;
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getConditionBgColor = (forecast: string) => {
    const lower = forecast.toLowerCase();
    if (lower.includes('thundery') || lower.includes('thunderstorm')) {
      return 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20';
    }
    if (lower.includes('rain') || lower.includes('showers')) {
      return 'from-blue-500/10 to-blue-600/5 border-blue-500/20';
    }
    if (lower.includes('fair') || lower.includes('clear') || lower.includes('sunny')) {
      return 'from-yellow-500/10 to-orange-600/5 border-yellow-500/20';
    }
    return 'from-white/10 to-white/5 border-white/15';
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-xl overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white/90">4-Day Forecast</h2>
        <p className="mt-1 text-xs text-white/60">Temperature ranges and outlook</p>

        {/* Daily Forecast Grid */}
        <div className="mt-4 space-y-3">
          {dailyForecasts.map((day, idx) => (
            <div
              key={idx}
              className={`rounded-lg border bg-gradient-to-r ${getConditionBgColor(day.forecast)} p-4 transition hover:shadow-lg hover:shadow-white/5`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">
                    {formatDate(day.date)}
                  </div>
                  <div className="mt-2 text-xs font-medium text-white/80 line-clamp-2">
                    {day.forecast.trim()}
                  </div>
                </div>

                <div className="mx-4 flex shrink-0">
                  {getConditionIcon(day.forecast)}
                </div>

                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <div className="text-xs text-white/60">H:</div>
                    <div className="text-lg font-light text-white">
                      {formatTemperature(day.temperature_high_c)}
                    </div>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <div className="text-xs text-white/60">L:</div>
                    <div className="text-lg font-light text-white/80">
                      {formatTemperature(day.temperature_low_c)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Temperature Range Bar */}
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-red-400"
                  style={{
                    width: `${Math.max(20, Math.min(100, ((day.temperature_high_c ?? 30) - 20) * 3.33))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
