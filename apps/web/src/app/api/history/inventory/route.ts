import { prisma } from '@crispy/db';
import { NextResponse } from 'next/server';

import { sanitize } from '@/lib/sanitize';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const rawPair = searchParams.get('pair');
    const pair = rawPair ? sanitize(rawPair) : null;

    const rawBotId = searchParams.get('botId');
    const botId = rawBotId ? sanitize(rawBotId) : null;

    const page = Math.max(
        1,
        Math.floor(Number(searchParams.get('page') ?? '1'))
    );
    const pageSize = Math.min(
        500,
        Math.max(
            1,
            Math.floor(
                Number(searchParams.get('pageSize') ?? searchParams.get('limit') ?? '200')
            )
        )
    );

    const where = {
        ...(pair ? { pair } : {}),
        ...(botId ? { botId } : {}),
    };

    const [items, total] = await Promise.all([
        prisma.inventory.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.inventory.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
}
