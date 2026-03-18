import { NextResponse } from 'next/server';

import { parseBotIdFromRequest } from '@/server/bot-target';
import { getRelaySnapshot } from '@/server/engine-relay';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    const target = parseBotIdFromRequest(request);
    if ('error' in target) {
        return target.error;
    }

    const snapshot = getRelaySnapshot(target.botId);
    return NextResponse.json({
        botId: target.botId,
        items: snapshot.pnlHistory,
    });
}
