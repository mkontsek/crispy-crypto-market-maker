'use client';

import type { FC } from 'react';
import { useState } from 'react';

import { FillsTable } from '@/components/history/fills-table';
import { InventoryHistorySection } from '@/components/history/inventory-history-section';
import { PnlHistorySection } from '@/components/history/pnl-history-section';
import { DashboardHeaderNavLinks } from '@/components/dashboard/dashboard-header-nav-links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useClearHistoryMutation } from './use-clear-history-mutation';
import { useHistoryFillsQuery } from './use-history-fills-query';
import { useHistoryInventoryQuery } from './use-history-inventory-query';
import { useHistoryPnlQuery } from './use-history-pnl-query';

export const HistoryDashboard: FC = () => {
  const [fillsPage, setFillsPage] = useState(1);
  const PAGE_SIZE = 50;

  const fillsQuery = useHistoryFillsQuery(fillsPage, PAGE_SIZE);
  const pnlQuery = useHistoryPnlQuery();
  const inventoryQuery = useHistoryInventoryQuery();
  const clearHistoryMutation = useClearHistoryMutation({ setFillsPage });

  const fills = fillsQuery.data?.items ?? [];
  const fillsTotal = fillsQuery.data?.total ?? 0;
  const pnlSnapshots = pnlQuery.data?.items ?? [];
  const inventoryRows = inventoryQuery.data?.items ?? [];

  const isLoading = fillsQuery.isLoading || pnlQuery.isLoading || inventoryQuery.isLoading;

  return (
    <main className="w-full space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div>
          <h1 className="text-xl font-semibold">Historical Data</h1>
          <p className="text-sm text-slate-400">
            Fills, PnL and inventory snapshots persisted from all bot streams.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardHeaderNavLinks activePage="history" />
          <Button
            variant="danger"
            disabled={clearHistoryMutation.isPending}
            onClick={() => {
              if (!window.confirm('Delete all historical data from the database?')) {
                return;
              }
              clearHistoryMutation.mutate();
            }}
          >
            {clearHistoryMutation.isPending ? 'Deleting…' : 'Delete all history'}
          </Button>
          {clearHistoryMutation.isError ? (
            <Badge tone="danger">Delete failed</Badge>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-4">
        <FillsTable
          fills={fills}
          total={fillsTotal}
          page={fillsPage}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          onPageChange={setFillsPage}
        />

        <PnlHistorySection snapshots={pnlSnapshots} />

        <InventoryHistorySection rows={inventoryRows} />
      </div>
    </main>
  );
};
