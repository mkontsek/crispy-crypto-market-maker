import type { RuntimeTopology } from '@crispy/shared';

import type { GeoMapMarker } from '@/components/dashboard/geo-map-section';

export type DetectedGeo = { lat: number; lng: number; label?: string };

interface IpapiClientResponse {
  latitude?: number;
  longitude?: number;
  city?: string;
  country_name?: string;
}

export const EXCHANGE_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  Binance: { lat: 1.3521, lng: 103.8198 },
  Bybit: { lat: 25.2048, lng: 55.2708 },
  OKX: { lat: 22.3193, lng: 114.1694 },
};

export function isLocalhostHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '::1' ||
    h === '[::1]' ||
    h.endsWith('.localhost')
  );
}

export async function geoFromIpapiDirect(fallbackLabel: string): Promise<DetectedGeo | null> {
  try {
    const resp = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (!resp.ok) return null;
    const raw = (await resp.json()) as IpapiClientResponse;
    if (typeof raw.latitude !== 'number' || typeof raw.longitude !== 'number') return null;
    const parts = [raw.city, raw.country_name].filter(Boolean);
    return { lat: raw.latitude, lng: raw.longitude, label: parts.join(', ') || fallbackLabel };
  } catch {
    return null;
  }
}

export async function fetchGeoForUrl(httpUrl: string): Promise<DetectedGeo | null> {
  try {
    const resp = await fetch(`/api/geo?url=${encodeURIComponent(httpUrl)}`);
    if (resp.ok) return (await resp.json()) as DetectedGeo;
  } catch { /* fall through to browser-side fallback */ }

  try {
    const parsed = new URL(httpUrl);
    if (isLocalhostHostname(parsed.hostname)) {
      return geoFromIpapiDirect('Bot');
    }
  } catch { /* ignore malformed URLs */ }

  return null;
}

export async function fetchDashboardGeo(): Promise<DetectedGeo | null> {
  try {
    const resp = await fetch('/api/geo');
    if (resp.ok) return (await resp.json()) as DetectedGeo;
  } catch { /* fall through to browser-side fallback */ }

  return geoFromIpapiDirect('Dashboard');
}

export function buildMarkers(
  topology: RuntimeTopology,
  autoGeo: Map<string, DetectedGeo>,
  dashboardGeo: DetectedGeo | null,
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

  const exchangeLocation = autoGeo.get('exchange');
  if (exchangeLocation) {
    markers.push({
      lat: exchangeLocation.lat,
      lng: exchangeLocation.lng,
      label: exchangeLocation.label ?? 'Simulated Exchange',
      kind: 'simulated-exchange',
    });
  }

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

  if (dashboardGeo) {
    markers.push({
      lat: dashboardGeo.lat,
      lng: dashboardGeo.lng,
      label: dashboardGeo.label ?? 'Dashboard',
      kind: 'dashboard',
    });
  }

  return markers;
}
