import L from 'leaflet';
import type { FC } from 'react';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

import type { GeoMapMarker } from './geo-map-section';

type BoundsControllerProps = { markers: GeoMapMarker[] };

/** Re-fits the map bounds whenever markers change. */
export const BoundsController: FC<BoundsControllerProps> = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 });
  }, [map, markers]);

  return null;
};
