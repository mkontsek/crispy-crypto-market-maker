import { DEFAULT_BOT_ID } from '@crispy/shared';
import { prisma } from '@crispy/db';
import { pairSchema } from '@crispy/shared';
import { NextResponse } from 'next/server';

import { parseBotIdFromRequest } from '@/server/bot-target';
import { getRelaySnapshot } from '@/server/engine-relay';
import { sanitize } from '@/lib/sanitize';
import { getRuntimeTopology } from '@/server/runtime-topology';

export const runtime = 'nodejs';

type FillResponseItem = {
    id: string;
    pair: string;
    side: 'buy' | 'sell';
    price: string;
    size: string;
    midAtFill: string;
    realizedSpread: string;
    adverseSelection: boolean;
    timestamp: string;
};

type DbFillRow = {
    id: string;
    pair: string;
    side: 'buy' | 'sell';
    price: number;
    size: number;
    midAtFill: number;
    realizedSpread: number;
    adverseSelection: boolean;
    createdAt: Date;
};

function mapDbFillToResponseItem(row: DbFillRow): FillResponseItem {
    return {
        id: row.id,
        pair: row.pair,
        side: row.side,
        price: String(row.price),
        size: String(row.size),
        midAtFill: String(row.midAtFill),
        realizedSpread: String(row.realizedSpread),
        adverseSelection: row.adverseSelection,
        timestamp: String(BigInt(row.createdAt.getTime()) * 1_000_000n),
    };
}

function compareFillRowsByCreatedAtDesc(a: DbFillRow, b: DbFillRow) {
    return b.createdAt.getTime() - a.createdAt.getTime();
}

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

async function queryDbFills(
    botIds: string[],
    pair: string | null,
    page: number,
    pageSize: number
) {
    const where = {
        ...(pair ? { pair } : {}),
        ...(botIds.length === 1 ? { botId: botIds[0] } : {}),
        ...(botIds.length > 1 ? { botId: { in: botIds } } : {}),
    };

    if (botIds.length > 1) {
        const rowsByBot = await Promise.all(
            botIds.map((botId) =>
                prisma.fill.findMany({
                    where: {
                        ...(pair ? { pair } : {}),
                        botId,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: page * pageSize,
                })
            )
        );

        const mergedRows = rowsByBot
            .flat()
            .sort(compareFillRowsByCreatedAtDesc);
        const dedupedRows: DbFillRow[] = [];
        const seenIds = new Set<string>();
        for (const row of mergedRows) {
            if (seenIds.has(row.id)) {
                continue;
            }
            seenIds.add(row.id);
            dedupedRows.push(row);
        }

        const start = (page - 1) * pageSize;
        return {
            items: dedupedRows
                .slice(start, start + pageSize)
                .map(mapDbFillToResponseItem),
            total: dedupedRows.length,
        };
    }

    const [rows, total] = await Promise.all([
        prisma.fill.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.fill.count({ where }),
    ]);

    return {
        items: rows.map(mapDbFillToResponseItem),
        total,
    };
}

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

    const boundedPage =
        Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const boundedPageSize =
        Number.isFinite(pageSize) && pageSize > 0
            ? Math.min(Math.floor(pageSize), 100)
            : 25;

    const snapshot = getRelaySnapshot(target.botId);
    const filtered = pair
        ? snapshot.fills.filter((fill) => fill.pair === pair)
        : snapshot.fills;

    if (filtered.length > 0 || snapshot.connected) {
        const start = (boundedPage - 1) * boundedPageSize;
        const items = filtered.slice(start, start + boundedPageSize);

        return NextResponse.json({
            botId: target.botId,
            source: 'relay',
            items,
            total: filtered.length,
            page: boundedPage,
            pageSize: boundedPageSize,
        });
    }

    const dbResult = await queryDbFills(
        [target.botId],
        pair,
        boundedPage,
        boundedPageSize
    );
    if (dbResult.total > 0) {
        return NextResponse.json({
            botId: target.botId,
            source: 'db',
            items: dbResult.items,
            total: dbResult.total,
            page: boundedPage,
            pageSize: boundedPageSize,
        });
    }

    const legacyIds =
        target.botId === DEFAULT_BOT_ID ? legacyBotIdCandidates(target.botId) : [];
    const legacyResult = await queryDbFills(
        legacyIds,
        pair,
        boundedPage,
        boundedPageSize
    );

    return NextResponse.json({
        botId: target.botId,
        source: 'db-legacy-bot-id',
        items: legacyResult.items,
        total: legacyResult.total,
        page: boundedPage,
        pageSize: boundedPageSize,
    });
}
