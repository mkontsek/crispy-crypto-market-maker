import { geoLocationSchema } from '@crispy/shared';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceUrl = searchParams.get('url');

  if (!serviceUrl) {
    return NextResponse.json({ error: 'missing url param' }, { status: 400 });
  }

  let geoUrl: string;
  try {
    const parsed = new URL(serviceUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'invalid url' }, { status: 400 });
    }
    geoUrl = new URL('/geo', parsed).toString();
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  try {
    const resp = await fetch(geoUrl, { cache: 'no-store' });
    if (!resp.ok) {
      return NextResponse.json({ error: 'geo lookup failed' }, { status: 502 });
    }
    const data: unknown = await resp.json();
    const parsed = geoLocationSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid geo response' }, { status: 502 });
    }
    return NextResponse.json(parsed.data);
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
