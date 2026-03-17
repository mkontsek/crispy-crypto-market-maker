'use client';

import type { RuntimeTopology } from '@crispy/shared';
import { useQueries, useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface GeoMapMarker {
  lat: number;
  lng: number;
  label: string;
  kind: 'bot' | 'exchange' | 'simulated-exchange' | 'dashboard';
}

type DetectedGeo = { lat: number; lng: number; label?: string };

// Hardcoded headquarters coordinates for the real hedging exchanges.
const EXCHANGE_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  Binance: { lat: 1.3521, lng: 103.8198 },  // Singapore
  Bybit: { lat: 25.2048, lng: 55.2708 },    // Dubai
  OKX: { lat: 22.3193, lng: 114.1694 },     // Hong Kong
};

async function fetchGeoForUrl(httpUrl: string): Promise<DetectedGeo | null> {
  try {
    const resp = await fetch(`/api/geo?url=${encodeURIComponent(httpUrl)}`);
    if (!resp.ok) return null;
    return (await resp.json()) as DetectedGeo;
  } catch {
    return null;
  }
}

async function fetchDashboardGeo(): Promise<DetectedGeo | null> {
  try {
    const resp = await fetch('/api/geo');
    if (!resp.ok) return null;
    return (await resp.json()) as DetectedGeo;
  } catch {
    return null;
  }
}

function buildMarkers(
  topology: RuntimeTopology,
  autoGeo: Map<string, DetectedGeo>,
  dashboardGeo: DetectedGeo | null,
): GeoMapMarker[] {
  const markers: GeoMapMarker[] = [];

  // Dashboard marker — the web server's own detected location
  if (dashboardGeo) {
    markers.push({
      lat: dashboardGeo.lat,
      lng: dashboardGeo.lng,
      label: dashboardGeo.label ?? 'Dashboard',
      kind: 'dashboard',
    });
  }

  // Bot markers — auto-detected via each bot's /geo endpoint
  for (const bot of topology.bots) {
    const location = autoGeo.get(bot.id);
    if (location) {
      markers.push({
        lat: location.lat,
        lng: location.lng,
        label: location.label ?? bot.name,
        kind: 'bot',
      });
    }
  }

  // Simulated-exchange marker — auto-detected via the exchange service's /geo endpoint
  const exchangeLocation = autoGeo.get('exchange');
  if (exchangeLocation) {
    markers.push({
      lat: exchangeLocation.lat,
      lng: exchangeLocation.lng,
      label: exchangeLocation.label ?? 'Simulated Exchange',
      kind: 'simulated-exchange',
    });
  }

  // Real hedging exchange markers — always shown at hardcoded coords
  for (const [name, coords] of Object.entries(EXCHANGE_LOCATIONS)) {
    markers.push({
      lat: coords.lat,
      lng: coords.lng,
      label: name,
      kind: 'exchange',
    });
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

  const dashboardGeoResult = useQuery({
    queryKey: ['geo', 'dashboard'],
    queryFn: fetchDashboardGeo,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

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

  const markers = buildMarkers(topology, autoGeo, dashboardGeoResult.data ?? null);

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
