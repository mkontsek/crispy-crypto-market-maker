'use client';

import type { FC } from 'react';
import type { RuntimeTopology } from '@crispy/shared';
import dynamic from 'next/dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildMarkers } from '@/lib/geo-service';
import type { DetectedGeo } from '@/lib/geo-service';

import { useDashboardGeoQuery } from './use-dashboard-geo-query';
import { useServiceGeoQueries } from './use-service-geo-queries';

export interface GeoMapMarker {
    lat: number;
    lng: number;
    label: string;
    kind: 'bot' | 'exchange' | 'simulated-exchange' | 'dashboard';
}

const LeafletMap = dynamic(() => import('./geo-map-leaflet').then((m) => m.GeoMapLeaflet), { ssr: false });

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

    // Only fetch geo for services that don't have a static location in topology
    const entriesNeedingGeo = allEntries.filter((entry) => {
        if (entry.id === 'exchange') return !topology.exchangeLocation;
        const bot = topology.bots.find((b) => b.id === entry.id);
        return !bot?.location;
    });

    const dashboardGeoResult = useDashboardGeoQuery(!topology.dashboardLocation);
    const geoResults = useServiceGeoQueries(entriesNeedingGeo);

    const autoGeo = new Map<string, DetectedGeo>();
    entriesNeedingGeo.forEach((entry, idx) => {
        const data = geoResults[idx]?.data;
        if (data) {
            autoGeo.set(entry.id, data);
        }
    });

    const markers = buildMarkers(
        topology,
        autoGeo,
        dashboardGeoResult.data ?? null
    );

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
