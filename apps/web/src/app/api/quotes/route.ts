import { NextResponse } from 'next/server';

import { getRelaySnapshot } from '@/server/engine-relay';
import { parseBotIdFromRequest } from '@/server/bot-target';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    const target = parseBotIdFromRequest(request);
    if ('error' in target) {
        return target.error;
    }

    const snapshot = getRelaySnapshot(target.botId);
    return NextResponse.json({
        botId: target.botId,
        connected: snapshot.connected,
        updatedAt: snapshot.lastUpdated,
        quotes: snapshot.quotes,
        quoteHistory: snapshot.quoteHistory,
        exchangeHealth: snapshot.exchangeHealth,
        config: snapshot.config,
        killSwitchEngaged: snapshot.killSwitchEngaged,
        strategy: snapshot.strategy,
    });
}
