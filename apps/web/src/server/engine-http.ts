import type { BotId } from '@crispy/shared';

import { resolveBotTopology } from '@/server/runtime-topology';

function joinUrl(baseUrl: string, path: string) {
    const normalizedBase = baseUrl.endsWith('/')
        ? baseUrl.slice(0, -1)
        : baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
}

export async function forwardEnginePost(
    botId: BotId,
    path: string,
    payload: unknown
) {
    const bot = resolveBotTopology(botId);
    const response = await fetch(joinUrl(bot.httpUrl, path), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify(payload),
    });

    const text = await response.text();
    let body: unknown = null;
    if (text.length > 0) {
        body = JSON.parse(text);
    }

    return {
        ok: response.ok,
        status: response.status,
        body,
    };
}
