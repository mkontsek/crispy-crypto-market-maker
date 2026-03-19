import type { BotId, PnLSnapshot } from '@crispy/shared';
import { useQuery } from '@tanstack/react-query';

import { BOT_REFETCH_INTERVAL_MS } from '@/lib/bot-data-service';
import { fetchJson } from '@/lib/fetch-json';

type PnlResponse = {
    botId: BotId;
    items: PnLSnapshot[];
};

export function useBotPnlQuery(botId: BotId) {
    const botQuery = encodeURIComponent(botId);

    return useQuery({
        queryKey: ['pnl', botId],
        queryFn: () => fetchJson<PnlResponse>(`/api/pnl?botId=${botQuery}`),
        refetchInterval: BOT_REFETCH_INTERVAL_MS,
    });
}
