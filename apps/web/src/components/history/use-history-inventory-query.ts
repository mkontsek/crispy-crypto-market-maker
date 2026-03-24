import type { DbInventory } from '@/components/history/inventory-history-section';
import { useQuery } from '@tanstack/react-query';

import { fetchJson } from '@/lib/fetch-json';
import { HISTORY_REFETCH_INTERVAL_MS } from '@/lib/history-service';

type InventoryResponse = {
    items: DbInventory[];
    total: number;
    page: number;
    pageSize: number;
};

export function useHistoryInventoryQuery(page: number, pageSize: number) {
    return useQuery({
        queryKey: ['history', 'inventory', page, pageSize],
        queryFn: () =>
            fetchJson<InventoryResponse>(
                `/api/history/inventory?page=${page}&pageSize=${pageSize}`
            ),
        refetchInterval: HISTORY_REFETCH_INTERVAL_MS,
    });
}
