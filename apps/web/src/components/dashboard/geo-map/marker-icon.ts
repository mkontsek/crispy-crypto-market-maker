import L from 'leaflet';

import type { GeoMapMarker } from './geo-map-section';
import type { MarkerPixelOffset } from './marker-overlap';

// Leaflet's default marker icons break when bundled; provide inline SVG icons.
function makeIcon(color: string, offset?: MarkerPixelOffset) {
    const x = offset?.x ?? 0;
    const y = offset?.y ?? 0;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
      fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4" fill="#fff"/>
  </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [24, 36],
        iconAnchor: [12 - x, 36 - y],
        popupAnchor: [x, y - 36],
    });
}

const BOT_ICON = makeIcon('#06b6d4'); // cyan-500
const EXCHANGE_ICON = makeIcon('#f97316'); // orange-500
const SIMULATED_EXCHANGE_ICON = makeIcon('#a855f7'); // purple-500
const DASHBOARD_ICON = makeIcon('#22c55e'); // green-500

function markerColor(marker: GeoMapMarker): string {
    switch (marker.kind) {
        case 'bot':
            return '#06b6d4';
        case 'exchange':
            return '#f97316';
        case 'simulated-exchange':
            return '#a855f7';
        case 'dashboard':
            return '#22c55e';
    }
}

export function markerIcon(marker: GeoMapMarker, offset?: MarkerPixelOffset) {
    if (!offset || (offset.x === 0 && offset.y === 0)) {
        switch (marker.kind) {
            case 'bot':
                return BOT_ICON;
            case 'exchange':
                return EXCHANGE_ICON;
            case 'simulated-exchange':
                return SIMULATED_EXCHANGE_ICON;
            case 'dashboard':
                return DASHBOARD_ICON;
        }
    }

    return makeIcon(markerColor(marker), offset);
}
