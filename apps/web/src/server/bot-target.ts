import { botIdSchema, type BotId } from '@crispy/shared';
import { NextResponse } from 'next/server';

import { sanitize } from '@/lib/sanitize';
import { getRuntimeTopology } from '@/server/runtime-topology';

export function parseBotIdFromRequest(
    request: Request
): { botId: BotId } | { error: NextResponse } {
    const topology = getRuntimeTopology();
    const defaultBotId = topology.bots[0]?.id;
    if (!defaultBotId) {
        return {
            error: NextResponse.json(
                { error: 'no bots configured in runtime topology' },
                { status: 503 }
            ),
        };
    }

    const { searchParams } = new URL(request.url);
    const rawBotId = searchParams.get('botId');
    const parsed = botIdSchema.safeParse(
        rawBotId ? sanitize(rawBotId) : defaultBotId
    );

    if (!parsed.success) {
        return {
            error: NextResponse.json(
                {
                    error: 'invalid botId query param',
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            ),
        };
    }

    const exists = topology.bots.some((bot) => bot.id === parsed.data);
    if (!exists) {
        return {
            error: NextResponse.json(
                {
                    error: 'unknown botId',
                    botId: parsed.data,
                    availableBotIds: topology.bots.map((bot) => bot.id),
                },
                { status: 404 }
            ),
        };
    }

    return { botId: parsed.data };
}
