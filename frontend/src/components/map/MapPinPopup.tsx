import { useEffect, useState } from 'react';
import { getEnrichedWeather } from '../../api';
import type { Location, WeatherSnapshot } from '../../types';
import { formatTemperature } from '../format';
import { classifyCondition } from '../conditionCategory';
import { conditionIcon } from './conditionMarkerIcon';

export interface MapPinPopupProps {
  location: Location;
}

type PopupStatus = 'loading' | 'ready' | 'error';

export function MapPinPopup({ location }: MapPinPopupProps) {
  const [status, setStatus] = useState<PopupStatus>('loading');
  const [enriched, setEnriched] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getEnrichedWeather(location.id)
      .then((data) => {
        if (cancelled) return;
        setEnriched(data);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [location.id]);

  const name =
    location.weather.area || `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
  const condition = enriched?.condition ?? location.weather.condition;
  const temperature = status === 'ready' ? (enriched?.temperature_c ?? null) : null;

  return (
    <div className="min-w-[10rem] text-center">
      <div className="text-sm font-semibold">{name}</div>
      <div className="mt-1 flex items-center justify-center gap-2">
        {conditionIcon(classifyCondition(condition), 'h-6 w-6')}
        <span className="text-lg font-light">
          {status === 'loading' ? '…' : formatTemperature(temperature)}
        </span>
      </div>
      {status === 'error' && <div className="mt-1 text-xs text-white/50">Weather unavailable</div>}
    </div>
  );
}
