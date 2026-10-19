import type { ForecastPeriod } from '../types';
import { classifyCondition } from './conditionCategory';
import { CloudIcon, CloudLightningIcon, CloudRainIcon } from './icons';

interface ForecastHourlyCardProps {
  periods: ForecastPeriod[];
}

export function ForecastHourlyCard({ periods }: ForecastHourlyCardProps) {
  if (!periods || periods.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
        <p className="text-center text-sm text-white/60">24-hour forecast unavailable</p>
      </div>
    );
  }

  const getConditionIcon = (forecast: string) => {
    switch (classifyCondition(forecast)) {
      case 'thunderstorm':
        return <CloudLightningIcon className="h-6 w-6 text-yellow-300" />;
      case 'rain':
        return <CloudRainIcon className="h-6 w-6 text-blue-300" />;
      default:
        return <CloudIcon className="h-6 w-6 text-white/70" />;
    }
  };

  const getConditionBgColor = (forecast: string) => {
    switch (classifyCondition(forecast)) {
      case 'thunderstorm':
        return 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/15';
      case 'rain':
        return 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15';
      default:
        return 'bg-white/5 border-white/15 hover:bg-white/[0.08]';
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-xl overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white/90">24-Hour Forecast</h2>
        <p className="mt-1 text-xs text-white/60">Next 24 hours in 2-hour periods</p>

        {/* Scrollable Timeline */}
        <div className="mt-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2">
            {periods.map((period, idx) => (
              <div
                key={idx}
                className={`flex-shrink-0 rounded-lg border ${getConditionBgColor(period.forecast)} p-4 w-32 transition`}
              >
                <div className="text-xs font-medium text-white/80 truncate">{period.label}</div>
                <div className="mt-2 flex justify-center">
                  {getConditionIcon(period.forecast)}
                </div>
                <div className="mt-2 text-center text-xs font-medium text-white/90 line-clamp-2">
                  {period.forecast}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
