import type { WeatherSnapshot } from '../types';
import { GaugeIcon } from './icons';

interface AirQualityCardProps {
  weather: WeatherSnapshot | null;
}

interface AirQualityStatus {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  health: string;
}

export function AirQualityCard({ weather }: AirQualityCardProps) {
  if (!weather) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
        <p className="text-center text-sm text-white/60">Air quality data unavailable</p>
      </div>
    );
  }

  const getPSIStatus = (psi: number | null | undefined): AirQualityStatus => {
    if (!psi) return { label: 'No Data', color: 'text-white/50', bgColor: 'bg-white/5', borderColor: 'border-white/20', health: '--' };
    if (psi <= 50) return { label: 'Good', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', health: 'Good air quality' };
    if (psi <= 100) return { label: 'Moderate', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', health: 'Acceptable, but sensitive groups at risk' };
    if (psi <= 200) return { label: 'Unhealthy', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', health: 'General public at risk' };
    if (psi <= 300) return { label: 'Very Unhealthy', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', health: 'Health warnings issued' };
    return { label: 'Hazardous', color: 'text-red-600', bgColor: 'bg-red-600/10', borderColor: 'border-red-600/30', health: 'Avoid outdoor activities' };
  };

  const getPM25Status = (pm25: number | null | undefined): AirQualityStatus => {
    if (!pm25) return { label: 'No Data', color: 'text-white/50', bgColor: 'bg-white/5', borderColor: 'border-white/20', health: '--' };
    if (pm25 <= 12) return { label: 'Good', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', health: 'Low concentration' };
    if (pm25 <= 35.4) return { label: 'Moderate', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', health: 'Acceptable air quality' };
    if (pm25 <= 55.4) return { label: 'Unhealthy for Groups', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', health: 'Sensitive groups at risk' };
    if (pm25 <= 150.4) return { label: 'Unhealthy', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', health: 'Everyone at risk' };
    return { label: 'Hazardous', color: 'text-red-600', bgColor: 'bg-red-600/10', borderColor: 'border-red-600/30', health: 'Serious health effects' };
  };

  const psiStatus = getPSIStatus(weather.psi_twenty_four_hourly);
  const pm25Status = getPM25Status(weather.pm25_one_hourly);

  const psiValue = weather.psi_twenty_four_hourly ?? 0;
  const pm25Value = weather.pm25_one_hourly ?? 0;

  const psiProgress = Math.min((psiValue / 300) * 100, 100);
  const pm25Progress = Math.min((pm25Value / 150) * 100, 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <GaugeIcon className="h-5 w-5 text-white/70" />
          <h2 className="text-lg font-semibold text-white/90">Air Quality</h2>
        </div>

        {weather.air_quality_region && (
          <div className="mt-2 text-xs text-white/60">
            Region: <span className="font-medium text-white/80">{weather.air_quality_region}</span>
          </div>
        )}

        {/* PSI Card */}
        <div className={`mt-4 rounded-lg border ${psiStatus.borderColor} ${psiStatus.bgColor} p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white/70">PSI (Pollutant Standards Index)</div>
              <div className={`mt-2 text-3xl font-light ${psiStatus.color}`}>
                {weather.psi_twenty_four_hourly !== null ? Math.round(weather.psi_twenty_four_hourly) : '--'}
              </div>
              <div className={`mt-1 text-xs font-medium ${psiStatus.color}`}>{psiStatus.label}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 mb-2">Health Impact</div>
              <div className="text-xs font-medium text-white/80">{psiStatus.health}</div>
            </div>
          </div>

          {/* PSI Progress Bar */}
          <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                psiProgress <= 33
                  ? 'bg-green-400'
                  : psiProgress <= 66
                    ? 'bg-yellow-400'
                    : psiProgress <= 85
                      ? 'bg-orange-400'
                      : 'bg-red-500'
              }`}
              style={{ width: `${psiProgress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/50">
            <span>0</span>
            <span>150</span>
            <span>300+</span>
          </div>
        </div>

        {/* PM2.5 Card */}
        <div className={`mt-4 rounded-lg border ${pm25Status.borderColor} ${pm25Status.bgColor} p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white/70">PM2.5 (Fine Particulate Matter)</div>
              <div className={`mt-2 text-3xl font-light ${pm25Status.color}`}>
                {weather.pm25_one_hourly !== null ? Math.round(weather.pm25_one_hourly) : '--'}
              </div>
              <div className="mt-0.5 text-xs text-white/60">μg/m³</div>
              <div className={`mt-1 text-xs font-medium ${pm25Status.color}`}>{pm25Status.label}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 mb-2">Health Impact</div>
              <div className="text-xs font-medium text-white/80">{pm25Status.health}</div>
            </div>
          </div>

          {/* PM2.5 Progress Bar */}
          <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pm25Progress <= 20
                  ? 'bg-green-400'
                  : pm25Progress <= 40
                    ? 'bg-yellow-400'
                    : pm25Progress <= 70
                      ? 'bg-orange-400'
                      : 'bg-red-500'
              }`}
              style={{ width: `${pm25Progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/50">
            <span>0</span>
            <span>75</span>
            <span>150+</span>
          </div>
        </div>
      </div>

      {/* Health Recommendations */}
      <div className="border-t border-white/10 px-6 py-4">
        <div className="text-xs font-medium text-white/70 mb-2">Health Recommendations</div>
        <div className="space-y-1 text-xs text-white/60">
          {psiValue > 100 || pm25Value > 35.4 ? (
            <>
              <div>• Reduce outdoor activities, especially exercise</div>
              <div>• Use N95 masks if spending time outdoors</div>
              <div>• Keep windows closed and use air filtration</div>
            </>
          ) : psiValue > 50 || pm25Value > 12 ? (
            <>
              <div>• Limit prolonged outdoor activities</div>
              <div>• Sensitive groups should reduce outdoor time</div>
            </>
          ) : (
            <>
              <div>• Good conditions for outdoor activities</div>
              <div>• No air quality restrictions</div>
            </>
          )}
        </div>
      </div>

      {/* Data Timestamp */}
      <div className="border-t border-white/10 px-6 py-3 text-xs text-white/50">
        24-hour average readings from regional monitoring stations
      </div>
    </div>
  );
}
