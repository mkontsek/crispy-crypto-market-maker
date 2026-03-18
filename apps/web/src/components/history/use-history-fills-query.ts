import type { DbFill } from '@/components/history/fills-table';
import { useQuery } from '@tanstack/react-query';

import { fetchJson } from '@/lib/fetch-json';
import { HISTORY_REFETCH_INTERVAL_MS } from '@/lib/history-service';

type FillsResponse = {
    items: DbFill[];
    total: number;
    page: number;
    pageSize: number;
};

export function useHistoryFillsQuery(page: number, pageSize: number) {
    return useQuery({
        queryKey: ['history', 'fills', page],
        queryFn: () =>
            fetchJson<FillsResponse>(
                `/api/history/fills?page=${page}&pageSize=${pageSize}`
            ),
        refetchInterval: HISTORY_REFETCH_INTERVAL_MS,
    });
}
