import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { divIcon, latLngBounds } from 'leaflet';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { logInteraction } from '../api';
import type { Location } from '../types';
import { CloseIcon, ExpandIcon, MapPinIcon } from './icons';
import { formatTemperature } from './format';

const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];

interface WeatherMapProps {
  locations: Location[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  mode: 'embedded' | 'fullscreen';
}

interface WeatherMapCardProps {
  locations: Location[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function locationName(location: Location): string {
  return (
    location.weather.area || `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`
  );
}

function FitLocations({ locations }: Pick<WeatherMapProps, 'locations'>) {
  const map = useMap();
  const locationKey = locations
    .map((location) => `${location.id}:${location.latitude}:${location.longitude}`)
    .join('|');

  useEffect(() => {
    map.invalidateSize({ pan: false });

    const positions = locationKey
      ? locationKey.split('|').map((entry) => {
          const [, latitude, longitude] = entry.split(':');
          return [Number(latitude), Number(longitude)] as [number, number];
        })
      : [];

    if (positions.length === 0) {
      map.setView(SINGAPORE_CENTER, 11, { animate: false });
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 13, { animate: false });
      return;
    }

    const bounds = latLngBounds(positions);
    map.fitBounds(bounds, { animate: false, maxZoom: 13, padding: [52, 52] });
  }, [locationKey, map]);

  return null;
}

function pinIcon(isSelected: boolean) {
  return divIcon({
    className: 'weather-map-pin-wrapper',
    html: `<span class="weather-map-pin${isSelected ? ' weather-map-pin--selected' : ''}"><span></span></span>`,
    iconAnchor: [14, 31],
    iconSize: [28, 34],
    tooltipAnchor: [0, -31],
  });
}

export function WeatherMap({ locations, selectedId, onSelect, mode }: WeatherMapProps) {
  const icons = useMemo(
    () => new Map(locations.map((location) => [location.id, pinIcon(location.id === selectedId)])),
    [locations, selectedId],
  );

  const selectLocation = useCallback(
    (location: Location) => {
      onSelect(location.id);
      logInteraction('map_location_selected', { locationId: location.id, mapMode: mode });
    },
    [mode, onSelect],
  );

  return (
    <MapContainer
      center={SINGAPORE_CENTER}
      zoom={11}
      minZoom={10}
      maxZoom={18}
      scrollWheelZoom={mode === 'fullscreen'}
      zoomControl={mode === 'fullscreen'}
      className={`weather-map weather-map--${mode}`}
      aria-label={`Map showing ${locations.length} saved weather ${locations.length === 1 ? 'location' : 'locations'}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitLocations locations={locations} />
      {locations.map((location) => {
        const isSelected = location.id === selectedId;
        const name = locationName(location);
        const temperature = formatTemperature(location.weather.temperature_c);
        const select = () => selectLocation(location);

        return (
          <Marker
            key={`${location.id}-${isSelected ? 'selected' : 'default'}`}
            position={[location.latitude, location.longitude]}
            icon={icons.get(location.id)}
            keyboard
            title={`${name}, ${temperature}`}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{ click: select }}
          >
            <Tooltip
              permanent
              interactive
              direction="top"
              opacity={1}
              className={`weather-map-tooltip${isSelected ? ' weather-map-tooltip--selected' : ''}`}
              eventHandlers={{ click: select }}
            >
              <span className="weather-map-label">
                <span className="weather-map-label__area">{name}</span>
                <span className="weather-map-label__temperature">{temperature}</span>
              </span>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export function WeatherMapCard({ locations, selectedId, onSelect }: WeatherMapCardProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogTitleId = useId();

  const expand = () => {
    setIsFullscreen(true);
    logInteraction('map_expanded', { locationCount: locations.length });
  };

  const close = useCallback((method: 'button' | 'escape') => {
    setIsFullscreen(false);
    logInteraction('map_closed', { method });
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    const expandButton = expandButtonRef.current;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close('escape');
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      expandButton?.focus();
    };
  }, [close, isFullscreen]);

  const fullscreenMap = isFullscreen
    ? createPortal(
        <div
          className="weather-map-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
        >
          <WeatherMap
            locations={locations}
            selectedId={selectedId}
            onSelect={onSelect}
            mode="fullscreen"
          />
          <div className="weather-map-overlay__header">
            <div>
              <p className="weather-map-overlay__eyebrow">Weather Map</p>
              <h2 id={dialogTitleId} className="weather-map-overlay__title">
                Saved Locations
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => close('button')}
              aria-label="Close full-screen map"
              className="weather-map-overlay__close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-xl">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
          <MapPinIcon className="h-3.5 w-3.5" />
          <span>Weather Map</span>
          <span className="font-medium normal-case tracking-normal text-white/40">
            {locations.length} {locations.length === 1 ? 'location' : 'locations'}
          </span>
        </div>
        <button
          ref={expandButtonRef}
          type="button"
          onClick={expand}
          aria-label="Open full-screen weather map"
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-white/85 hover:bg-white/[0.15]"
        >
          <ExpandIcon className="h-3.5 w-3.5" />
          <span>Expand</span>
        </button>
      </header>
      <div className="h-72 bg-slate-200 sm:h-80">
        <WeatherMap
          locations={locations}
          selectedId={selectedId}
          onSelect={onSelect}
          mode="embedded"
        />
      </div>
      {fullscreenMap}
    </section>
  );
}
