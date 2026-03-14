'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

import type { GeoMapMarker } from './geo-map-section';

// Leaflet's default marker icons break when bundled; provide inline SVG icons.
function makeIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
      fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4" fill="#fff"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

const BOT_ICON = makeIcon('#06b6d4'); // cyan-500
const EXCHANGE_ICON = makeIcon('#f97316'); // orange-500
const HEDGE_ICON = makeIcon('#a855f7'); // purple-500

function markerIcon(marker: GeoMapMarker) {
  switch (marker.kind) {
    case 'bot':
      return BOT_ICON;
    case 'exchange':
      return EXCHANGE_ICON;
    case 'hedge-exchange':
      return HEDGE_ICON;
  }
}

/** Re-fits the map bounds whenever markers change. */
function BoundsController({ markers }: { markers: GeoMapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 });
  }, [map, markers]);

  return null;
}

export default function GeoMapLeaflet({
  markers,
}: {
  markers: GeoMapMarker[];
}) {
  const defaultCenter: [number, number] = [20, 10];
  const defaultZoom = 2;

  return (
    <div className="space-y-3">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={false}
        style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {markers.map((marker) => (
          <Marker
            key={`${marker.kind}-${marker.label}-${marker.lat}-${marker.lng}`}
            position={[marker.lat, marker.lng]}
            icon={markerIcon(marker)}
          >
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}
        {markers.length > 0 && <BoundsController markers={markers} />}
      </MapContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <LegendItem color="#06b6d4" label="Bot" />
        <LegendItem color="#f97316" label="Simulated exchange" />
        <LegendItem color="#a855f7" label="Hedge exchange" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
