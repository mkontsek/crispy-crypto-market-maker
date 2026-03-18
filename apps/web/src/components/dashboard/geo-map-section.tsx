'use client';

import type { FC } from 'react';
import type { RuntimeTopology } from '@crispy/shared';
import { useQueries, useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildMarkers, fetchDashboardGeo, fetchGeoForUrl } from '@/lib/geo-service';
import type { DetectedGeo } from '@/lib/geo-service';

export interface GeoMapMarker {
  lat: number;
  lng: number;
  label: string;
  kind: 'bot' | 'exchange' | 'simulated-exchange' | 'dashboard';
}

const LeafletMap = dynamic(() => import('./geo-map-leaflet'), { ssr: false });

type GeoMapSectionProps = { topology: RuntimeTopology };

export const GeoMapSection: FC<GeoMapSectionProps> = ({ topology }) => {
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
};
