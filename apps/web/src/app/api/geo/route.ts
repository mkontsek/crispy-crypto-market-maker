import { geoLocationSchema } from '@crispy/shared';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IPWHOIS_URL = 'https://ipwho.is/';

interface IpWhoIsResponse {
    success?: boolean;
    message?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
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

async function geoFromIpwhois(): Promise<Response> {
    try {
        const resp = await fetch(IPWHOIS_URL, { cache: 'no-store' });
        if (!resp.ok) {
            return NextResponse.json(
                { error: 'geo lookup failed' },
                { status: 502 }
            );
        }
        const raw = (await resp.json()) as IpWhoIsResponse;
        if (raw.success === false) {
            return NextResponse.json(
                { error: raw.message ?? 'geo lookup failed' },
                { status: 502 }
            );
        }

        // Build label in the same "{city}, {country}" format as the remote /geo endpoint.
        const parts = [raw.city, raw.country].filter(Boolean);
        const label = parts.length > 0 ? parts.join(', ') : 'Unknown';
        const result = geoLocationSchema.safeParse({
            lat: raw.latitude,
            lng: raw.longitude,
            label,
        });
        if (!result.success) {
            return NextResponse.json(
                { error: 'invalid geo response' },
                { status: 502 }
            );
        }
        return NextResponse.json(result.data);
    } catch {
        return NextResponse.json(
            { error: 'failed to reach geo provider' },
            { status: 502 }
        );
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const serviceUrl = searchParams.get('url');

    // When called without a URL, return the dashboard server's own location.
    if (!serviceUrl) {
        return geoFromIpwhois();
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

    // For localhost URLs, call the geo provider directly from the web server rather than
    // proxying to the service, since the web server shares the same public IP.
    if (isLocalhost(parsed.hostname)) {
        return geoFromIpwhois();
    }

    const geoUrl = new URL('/geo', parsed).toString();
    try {
        const resp = await fetch(geoUrl, { cache: 'no-store' });
        if (!resp.ok) {
            return NextResponse.json(
                { error: 'geo lookup failed' },
                { status: 502 }
            );
        }
        const data: unknown = await resp.json();
        const result = geoLocationSchema.safeParse(data);
        if (!result.success) {
            return NextResponse.json(
                { error: 'invalid geo response' },
                { status: 502 }
            );
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
