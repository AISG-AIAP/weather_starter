import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Location } from '../../types';
import { classifyCondition, type ConditionCategory } from '../conditionCategory';
import { conditionIcon } from './conditionMarkerIcon';
import { MapPinPopup } from './MapPinPopup';

export interface MapViewProps {
  locations: Location[];
  onSelect: (id: number) => void;
}

const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];
const DEFAULT_ZOOM = 11;

function buildMarkerIcon(category: ConditionCategory): L.DivIcon {
  const html = renderToStaticMarkup(
    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-slate-900/90 shadow-lg shadow-black/40">
      {conditionIcon(category, 'h-5 w-5')}
    </div>,
  );
  return L.divIcon({
    html,
    className: 'weather-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function FitBoundsToLocations({ locations }: { locations: Location[] }) {
  const map = useMap();
  const idsKey = locations
    .map((location) => location.id)
    .sort((a, b) => a - b)
    .join(',');

  useEffect(() => {
    if (locations.length === 0) {
      map.setView(SINGAPORE_CENTER, DEFAULT_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(locations.map((location) => [location.latitude, location.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fit only when the set of location IDs changes
  }, [idsKey, map]);

  return null;
}

export function MapView({ locations, onSelect }: MapViewProps) {
  // react-leaflet keeps a popup's content mounted after it closes (Leaflet only detaches
  // the DOM node, it doesn't unmount), so a plain useEffect-on-id in MapPinPopup only fetches
  // once per pin for the component's lifetime. Bumping a per-location key on every popupopen
  // forces a fresh MapPinPopup mount — and therefore a fresh fetch — on every reopen, which
  // matters most for a pin whose first fetch failed.
  const [popupGeneration, setPopupGeneration] = useState<Record<number, number>>({});

  return (
    <MapContainer center={SINGAPORE_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full rounded-2xl">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.latitude, location.longitude]}
          icon={buildMarkerIcon(classifyCondition(location.weather.condition))}
          eventHandlers={{
            click: () => onSelect(location.id),
            popupopen: () =>
              setPopupGeneration((prev) => ({ ...prev, [location.id]: (prev[location.id] ?? 0) + 1 })),
          }}
        >
          <Popup>
            <MapPinPopup key={popupGeneration[location.id] ?? 0} location={location} />
          </Popup>
        </Marker>
      ))}
      <FitBoundsToLocations locations={locations} />
    </MapContainer>
  );
}
