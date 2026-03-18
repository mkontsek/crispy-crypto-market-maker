import type { RuntimeTopology } from '@crispy/shared';
import { useQuery } from '@tanstack/react-query';

import { fetchJson } from '@/lib/fetch-json';

export function useTopologyQuery() {
  return useQuery({
    queryKey: ['topology'],
    queryFn: () => fetchJson<RuntimeTopology>('/api/topology'),
  });
}
