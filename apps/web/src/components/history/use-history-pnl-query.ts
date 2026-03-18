import type { DbPnLSnapshot } from '@/components/history/pnl-history-section';
import { useQuery } from '@tanstack/react-query';

import { fetchJson } from '@/lib/fetch-json';

type PnlResponse = { items: DbPnLSnapshot[] };

export function useHistoryPnlQuery() {
  return useQuery({
    queryKey: ['history', 'pnl'],
    queryFn: () => fetchJson<PnlResponse>('/api/history/pnl?limit=200'),
    refetchInterval: 10_000,
  });
}
