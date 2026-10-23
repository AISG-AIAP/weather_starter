import type { WeatherSnapshot } from '../types';
import { classifyCondition } from './conditionCategory';
import { CloudCheckIcon, CloudLightningIcon, CloudRainCheckIcon, CloudSnowIcon } from './icons';

interface ConditionCardProps {
  weather: WeatherSnapshot | null;
}

export function ConditionCard({ weather }: ConditionCardProps) {
  if (!weather) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
        <p className="text-center text-sm text-white/60">Condition data unavailable</p>
      </div>
    );
  }

  const condition = weather.condition || 'Unknown';
  const category = classifyCondition(condition);

  const getConditionIcon = () => {
    switch (category) {
      case 'thunderstorm':
        return <CloudLightningIcon className="h-8 w-8 text-yellow-300" />;
      case 'rain':
        return <CloudRainCheckIcon className="h-8 w-8 text-blue-300" />;
      case 'snow':
        return <CloudSnowIcon className="h-8 w-8 text-cyan-200" />;
      case 'clear':
        return <CloudCheckIcon className="h-8 w-8 text-yellow-400" />;
      default:
        return <CloudCheckIcon className="h-8 w-8 text-white/70" />;
    }
  };

  const getConditionColor = () => {
    switch (category) {
      case 'thunderstorm':
        return 'from-yellow-500/20 to-yellow-600/10';
      case 'rain':
        return 'from-blue-500/20 to-blue-600/10';
      case 'snow':
        return 'from-cyan-500/20 to-cyan-600/10';
      case 'clear':
        return 'from-yellow-500/20 to-orange-600/10';
      default:
        return 'from-white/10 to-white/5';
    }
  };

  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${getConditionColor()} p-6 backdrop-blur-xl`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-white/70">Current Condition</h2>
          <div className="mt-3 text-2xl font-light leading-tight text-white">{condition}</div>

          {weather.area && (
            <div className="mt-2 text-sm text-white/60">
              {weather.area}
            </div>
          )}

          {weather.valid_period_text && (
            <div className="mt-2 text-xs text-white/50">
              Valid: {weather.valid_period_text}
            </div>
          )}
        </div>
        <div className="ml-4 shrink-0">{getConditionIcon()}</div>
      </div>

      {weather.observed_at && (
        <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/50">
          Updated {new Date(weather.observed_at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
}
