import type { BotId, PnLSnapshot } from '@crispy/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { BOT_REFETCH_INTERVAL_MS } from '@/lib/bot-data-service';
import { fetchJson } from '@/lib/fetch-json';
import { resolveNetworkFirstCacheFallback } from '@/lib/query-cache-fallback';

type PnlResponse = {
    botId: BotId;
    items: PnLSnapshot[];
};

export function useBotPnlQuery(botId: BotId) {
    const queryClient = useQueryClient();
    const botQuery = encodeURIComponent(botId);
    const queryKey = ['pnl', botId] as const;

    return useQuery({
        queryKey,
        queryFn: async () => {
            const networkData = await fetchJson<PnlResponse>(
                `/api/pnl?botId=${botQuery}`
            );
            const cachedData = queryClient.getQueryData<PnlResponse>(queryKey);

            return resolveNetworkFirstCacheFallback({
                networkData,
                cachedData,
                isNetworkEmpty: (data) => data.items.length === 0,
            });
        },
        refetchInterval: BOT_REFETCH_INTERVAL_MS,
    });
}
