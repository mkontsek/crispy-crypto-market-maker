import L from 'leaflet';

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

export function markerIcon(marker: GeoMapMarker) {
  switch (marker.kind) {
    case 'bot':
      return BOT_ICON;
    case 'exchange':
      return EXCHANGE_ICON;
    case 'hedge-exchange':
      return HEDGE_ICON;
  }
}
