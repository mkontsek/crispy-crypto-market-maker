'use client';

import type { RuntimeTopology } from '@crispy/shared';
import { EXCHANGES } from '@crispy/shared';
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

function buildMarkers(topology: RuntimeTopology): GeoMapMarker[] {
  const markers: GeoMapMarker[] = [];

  // Bot markers
  for (const bot of topology.bots) {
    if (bot.location) {
      markers.push({
        lat: bot.location.lat,
        lng: bot.location.lng,
        label: bot.location.label ?? bot.name,
        kind: 'bot',
      });
    }
  }

  // Simulated-exchange marker
  if (topology.exchangeLocation) {
    markers.push({
      lat: topology.exchangeLocation.lat,
      lng: topology.exchangeLocation.lng,
      label: topology.exchangeLocation.label ?? 'Exchange',
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
  const markers = buildMarkers(topology);

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
