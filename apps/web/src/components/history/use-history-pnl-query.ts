import type { DbPnLSnapshot } from '@/components/history/pnl-history-section';
import { useQuery } from '@tanstack/react-query';

import { fetchJson } from '@/lib/fetch-json';
import { HISTORY_REFETCH_INTERVAL_MS } from '@/lib/history-service';

type PnlResponse = { items: DbPnLSnapshot[] };

export function useHistoryPnlQuery() {
    return useQuery({
        queryKey: ['history', 'pnl'],
        queryFn: () => fetchJson<PnlResponse>('/api/history/pnl?limit=200'),
        refetchInterval: HISTORY_REFETCH_INTERVAL_MS,
    });
}
