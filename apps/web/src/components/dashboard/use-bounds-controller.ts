import L from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

import type { GeoMapMarker } from './geo-map-section';

/** Re-fits the map bounds whenever markers change. */
export function BoundsController({ markers }: { markers: GeoMapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 });
  }, [map, markers]);

  return null;
}
