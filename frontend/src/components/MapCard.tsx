import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { useStore } from '../state/store';
import { CloudIcon, SunIcon, CloseIcon, LocationIcon } from './icons';

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatTemperature(value: number | null | undefined): string {
  return isFiniteNumber(value) ? Math.round(value).toString() : '--';
}

function getWeatherIcon(condition: string | null) {
  const isSunny = condition?.toLowerCase().includes('fair') || condition?.toLowerCase().includes('sunny');
  return isSunny ? <SunIcon className="h-3.5 w-3.5" /> : <CloudIcon className="h-3.5 w-3.5" />;
}

// Custom hook to fit bounds of all markers when map loads
function MapBoundsUpdater({ locations }: { locations: any[] }) {
  const map = useMap();
  
  useMemo(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
    // Adding some padding so pins aren't right on the edge
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
  }, [locations, map]);

  return null;
}

export function MapCard() {
  const { locations } = useStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Use a default center if no locations exist
  const center: [number, number] = locations.length > 0 
    ? [locations[0].latitude, locations[0].longitude] 
    : [1.3521, 103.8198]; // Singapore center

  const mapContent = (
    <>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {locations.map((loc) => {
        const temp = formatTemperature(loc.weather?.temperature_c);
        const iconHtml = renderToString(
          <div className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-md border border-white/20 whitespace-nowrap">
            {getWeatherIcon(loc.weather?.condition)}
            <span>{temp}&deg;</span>
          </div>
        );

        const customIcon = L.divIcon({
          className: 'weather-pin-icon',
          html: iconHtml,
          iconSize: [0, 0], // Let content dictate size
          iconAnchor: [30, 15], // Approximate center of the pill
        });

        return (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={customIcon}
          />
        );
      })}
      <MapBoundsUpdater locations={locations} />
    </>
  );

  // If fullscreen, render as a fixed overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
        <header className="absolute top-0 z-[60] flex w-full items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80 pointer-events-auto">
             <LocationIcon className="h-3 w-3" />
             <span>Map Overview</span>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="pointer-events-auto rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 backdrop-blur-md transition-colors"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 h-full w-full">
          <MapContainer
            center={center}
            zoom={11}
            zoomControl={false}
            className="h-full w-full outline-none"
          >
            {mapContent}
          </MapContainer>
        </div>
      </div>
    );
  }

  // Card view
  return (
    <section 
      className="group relative flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-xl cursor-pointer hover:bg-white/[0.12] transition-colors overflow-hidden"
      onClick={() => setIsFullscreen(true)}
    >
      <header className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
        <div className="flex items-center gap-1.5">
          <LocationIcon className="h-3.5 w-3.5" />
          <span>Map Overview</span>
        </div>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Expand</span>
      </header>
      
      <div className="relative h-48 w-full rounded-xl overflow-hidden shadow-inner border border-white/10 pointer-events-none">
        <MapContainer
          center={center}
          zoom={10}
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          className="h-full w-full"
        >
          {mapContent}
        </MapContainer>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
