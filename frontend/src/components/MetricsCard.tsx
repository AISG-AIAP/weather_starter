import type { WeatherSnapshot } from '../types';
import { CloudRainIcon, CloudWindIcon, DropletIcon, GaugeIcon, SunIcon, ThermometerIcon } from './icons';
import { formatHumidity, formatRainfall, formatWind, formatTemperature } from './format';

interface MetricsCardProps {
  weather: WeatherSnapshot | null;
}

interface MetricItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  unit?: string;
}

export function MetricsCard({ weather }: MetricsCardProps) {
  if (!weather) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
        <p className="text-center text-sm text-white/60">Metrics data unavailable</p>
      </div>
    );
  }

  const metrics: MetricItem[] = [
    {
      label: 'Temperature',
      value: formatTemperature(weather.temperature_c),
      icon: <ThermometerIcon className="h-5 w-5 text-red-400" />,
    },
    {
      label: 'Humidity',
      value: formatHumidity(weather.humidity_percent),
      icon: <DropletIcon className="h-5 w-5 text-blue-400" />,
    },
    {
      label: 'Rainfall',
      value: weather.rainfall_mm !== null ? weather.rainfall_mm.toFixed(1) : '--',
      unit: 'mm',
      icon: <CloudRainIcon className="h-5 w-5 text-cyan-400" />,
    },
    {
      label: 'Wind',
      value: formatWind(weather.wind_speed_knots, weather.wind_direction_degrees),
      icon: <CloudWindIcon className="h-5 w-5 text-purple-400" />,
    },
    {
      label: 'UV Index',
      value: weather.uv_index !== null ? String(Math.round(weather.uv_index)) : '--',
      icon: <SunIcon className="h-5 w-5 text-yellow-400" />,
    },
    {
      label: 'Pressure',
      value: weather.psi_twenty_four_hourly !== null ? String(Math.round(weather.psi_twenty_four_hourly)) : '--',
      unit: 'PSI',
      icon: <GaugeIcon className="h-5 w-5 text-orange-400" />,
    },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-xl overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white/90">Weather Metrics</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-white/10 bg-white/[0.05] p-4 transition hover:bg-white/[0.1]"
            >
              <div className="flex items-center gap-2">
                {metric.icon}
                <span className="text-xs font-medium text-white/70">{metric.label}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <div className="text-xl font-light text-white">{metric.value}</div>
                {metric.unit && <div className="text-xs text-white/60">{metric.unit}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wind Direction Indicator */}
      {weather.wind_direction_degrees !== null && (
        <div className="border-t border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Wind Direction</span>
            <div className="flex items-center gap-3">
              <div className="text-sm text-white/90">{Math.round(weather.wind_direction_degrees)}°</div>
              <div
                className="h-10 w-10 rounded-full border-2 border-white/30 flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                }}
              >
                <div
                  className="h-1 w-6 bg-white/80 rounded-full origin-left"
                  style={{
                    transform: `rotate(${weather.wind_direction_degrees}deg)`,
                    transformOrigin: '100% 50%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Info */}
      <div className="border-t border-white/10 px-6 py-3 text-xs text-white/50">
        Station-based readings from nearest weather station
      </div>
    </div>
  );
}
