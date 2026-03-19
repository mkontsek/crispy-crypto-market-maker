import type { DbPnLSnapshot } from '@/components/history/pnl-history-section';
import { useQuery } from '@tanstack/react-query';

import { fetchJson } from '@/lib/fetch-json';
import { HISTORY_REFETCH_INTERVAL_MS } from '@/lib/history-service';

type PnlResponse = {
    items: DbPnLSnapshot[];
    total: number;
    page: number;
    pageSize: number;
};

export function useHistoryPnlQuery(page: number, pageSize: number) {
    return useQuery({
        queryKey: ['history', 'pnl', page, pageSize],
        queryFn: () =>
            fetchJson<PnlResponse>(
                `/api/history/pnl?page=${page}&pageSize=${pageSize}`
            ),
        refetchInterval: HISTORY_REFETCH_INTERVAL_MS,
    });
}
