import type {
    BotId,
    ExchangeHealth,
    MMConfig,
    QuoteSnapshot,
    Strategy,
} from '@crispy/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { QuoteHistoryEntry } from '@/components/dashboard/quote-history-section';
import { BOT_REFETCH_INTERVAL_MS } from '@/lib/bot-data-service';
import { fetchJson } from '@/lib/fetch-json';
import { resolveNetworkFirstCacheFallback } from '@/lib/query-cache-fallback';
import { applyOptimisticStrategy } from './use-strategy-mutation';

type QuotesResponse = {
    botId: BotId;
    connected: boolean;
    updatedAt: string | null;
    quotes: QuoteSnapshot[];
    quoteHistory: QuoteHistoryEntry[];
    exchangeHealth: ExchangeHealth[];
    config: MMConfig | null;
    killSwitchEngaged: boolean;
    strategy: Strategy;
};

export function useBotQuotesQuery(botId: BotId) {
    const queryClient = useQueryClient();
    const botQuery = encodeURIComponent(botId);
    const queryKey = ['quotes', botId] as const;

    return useQuery({
        queryKey,
        queryFn: async () => {
            const networkData = await fetchJson<QuotesResponse>(
                `/api/quotes?botId=${botQuery}`
            );
            const cachedData = queryClient.getQueryData<QuotesResponse>(queryKey);

            return resolveNetworkFirstCacheFallback({
                networkData,
                cachedData,
                isNetworkEmpty: (data) =>
                    data.quotes.length === 0 &&
                    data.quoteHistory.length === 0 &&
                    data.exchangeHealth.length === 0 &&
                    data.config === null,
            });
        },
        select: (data) => applyOptimisticStrategy(botId, data),
        refetchInterval: BOT_REFETCH_INTERVAL_MS,
    });
}
