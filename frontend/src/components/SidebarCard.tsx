import { useStore } from '../state/store';
import { CloudIcon, CloudRainIcon, CloudWindIcon, HomeIcon, TrashIcon } from './icons';
import { formatTemperature, formatTime, formatHumidity, formatRainfall } from './format';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import type { Location } from '../types';

interface SidebarCardProps {
  location: Location;
  isHome: boolean;
}

export function SidebarCard({ location, isHome }: SidebarCardProps) {
  const { selectedId, select, remove } = useStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const isSelected = selectedId === location.id;
  const observed = formatTime(location.weather.observed_at);
  const area =
    location.weather.area || `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
  const condition = location.weather.condition || '-';
  const temperature = formatTemperature(location.weather.temperature_c);
  const high = formatTemperature(location.weather.forecast_high_c);
  const low = formatTemperature(location.weather.forecast_low_c);

  const onSelect = () => select(location.id);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  const onDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDeleting(true);
    try {
      await remove(location.id);
    } catch (error) {
      console.error('Failed to delete location:', error);
      setIsDeleting(false);
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      aria-pressed={isSelected}
      className={`relative w-full cursor-pointer overflow-hidden rounded-2xl border text-left backdrop-blur-xl transition ${
        isSelected
          ? 'border-white/30 bg-white/20 shadow-lg shadow-black/20'
          : 'border-white/10 bg-white/[0.07] hover:bg-white/[0.12]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pr-12">
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold leading-tight text-white">{area}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/70">
            {isHome ? (
              <>
                <span>My Location</span>
                <span className="text-white/40">·</span>
                <HomeIcon className="h-3 w-3" />
                <span>Home</span>
              </>
            ) : observed ? (
              <span>{observed}</span>
            ) : (
              <span className="text-white/50">Not refreshed</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-3xl font-light tabular-nums text-white/90">{temperature}</div>
      </div>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="absolute right-1.5 top-1 z-10 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Delete location"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
      <div className="border-t border-white/10 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <CloudIcon className="h-3.5 w-3.5 text-white/70" />
          <span className="truncate">{condition}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="text-white/60 tabular-nums">
            H:{high} L:{low}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-white/70">
          {location.weather.humidity_percent !== null && (
            <div className="flex items-center gap-1">
              <CloudRainIcon className="h-3 w-3" />
              <span>{formatHumidity(location.weather.humidity_percent)}</span>
            </div>
          )}
          {location.weather.rainfall_mm !== null && (
            <div className="flex items-center gap-1">
              <CloudRainIcon className="h-3 w-3" />
              <span>{formatRainfall(location.weather.rainfall_mm)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
