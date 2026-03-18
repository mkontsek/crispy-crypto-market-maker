import { useQuery } from '@tanstack/react-query';

import { fetchDashboardGeo } from '@/lib/geo-service';

export function useDashboardGeoQuery(enabled = true) {
    return useQuery({
        queryKey: ['geo', 'dashboard'],
        queryFn: fetchDashboardGeo,
        staleTime: 5 * 60 * 1000,
        retry: false,
        enabled,
    });
}
