import { prisma } from '@crispy/db';
import { NextResponse } from 'next/server';

import { sanitize } from '@/lib/sanitize';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const rawBotId = searchParams.get('botId');
    const botId = rawBotId ? sanitize(rawBotId) : null;

    const rawLevel = searchParams.get('level');
    const level = rawLevel ? sanitize(rawLevel) : null;

    const page = Math.max(
        1,
        Math.floor(Number(searchParams.get('page') ?? '1'))
    );
    const pageSize = Math.min(
        200,
        Math.max(1, Math.floor(Number(searchParams.get('pageSize') ?? '100')))
    );

    const where = {
        ...(botId ? { botId } : {}),
        ...(level ? { level: level as 'info' | 'warn' | 'error' } : {}),
    };

    const [items, total] = await Promise.all([
        prisma.systemLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.systemLog.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
}
