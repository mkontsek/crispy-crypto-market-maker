import { NextResponse } from 'next/server';

import { getRelaySnapshot } from '@/server/engine-relay';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pair = searchParams.get('pair');
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '25');

  const boundedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const boundedPageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : 25;

  const snapshot = getRelaySnapshot();
  const filtered = pair
    ? snapshot.fills.filter((fill) => fill.pair === pair)
    : snapshot.fills;

  const start = (boundedPage - 1) * boundedPageSize;
  const items = filtered.slice(start, start + boundedPageSize);

  return NextResponse.json({
    items,
    total: filtered.length,
    page: boundedPage,
    pageSize: boundedPageSize,
  });
}
