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
    const browserGeo = await fetchBrowserDashboardGeo();
    if (browserGeo) {
        return enrichDashboardGeoLabel(browserGeo);
    }

    try {
        const resp = await fetch('/api/geo');
        if (!resp.ok) return null;
        return (await resp.json()) as DetectedGeo;
    } catch {
        return null;
    }
}

async function fetchBrowserDashboardGeo(): Promise<DetectedGeo | null> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
        return null;
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                    resolve(null);
                    return;
                }
                resolve({ lat, lng });
            },
            () => resolve(null),
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60_000,
            }
        );
    });
}

async function enrichDashboardGeoLabel(geo: DetectedGeo): Promise<DetectedGeo> {
    try {
        const params = new URLSearchParams({
            lat: geo.lat.toString(),
            lng: geo.lng.toString(),
        });
        const resp = await fetch(`/api/geo?${params.toString()}`);
        if (!resp.ok) {
            return geo;
        }
        const enriched = (await resp.json()) as DetectedGeo;
        return {
            lat: geo.lat,
            lng: geo.lng,
            label: enriched.label ?? geo.label,
        };
    } catch {
        return geo;
    }
}

function firstKnownBotGeo(
    topology: RuntimeTopology,
    autoGeo: Map<string, DetectedGeo>
): DetectedGeo | null {
    for (const bot of topology.bots) {
        const location = bot.location ?? autoGeo.get(bot.id);
        if (location) {
            return location;
        }
    }
    return null;
}

function dashboardLabel(
    explicitDashboardGeo: DetectedGeo | undefined,
    resolvedDashboardGeo: DetectedGeo
): string {
    const formatCoords = (geo: DetectedGeo) =>
        `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}`;

    if (explicitDashboardGeo?.label) {
        return `Dashboard - ${explicitDashboardGeo.label}`;
    }
    if (explicitDashboardGeo) {
        return `Dashboard - ${formatCoords(explicitDashboardGeo)}`;
    }
    return resolvedDashboardGeo.label
        ? `Dashboard - ${resolvedDashboardGeo.label} (inferred)`
        : `Dashboard - ${formatCoords(resolvedDashboardGeo)} (inferred)`;
}

function markerLabel(name: string, location: DetectedGeo): string {
    return location.label ? `${name} - ${location.label}` : name;
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
            label: markerLabel('Simulated Exchange', exchangeLocation),
            kind: 'simulated-exchange',
        });
    }

    for (const bot of topology.bots) {
        const location = bot.location ?? autoGeo.get(bot.id);
        if (location) {
            markers.push({
                lat: location.lat,
                lng: location.lng,
                label: markerLabel(bot.name, location),
                kind: 'bot',
            });
        }
    }

    const explicitDashboardGeo =
        topology.dashboardLocation ?? dashboardGeo ?? undefined;
    const fallbackDashboardGeo =
        topology.exchangeLocation ??
        autoGeo.get('exchange') ??
        firstKnownBotGeo(topology, autoGeo);
    const resolvedDashboardGeo = explicitDashboardGeo ?? fallbackDashboardGeo;
    if (resolvedDashboardGeo) {
        markers.push({
            lat: resolvedDashboardGeo.lat,
            lng: resolvedDashboardGeo.lng,
            label: dashboardLabel(explicitDashboardGeo, resolvedDashboardGeo),
            kind: 'dashboard',
        });
    }

    return markers;
}
