import { useQuery } from '@tanstack/react-query';

import { fetchDashboardGeo } from '@/lib/geo-service';

export function useDashboardGeoQuery() {
  return useQuery({
    queryKey: ['geo', 'dashboard'],
    queryFn: fetchDashboardGeo,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
