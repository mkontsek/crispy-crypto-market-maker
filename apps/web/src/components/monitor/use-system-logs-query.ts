'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchJson } from '@/lib/fetch-json';
import { HISTORY_REFETCH_INTERVAL_MS } from '@/lib/history-service';

export type DbSystemLog = {
    id: string;
    botId: string | null;
    level: 'info' | 'warn' | 'error';
    message: string;
    createdAt: string;
};

type SystemLogsResponse = {
    items: DbSystemLog[];
    total: number;
    page: number;
    pageSize: number;
};

export function useSystemLogsQuery(
    page: number,
    pageSize: number,
    botId?: string,
    level?: string
) {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });
    if (botId) params.set('botId', botId);
    if (level) params.set('level', level);

    return useQuery({
        queryKey: ['system-logs', page, pageSize, botId, level],
        queryFn: () =>
            fetchJson<SystemLogsResponse>(`/api/system-logs?${params}`),
        refetchInterval: HISTORY_REFETCH_INTERVAL_MS,
    });
}
