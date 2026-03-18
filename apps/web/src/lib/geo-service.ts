import type { RuntimeTopology } from '@crispy/shared';

import type { GeoMapMarker } from '@/components/dashboard/geo-map/geo-map-section';

export type DetectedGeo = { lat: number; lng: number; label?: string };

export const EXCHANGE_LOCATIONS: Record<string, { lat: number; lng: number }> =
    {
        Binance: { lat: 1.3521, lng: 103.8198 },
        Bybit: { lat: 25.2048, lng: 55.2708 },
        OKX: { lat: 22.3193, lng: 114.1694 },
    };

export async function fetchGeoForUrl(
    httpUrl: string
): Promise<DetectedGeo | null> {
    try {
        const resp = await fetch(`/api/geo?url=${encodeURIComponent(httpUrl)}`);
        if (!resp.ok) return null;
        return (await resp.json()) as DetectedGeo;
    } catch {
        return null;
    }
}

export async function fetchDashboardGeo(): Promise<DetectedGeo | null> {
    try {
        const resp = await fetch('/api/geo');
        if (!resp.ok) return null;
        return (await resp.json()) as DetectedGeo;
    } catch {
        return null;
    }
}

export function buildMarkers(
    topology: RuntimeTopology,
    autoGeo: Map<string, DetectedGeo>,
    dashboardGeo: DetectedGeo | null
): GeoMapMarker[] {
    const markers: GeoMapMarker[] = [];

    for (const [name, coords] of Object.entries(EXCHANGE_LOCATIONS)) {
        markers.push({
            lat: coords.lat,
            lng: coords.lng,
            label: name,
            kind: 'exchange',
        });
    }

    const exchangeLocation =
        topology.exchangeLocation ?? autoGeo.get('exchange');
    if (exchangeLocation) {
        markers.push({
            lat: exchangeLocation.lat,
            lng: exchangeLocation.lng,
            label: exchangeLocation.label ?? 'Simulated Exchange',
            kind: 'simulated-exchange',
        });
    }

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

    const resolvedDashboardGeo = topology.dashboardLocation ?? dashboardGeo;
    if (resolvedDashboardGeo) {
        markers.push({
            lat: resolvedDashboardGeo.lat,
            lng: resolvedDashboardGeo.lng,
            label: resolvedDashboardGeo.label ?? 'Dashboard',
            kind: 'dashboard',
        });
    }

    return markers;
}
