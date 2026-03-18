import { prisma } from '@crispy/db';
import type { BotId, EngineStreamPayload } from '@crispy/shared';

export function persistPayload(
    botId: BotId,
    payload: EngineStreamPayload
): void {
    const tasks: Promise<unknown>[] = [
        writeQuotes(botId, payload),
        writeInventory(botId, payload),
        writePnl(botId, payload),
    ];

    if (payload.fills.length > 0) {
        tasks.push(writeFills(botId, payload));
    }

    Promise.allSettled(tasks).then((results) => {
        for (const result of results) {
            if (result.status === 'rejected') {
                console.error(
                    `[db-writer] ${botId} persist error`,
                    result.reason
                );
            }
        }
    });
}

async function writeFills(
    botId: BotId,
    payload: EngineStreamPayload
): Promise<void> {
    await prisma.fill.createMany({
        data: payload.fills.map((f) => ({
            id: f.id,
            botId,
            pair: f.pair,
            side: f.side,
            price: Number(f.price),
            size: Number(f.size),
            midAtFill: Number(f.midAtFill),
            realizedSpread: Number(f.realizedSpread),
            adverseSelection: f.adverseSelection,
        })),
        skipDuplicates: true,
    });
}

async function writeQuotes(
    botId: BotId,
    payload: EngineStreamPayload
): Promise<void> {
    if (payload.quotes.length === 0) return;
    await prisma.quote.createMany({
        data: payload.quotes.map((q) => ({
            botId,
            pair: q.pair,
            bid: Number(q.bid),
            ask: Number(q.ask),
            mid: Number(q.mid),
            spreadBps: Number(q.spreadBps),
            inventorySkew: Number(q.inventorySkew),
            quoteRefreshRate: Number(q.quoteRefreshRate),
        })),
    });
}

async function writeInventory(
    botId: BotId,
    payload: EngineStreamPayload
): Promise<void> {
    if (payload.inventory.length === 0) return;
    await prisma.inventory.createMany({
        data: payload.inventory.map((i) => ({
            botId,
            pair: i.pair,
            inventory: Number(i.inventory),
            normalizedSkew: Number(i.normalizedSkew),
        })),
    });
}

async function writePnl(
    botId: BotId,
    payload: EngineStreamPayload
): Promise<void> {
    const p = payload.pnl;
    await prisma.pnLSnapshot.create({
        data: {
            botId,
            totalPnl: Number(p.totalPnl),
            realizedSpread: Number(p.realizedSpread),
            hedgingCosts: Number(p.hedgingCosts),
            adverseSelectionRate: Number(p.adverseSelectionRate),
            fillRate: Number(p.fillRate),
        },
    });
}
