'use client';

import type { FC } from 'react';
import { useState } from 'react';

import { DashboardHeaderNavLinks } from '@/components/dashboard/dashboard-header-nav-links';
import { SystemLogsTable } from '@/components/monitor/system-logs-table';
import { useSystemLogsQuery } from '@/components/monitor/use-system-logs-query';

const PAGE_SIZE = 100;

export const SystemMonitorDashboard: FC = () => {
    const [page, setPage] = useState(1);
    const logsQuery = useSystemLogsQuery(page, PAGE_SIZE);

    const logs = logsQuery.data?.items ?? [];
    const total = logsQuery.data?.total ?? 0;

    return (
        <main className="w-full">
            <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 mb-4">
                <div>
                    <h1 className="text-xl font-semibold">System Monitor</h1>
                    <p className="text-sm text-slate-400">
                        Bot lifecycle and control-plane events persisted from all bot streams.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DashboardHeaderNavLinks activePage="monitor" />
                </div>
            </header>

            <div className="mx-auto max-w-7xl">
                <SystemLogsTable
                    logs={logs}
                    total={total}
                    page={page}
                    pageSize={PAGE_SIZE}
                    isLoading={logsQuery.isLoading}
                    onPageChange={setPage}
                />
            </div>
        </main>
    );
};
