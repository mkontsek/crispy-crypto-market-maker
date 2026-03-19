import type { BotId, Fill } from '@crispy/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { BOT_REFETCH_INTERVAL_MS } from '@/lib/bot-data-service';
import { fetchJson } from '@/lib/fetch-json';
import { resolveNetworkFirstCacheFallback } from '@/lib/query-cache-fallback';

type FillsResponse = {
    botId: BotId;
    items: Fill[];
};

export function useBotFillsQuery(botId: BotId) {
    const queryClient = useQueryClient();
    const botQuery = encodeURIComponent(botId);
    const queryKey = ['fills', botId] as const;

    return useQuery({
        queryKey,
        queryFn: async () => {
            const networkData = await fetchJson<FillsResponse>(
                `/api/fills?botId=${botQuery}&page=1&pageSize=100`
            );
            const cachedData = queryClient.getQueryData<FillsResponse>(queryKey);

            return resolveNetworkFirstCacheFallback({
                networkData,
                cachedData,
                isNetworkEmpty: (data) => data.items.length === 0,
            });
        },
        refetchInterval: BOT_REFETCH_INTERVAL_MS,
    });
}
