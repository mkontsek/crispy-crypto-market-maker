import type { BotId, InventorySnapshot } from '@crispy/shared';
import { useQuery } from '@tanstack/react-query';

import { BOT_REFETCH_INTERVAL_MS } from '@/lib/bot-data-service';
import { fetchJson } from '@/lib/fetch-json';

type InventoryResponse = {
    botId: BotId;
    current: InventorySnapshot[];
};

export function useBotInventoryQuery(botId: BotId) {
    const botQuery = encodeURIComponent(botId);

    return useQuery({
        queryKey: ['inventory', botId],
        queryFn: () =>
            fetchJson<InventoryResponse>(`/api/inventory?botId=${botQuery}`),
        refetchInterval: BOT_REFETCH_INTERVAL_MS,
    });
}
