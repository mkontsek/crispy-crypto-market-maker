import { mmConfigSchema } from '@crispy/shared';
import { NextResponse } from 'next/server';

import { parseBotIdFromRequest } from '@/server/bot-target';
import { forwardEnginePost } from '@/server/engine-http';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    const target = parseBotIdFromRequest(request);
    if ('error' in target) {
        return target.error;
    }

    const body = await request.json();
    const parsed = mmConfigSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            {
                error: 'invalid config payload',
                details: parsed.error.flatten(),
            },
            { status: 400 }
        );
    }

    try {
        const response = await forwardEnginePost(
            target.botId,
            '/config',
            parsed.data
        );
        return NextResponse.json(response.body, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'failed to forward config update to engine',
                details:
                    error instanceof Error ? error.message : 'unknown error',
            },
            { status: 502 }
        );
    }
}
