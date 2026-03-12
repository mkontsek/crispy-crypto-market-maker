import { hedgeRequestSchema } from '@crispy/shared';
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
  const parsed = hedgeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid hedge payload',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const response = await forwardEnginePost(target.botId, '/hedge', parsed.data);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'failed to trigger hedge via engine',
        details: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 502 }
    );
  }
}
