'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { FillsTable, type DbFill } from '@/components/history/fills-table';
import { InventoryHistorySection, type DbInventory } from '@/components/history/inventory-history-section';
import { PnlHistorySection, type DbPnLSnapshot } from '@/components/history/pnl-history-section';
import { Badge } from '@/components/ui/badge';
import { fetchJson } from '@/lib/fetch-json';

type FillsResponse = { items: DbFill[]; total: number; page: number; pageSize: number };
type PnlResponse = { items: DbPnLSnapshot[] };
type InventoryResponse = { items: DbInventory[] };

export function HistoryDashboard() {
  const [fillsPage, setFillsPage] = useState(1);
  const PAGE_SIZE = 50;

  const fillsQuery = useQuery({
    queryKey: ['history', 'fills', fillsPage],
    queryFn: () =>
      fetchJson<FillsResponse>(`/api/history/fills?page=${fillsPage}&pageSize=${PAGE_SIZE}`),
    refetchInterval: 10_000,
  });

  const pnlQuery = useQuery({
    queryKey: ['history', 'pnl'],
    queryFn: () => fetchJson<PnlResponse>('/api/history/pnl?limit=200'),
    refetchInterval: 10_000,
  });

  const inventoryQuery = useQuery({
    queryKey: ['history', 'inventory'],
    queryFn: () => fetchJson<InventoryResponse>('/api/history/inventory?limit=200'),
    refetchInterval: 10_000,
  });

  const fills = fillsQuery.data?.items ?? [];
  const fillsTotal = fillsQuery.data?.total ?? 0;
  const pnlSnapshots = pnlQuery.data?.items ?? [];
  const inventoryRows = inventoryQuery.data?.items ?? [];

  const isLoading = fillsQuery.isLoading || pnlQuery.isLoading || inventoryQuery.isLoading;

  return (
    <main className="mx-auto max-w-7xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div>
          <h1 className="text-xl font-semibold">Historical Data</h1>
          <p className="text-sm text-slate-400">
            Fills, PnL and inventory snapshots persisted from all bot streams.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Badge tone="warning">Loading…</Badge>
          ) : (
            <Badge tone="success">Loaded</Badge>
          )}
          <Badge tone="default">Auto-refreshes every 10s</Badge>
        </div>
      </header>

      <FillsTable
        fills={fills}
        total={fillsTotal}
        page={fillsPage}
        pageSize={PAGE_SIZE}
        onPageChange={setFillsPage}
      />

      <PnlHistorySection snapshots={pnlSnapshots} />

      <InventoryHistorySection rows={inventoryRows} />
    </main>
  );
}
