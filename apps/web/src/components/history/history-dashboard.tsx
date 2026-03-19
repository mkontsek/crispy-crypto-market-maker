'use client';

import type { FC } from 'react';
import { useState } from 'react';

import { FillsTable } from '@/components/history/fills-table';
import { InventoryHistorySection } from '@/components/history/inventory-history-section';
import { PnlHistorySection } from '@/components/history/pnl-history-section';
import { DashboardHeaderNavLinks } from '@/components/dashboard/dashboard-header-nav-links';

import { useClearHistoryMutation } from './use-clear-history-mutation';
import { useHistoryFillsQuery } from './use-history-fills-query';
import { useHistoryInventoryQuery } from './use-history-inventory-query';
import { useHistoryPnlQuery } from './use-history-pnl-query';

export const HistoryDashboard: FC = () => {
    const [fillsPage, setFillsPage] = useState(1);
    const [pnlPage, setPnlPage] = useState(1);
    const [inventoryPage, setInventoryPage] = useState(1);
    const FILLS_PAGE_SIZE = 50;
    const SNAPSHOTS_PAGE_SIZE = 200;

    const fillsQuery = useHistoryFillsQuery(fillsPage, FILLS_PAGE_SIZE);
    const pnlQuery = useHistoryPnlQuery(pnlPage, SNAPSHOTS_PAGE_SIZE);
    const inventoryQuery = useHistoryInventoryQuery(
        inventoryPage,
        SNAPSHOTS_PAGE_SIZE
    );
    const clearHistoryMutation = useClearHistoryMutation({
        setFillsPage,
        setPnlPage,
        setInventoryPage,
    });

    const fills = fillsQuery.data?.items ?? [];
    const fillsTotal = fillsQuery.data?.total ?? 0;
    const pnlSnapshots = pnlQuery.data?.items ?? [];
    const pnlTotal = pnlQuery.data?.total ?? 0;
    const inventoryRows = inventoryQuery.data?.items ?? [];
    const inventoryTotal = inventoryQuery.data?.total ?? 0;

    const isLoading =
        fillsQuery.isLoading || pnlQuery.isLoading || inventoryQuery.isLoading;

    return (
        <main className="w-full">
            <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 mb-4">
                <div>
                    <h1 className="text-xl font-semibold">Historical Data</h1>
                    <p className="text-sm text-slate-400">
                        Fills, PnL and inventory snapshots persisted from all
                        bot streams.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DashboardHeaderNavLinks activePage="history" />
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-4">
                <FillsTable
                    fills={fills}
                    total={fillsTotal}
                    page={fillsPage}
                    pageSize={FILLS_PAGE_SIZE}
                    isLoading={isLoading}
                    deleteAllHistoryPending={clearHistoryMutation.isPending}
                    deleteAllHistoryError={clearHistoryMutation.isError}
                    onDeleteAllHistory={() => {
                        if (
                            !window.confirm(
                                'Delete all historical data from the database?'
                            )
                        ) {
                            return;
                        }
                        clearHistoryMutation.mutate();
                    }}
                    onPageChange={setFillsPage}
                />

                <PnlHistorySection
                    snapshots={pnlSnapshots}
                    total={pnlTotal}
                    page={pnlPage}
                    pageSize={SNAPSHOTS_PAGE_SIZE}
                    onPageChange={setPnlPage}
                />

                <InventoryHistorySection
                    rows={inventoryRows}
                    total={inventoryTotal}
                    page={inventoryPage}
                    pageSize={SNAPSHOTS_PAGE_SIZE}
                    onPageChange={setInventoryPage}
                />
            </div>
        </main>
    );
};
