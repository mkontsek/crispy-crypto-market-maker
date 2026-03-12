import { pairSchema } from '@crispy/shared';
import { NextResponse } from 'next/server';

import { parseBotIdFromRequest } from '@/server/bot-target';
import { getRelaySnapshot } from '@/server/engine-relay';
import { sanitize } from '@/lib/sanitize';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const target = parseBotIdFromRequest(request);
  if ('error' in target) {
    return target.error;
  }

  const { searchParams } = new URL(request.url);
  const rawPair = searchParams.get('pair');
  const pair = rawPair ? sanitize(rawPair) : null;
  if (pair !== null) {
    const parsedPair = pairSchema.safeParse(pair);
    if (!parsedPair.success) {
      return NextResponse.json(
        {
          error: 'invalid pair query param',
          details: parsedPair.error.flatten(),
        },
        { status: 400 }
      );
    }
  }
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '25');

  const boundedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const boundedPageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : 25;

  const snapshot = getRelaySnapshot(target.botId);
  const filtered = pair
    ? snapshot.fills.filter((fill) => fill.pair === pair)
    : snapshot.fills;

  const start = (boundedPage - 1) * boundedPageSize;
  const items = filtered.slice(start, start + boundedPageSize);

  return NextResponse.json({
    botId: target.botId,
    items,
    total: filtered.length,
    page: boundedPage,
    pageSize: boundedPageSize,
  });
}
