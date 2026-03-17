import { geoLocationSchema } from '@crispy/shared';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IPAPI_URL = 'https://ipapi.co/json/';

interface IpapiResponse {
  latitude: number;
  longitude: number;
  city?: string;
  country_name?: string;
}

function isLocalhost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '::1' ||
    h === '[::1]' ||
    h.endsWith('.localhost')
  );
}

async function geoFromIpapi(): Promise<Response> {
  const resp = await fetch(IPAPI_URL, { cache: 'no-store' });
  if (!resp.ok) {
    return NextResponse.json({ error: 'geo lookup failed' }, { status: 502 });
  }
  const raw = (await resp.json()) as IpapiResponse;
  // Build label in the same "{city}, {country_name}" format as the remote /geo endpoint.
  const parts = [raw.city, raw.country_name].filter(Boolean);
  const label = parts.length > 0 ? parts.join(', ') : 'Unknown';
  const result = geoLocationSchema.safeParse({ lat: raw.latitude, lng: raw.longitude, label });
  if (!result.success) {
    return NextResponse.json({ error: 'invalid geo response' }, { status: 502 });
  }
  return NextResponse.json(result.data);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceUrl = searchParams.get('url');

  // When called without a URL, return the dashboard server's own location.
  if (!serviceUrl) {
    return geoFromIpapi();
  }

  let parsed: URL;
  try {
    parsed = new URL(serviceUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'invalid url' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  // For localhost URLs, call ipapi.co directly from the web server rather than
  // proxying to the service, since the web server shares the same public IP.
  if (isLocalhost(parsed.hostname)) {
    return geoFromIpapi();
  }

  const geoUrl = new URL('/geo', parsed).toString();
  try {
    const resp = await fetch(geoUrl, { cache: 'no-store' });
    if (!resp.ok) {
      return NextResponse.json({ error: 'geo lookup failed' }, { status: 502 });
    }
    const data: unknown = await resp.json();
    const result = geoLocationSchema.safeParse(data);
    if (!result.success) {
      return NextResponse.json({ error: 'invalid geo response' }, { status: 502 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'failed to reach service',
        details: error instanceof Error ? error.message : 'unknown',
      },
      { status: 502 }
    );
  }
}
