import { useQueries } from '@tanstack/react-query';

import { fetchGeoForUrl } from '@/lib/geo-service';

interface GeoServiceEntry {
  id: string;
  url: string;
}

export function useServiceGeoQueries(entries: GeoServiceEntry[]) {
  return useQueries({
    queries: entries.map((entry) => ({
      queryKey: ['geo', entry.url],
      queryFn: () => fetchGeoForUrl(entry.url),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });
}
