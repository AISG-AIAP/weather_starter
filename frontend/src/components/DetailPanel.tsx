import { useEffect, useState } from 'react';
import type { WeatherSnapshot } from '../types';
import { getEnrichedWeather } from '../api';
import { formatHumidity, formatRainfall, formatWind, getAirQualityLabel, formatTemperature } from './format';
import { CloudRainIcon, CloudWindIcon, SunIcon } from './icons';
import { ConditionCard } from './ConditionCard';
import { MetricsCard } from './MetricsCard';
import { AirQualityCard } from './AirQualityCard';
import { ForecastHourlyCard } from './ForecastHourlyCard';
import { ForecastDailyCard } from './ForecastDailyCard';

interface DetailPanelProps {
  locationId: number;
  currentWeather: WeatherSnapshot | null;
}

export function DetailPanel({ locationId, currentWeather }: DetailPanelProps) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(currentWeather);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getEnrichedWeather(locationId)
      .then(setWeather)
      .catch((err) => {
        console.error('Failed to fetch enriched weather:', err);
        setWeather(currentWeather);
      })
      .finally(() => setLoading(false));
  }, [locationId, currentWeather]);

  if (!weather) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6">
        <p className="text-center text-sm text-white/60">Weather details unavailable</p>
      </div>
    );
  }

  const airQuality = getAirQualityLabel(weather.psi_twenty_four_hourly);

  return (
    <div className="space-y-4">
      {/* Condition Card */}
      <ConditionCard weather={weather} />

      {/* Metrics Card */}
      <MetricsCard weather={weather} />

      {/* Air Quality Card */}
      <AirQualityCard weather={weather} />

      {/* Current Conditions */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-lg font-semibold text-white/90">Detailed Conditions</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-xs text-white/60">Temperature</div>
            <div className="mt-1 text-2xl font-light text-white">{formatTemperature(weather.temperature_c)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <CloudRainIcon className="h-3.5 w-3.5" />
              Humidity
            </div>
            <div className="mt-1 text-xl font-light text-white">{formatHumidity(weather.humidity_percent)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <CloudRainIcon className="h-3.5 w-3.5" />
              Rainfall
            </div>
            <div className="mt-1 text-xl font-light text-white">{formatRainfall(weather.rainfall_mm)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <CloudWindIcon className="h-3.5 w-3.5" />
              Wind
            </div>
            <div className="mt-1 text-sm font-light text-white">
              {formatWind(weather.wind_speed_knots, weather.wind_direction_degrees)}
            </div>
          </div>
        </div>
      </div>

      {/* Air Quality */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-lg font-semibold text-white/90">Air Quality</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-white/60">PSI (Pollutant Standards Index)</div>
            <div className={`mt-2 text-3xl font-light ${airQuality.color}`}>
              {weather.psi_twenty_four_hourly ?? '--'}
            </div>
            <div className={`mt-1 text-sm font-medium ${airQuality.color}`}>{airQuality.label}</div>
          </div>
          <div>
            <div className="text-xs text-white/60">PM2.5</div>
            <div className="mt-2 text-2xl font-light text-white">
              {weather.pm25_one_hourly ? `${Math.round(weather.pm25_one_hourly)}` : '--'}
            </div>
            <div className="mt-1 text-xs text-white/50">μg/m³</div>
          </div>
        </div>
        {weather.air_quality_region && (
          <div className="mt-3 text-xs text-white/60">Region: {weather.air_quality_region}</div>
        )}
      </div>

      {/* UV Index */}
      {weather.uv_index !== null && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white/90">
            <SunIcon className="h-5 w-5" />
            UV Index
          </h2>
          <div className="text-3xl font-light text-yellow-300">{weather.uv_index}</div>
          <div className="mt-2 text-xs text-white/60">
            {weather.uv_index < 3 ? 'Low' : weather.uv_index < 6 ? 'Moderate' : weather.uv_index < 8 ? 'High' : 'Very High'}
          </div>
        </div>
      )}

      {/* Forecast Cards */}
      <ForecastHourlyCard periods={weather.forecast_periods} />
      <ForecastDailyCard dailyForecasts={weather.daily_forecast} />

      {loading && <div className="text-center text-xs text-white/50">Updating weather data…</div>}
    </div>
  );
}
