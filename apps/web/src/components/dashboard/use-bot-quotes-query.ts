import type {
    BotId,
    ExchangeHealth,
    MMConfig,
    QuoteSnapshot,
    Strategy,
} from '@crispy/shared';
import { useQuery } from '@tanstack/react-query';

import type { QuoteHistoryEntry } from '@/components/dashboard/quote-history-section';
import { BOT_REFETCH_INTERVAL_MS } from '@/lib/bot-data-service';
import { fetchJson } from '@/lib/fetch-json';
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
    const botQuery = encodeURIComponent(botId);

    return useQuery({
        queryKey: ['quotes', botId],
        queryFn: () =>
            fetchJson<QuotesResponse>(`/api/quotes?botId=${botQuery}`),
        select: (data) => applyOptimisticStrategy(botId, data),
        refetchInterval: BOT_REFETCH_INTERVAL_MS,
    });
}
