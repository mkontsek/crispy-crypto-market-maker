'use client';

import type { RuntimeTopology } from '@crispy/shared';
import { EXCHANGES } from '@crispy/shared';
import { useQueries } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/** Well-known approximate server locations for recognised hedge exchanges. */
const KNOWN_EXCHANGE_LOCATIONS: Record<
  string,
  { lat: number; lng: number; label: string }
> = {
  Binance: { lat: 35.6762, lng: 139.6503, label: 'Binance (Tokyo)' },
  Bybit: { lat: 1.3521, lng: 103.8198, label: 'Bybit (Singapore)' },
  OKX: { lat: 22.3193, lng: 114.1694, label: 'OKX (Hong Kong)' },
};

export interface GeoMapMarker {
  lat: number;
  lng: number;
  label: string;
  kind: 'bot' | 'exchange' | 'hedge-exchange';
}

type DetectedGeo = { lat: number; lng: number; label?: string };

async function fetchGeoForUrl(httpUrl: string): Promise<DetectedGeo | null> {
  try {
    const resp = await fetch(`/api/geo?url=${encodeURIComponent(httpUrl)}`);
    if (!resp.ok) return null;
    return (await resp.json()) as DetectedGeo;
  } catch {
    return null;
  }
}

function buildMarkers(
  topology: RuntimeTopology,
  autoGeo: Map<string, DetectedGeo>,
): GeoMapMarker[] {
  const markers: GeoMapMarker[] = [];

  // Bot markers — use topology location if set, otherwise auto-detected
  for (const bot of topology.bots) {
    const location = bot.location ?? autoGeo.get(bot.id);
    if (location) {
      markers.push({
        lat: location.lat,
        lng: location.lng,
        label: location.label ?? bot.name,
        kind: 'bot',
      });
    }
  }

  // Simulated-exchange marker — use topology location if set, otherwise auto-detected
  const exchangeLocation = topology.exchangeLocation ?? autoGeo.get('exchange');
  if (exchangeLocation) {
    markers.push({
      lat: exchangeLocation.lat,
      lng: exchangeLocation.lng,
      label: exchangeLocation.label ?? 'Exchange',
      kind: 'exchange',
    });
  }

  // Real (hedge) exchange markers — always shown based on well-known locations
  for (const exchange of EXCHANGES) {
    const loc = KNOWN_EXCHANGE_LOCATIONS[exchange];
    if (loc) {
      markers.push({
        lat: loc.lat,
        lng: loc.lng,
        label: loc.label,
        kind: 'hedge-exchange',
      });
    }
  }

  return markers;
}

const LeafletMap = dynamic(() => import('./geo-map-leaflet'), { ssr: false });

export function GeoMapSection({ topology }: { topology: RuntimeTopology }) {
  const botEntries = topology.bots.map((bot) => ({
    id: bot.id,
    url: bot.httpUrl,
    name: bot.name,
  }));
  const allEntries = [
    ...botEntries,
    { id: 'exchange', url: topology.exchangeHttpUrl, name: 'Exchange' },
  ];

  const geoResults = useQueries({
    queries: allEntries.map((entry) => ({
      queryKey: ['geo', entry.url],
      queryFn: () => fetchGeoForUrl(entry.url),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  const autoGeo = new Map<string, DetectedGeo>();
  allEntries.forEach((entry, idx) => {
    const data = geoResults[idx]?.data;
    if (data) {
      autoGeo.set(entry.id, data);
    }
  });

  const markers = buildMarkers(topology, autoGeo);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infrastructure Map</CardTitle>
      </CardHeader>
      <CardContent>
        <LeafletMap markers={markers} />
      </CardContent>
    </Card>
  );
}
