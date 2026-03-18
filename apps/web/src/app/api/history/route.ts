import { prisma } from '@crispy/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function DELETE() {
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
