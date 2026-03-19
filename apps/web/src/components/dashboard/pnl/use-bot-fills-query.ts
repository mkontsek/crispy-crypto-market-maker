import type { BotId, Fill } from '@crispy/shared';
import { useQuery } from '@tanstack/react-query';

import { BOT_REFETCH_INTERVAL_MS } from '@/lib/bot-data-service';
import { fetchJson } from '@/lib/fetch-json';

type FillsResponse = {
    botId: BotId;
    items: Fill[];
};

export function useBotFillsQuery(botId: BotId) {
    const botQuery = encodeURIComponent(botId);

    return useQuery({
        queryKey: ['fills', botId],
        queryFn: () =>
            fetchJson<FillsResponse>(
                `/api/fills?botId=${botQuery}&page=1&pageSize=100`
            ),
        refetchInterval: BOT_REFETCH_INTERVAL_MS,
    });
}
