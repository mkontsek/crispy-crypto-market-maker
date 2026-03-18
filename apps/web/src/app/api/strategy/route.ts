import { NextResponse } from 'next/server';

import { parseBotIdFromRequest } from '@/server/bot-target';
import { forwardEnginePost } from '@/server/engine-http';
import { setStrategyRequestSchema } from '@crispy/shared';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    const target = parseBotIdFromRequest(request);
    if ('error' in target) {
        return target.error;
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'invalid json body' },
            { status: 400 }
        );
    }

    const parsed = setStrategyRequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'invalid body', details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const result = await forwardEnginePost(
        target.botId,
        '/strategy',
        parsed.data
    );
    return NextResponse.json(result.body, { status: result.status });
}
