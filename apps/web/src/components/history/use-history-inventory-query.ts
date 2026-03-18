import type { DbInventory } from '@/components/history/inventory-history-section';
import { useQuery } from '@tanstack/react-query';

import { fetchJson } from '@/lib/fetch-json';

type InventoryResponse = { items: DbInventory[] };

export function useHistoryInventoryQuery() {
    return useQuery({
        queryKey: ['history', 'inventory'],
        queryFn: () =>
            fetchJson<InventoryResponse>('/api/history/inventory?limit=200'),
        refetchInterval: 10_000,
    });
}
