import { prisma } from '@crispy/db';
import { NextResponse } from 'next/server';

import { sanitize } from '@/lib/sanitize';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawBotId = searchParams.get('botId');
  const botId = rawBotId ? sanitize(rawBotId) : null;

  const limit = Math.min(500, Math.max(1, Math.floor(Number(searchParams.get('limit') ?? '200'))));

  const where = botId ? { botId } : {};

  const items = await prisma.pnLSnapshot.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ items });
}
