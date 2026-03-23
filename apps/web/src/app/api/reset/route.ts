import { prisma } from '@crispy/db';
import { NextResponse } from 'next/server';

import { forwardEnginePost } from '@/server/engine-http';
import { resetAllRelays } from '@/server/engine-relay';
import { getRuntimeTopology } from '@/server/runtime-topology';

export const runtime = 'nodejs';

export async function DELETE() {
    resetAllRelays();

    const topology = getRuntimeTopology();

    const botResets = await Promise.allSettled(
        topology.bots.flatMap((bot) => [
            forwardEnginePost(bot.id, '/strategy', { strategy: 'balanced' }),
            forwardEnginePost(bot.id, '/kill-switch', { engaged: false }),
        ])
    );

    for (const result of botResets) {
        if (result.status === 'rejected') {
            console.error('failed to reset bot during test data reset', result.reason);
        }
    }

    const [fills, quotes, inventory, pnlSnapshots] = await prisma.$transaction([
        prisma.fill.deleteMany(),
        prisma.quote.deleteMany(),
        prisma.inventory.deleteMany(),
        prisma.pnLSnapshot.deleteMany(),
    ]);

    return NextResponse.json({
        deleted: {
            fills: fills.count,
            quotes: quotes.count,
            inventory: inventory.count,
            pnlSnapshots: pnlSnapshots.count,
        },
    });
}
