import type { BotId, InventorySnapshot } from '@crispy/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { BOT_REFETCH_INTERVAL_MS } from '@/lib/bot-data-service';
import { fetchJson } from '@/lib/fetch-json';
import { resolveNetworkFirstCacheFallback } from '@/lib/query-cache-fallback';

type InventoryResponse = {
    botId: BotId;
    current: InventorySnapshot[];
};

export function useBotInventoryQuery(botId: BotId) {
    const queryClient = useQueryClient();
    const botQuery = encodeURIComponent(botId);
    const queryKey = ['inventory', botId] as const;

    return useQuery({
        queryKey,
        queryFn: async () => {
            const networkData = await fetchJson<InventoryResponse>(
                `/api/inventory?botId=${botQuery}`
            );
            const cachedData =
                queryClient.getQueryData<InventoryResponse>(queryKey);

            return resolveNetworkFirstCacheFallback({
                networkData,
                cachedData,
                isNetworkEmpty: (data) => data.current.length === 0,
            });
        },
        refetchInterval: BOT_REFETCH_INTERVAL_MS,
    });
}
