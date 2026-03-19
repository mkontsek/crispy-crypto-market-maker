import { prisma } from '@crispy/db';
import { NextResponse } from 'next/server';

import { sanitize } from '@/lib/sanitize';
import { getRuntimeTopology } from '@/server/runtime-topology';

export const runtime = 'nodejs';

function nameCandidates(name: string): string[] {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return [];
    }

    const lower = trimmed.toLowerCase();
    const kebab = lower
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

    return [trimmed, lower, kebab].filter((value, index, all) => {
        return value.length > 0 && all.indexOf(value) === index;
    });
}

function legacyBotIdCandidates(botId: string): string[] {
    const candidates = new Set<string>();
    const topologyBot = getRuntimeTopology().bots.find((bot) => bot.id === botId);

    candidates.add('bot');
    candidates.add(botId.replace(/-/g, ''));
    if (botId.startsWith('bot-')) {
        candidates.add(botId.slice(4));
    }
    if (topologyBot) {
        for (const candidate of nameCandidates(topologyBot.name)) {
            candidates.add(candidate);
        }
    }

    candidates.delete(botId);
    return [...candidates].filter((candidate) => candidate.length > 0);
}

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

    if (total > 0 || !botId) {
        return NextResponse.json({ items, total, page, pageSize });
    }

    const legacyBotIds = legacyBotIdCandidates(botId);
    if (legacyBotIds.length === 0) {
        return NextResponse.json({ items, total, page, pageSize });
    }

    const legacyWhere = {
        botId: { in: legacyBotIds },
        ...(level ? { level: level as 'info' | 'warn' | 'error' } : {}),
    };
    const [legacyItems, legacyTotal] = await Promise.all([
        prisma.systemLog.findMany({
            where: legacyWhere,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.systemLog.count({ where: legacyWhere }),
    ]);

    return NextResponse.json({
        items: legacyItems,
        total: legacyTotal,
        page,
        pageSize,
        source: 'legacy-bot-id',
    });
}
