import { botIdSchema, BOT_IDS, type BotId } from '@crispy/shared';
import { NextResponse } from 'next/server';

import { sanitize } from '@/lib/sanitize';

const DEFAULT_BOT_ID: BotId = BOT_IDS[0];

export function parseBotIdFromRequest(
  request: Request
): { botId: BotId } | { error: NextResponse } {
  const { searchParams } = new URL(request.url);
  const rawBotId = searchParams.get('botId');
  const parsed = botIdSchema.safeParse(
    rawBotId ? sanitize(rawBotId) : DEFAULT_BOT_ID
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

  return { botId: parsed.data };
}
