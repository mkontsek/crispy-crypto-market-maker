'use client';

import type {
  ExchangeHealth,
  Fill,
  InventorySnapshot,
  MMConfig,
  PnLSnapshot,
  QuoteSnapshot,
} from '@crispy/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ConfigPanelSection } from '@/components/dashboard/config-panel-section';
import { ExchangeHealthSection } from '@/components/dashboard/exchange-health-section';
import { InventoryMonitorSection } from '@/components/dashboard/inventory-monitor-section';
import { LiveQuotesSection } from '@/components/dashboard/live-quotes-section';
import { PnlPerformanceSection } from '@/components/dashboard/pnl-performance-section';
import { QuoteHistorySection } from '@/components/dashboard/quote-history-section';
import { Badge } from '@/components/ui/badge';
import { fetchJson } from '@/lib/fetch-json';
import { useEngineStream } from '@/hooks/use-engine-stream';
import { useEngineStore } from '@/stores/engine-store';

type QuotesResponse = {
  connected: boolean;
  updatedAt: string | null;
  quotes: QuoteSnapshot[];
  quoteHistory: ReturnType<typeof useEngineStore.getState>['quoteHistory'];
  exchangeHealth: ExchangeHealth[];
  config: MMConfig | null;
};

type FillsResponse = {
  items: Fill[];
};

type PnlResponse = {
  items: PnLSnapshot[];
};

type InventoryResponse = {
  current: InventorySnapshot[];
};

export function MarketMakerDashboard() {
  useEngineStream();

  const queryClient = useQueryClient();
  const streamPayload = useEngineStore((state) => state.lastPayload);
  const streamConnected = useEngineStore((state) => state.connected);
  const liveQuoteHistory = useEngineStore((state) => state.quoteHistory);

  const quotesQuery = useQuery({
    queryKey: ['quotes'],
    queryFn: () => fetchJson<QuotesResponse>('/api/quotes'),
  });
  const fillsQuery = useQuery({
    queryKey: ['fills'],
    queryFn: () => fetchJson<FillsResponse>('/api/fills?page=1&pageSize=100'),
  });
  const pnlQuery = useQuery({
    queryKey: ['pnl'],
    queryFn: () => fetchJson<PnlResponse>('/api/pnl'),
  });
  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: () => fetchJson<InventoryResponse>('/api/inventory'),
  });

  const configMutation = useMutation({
    mutationFn: async (payload: MMConfig) => {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('failed to update engine config');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  const pairActionMutation = useMutation({
    mutationFn: async ({
      pair,
      action,
      paused,
    }: {
      pair: string;
      action: 'pause' | 'hedge';
      paused?: boolean;
    }) => {
      if (action === 'pause') {
        const response = await fetch(`/api/pairs/${encodeURIComponent(pair)}/pause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paused }),
        });
        if (!response.ok) {
          throw new Error('failed to update pair pause status');
        }
        return response.json();
      }

      const response = await fetch('/api/hedge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair }),
      });
      if (!response.ok) {
        throw new Error('failed to hedge pair');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pnl'] });
    },
  });

  const quotes = streamPayload?.quotes ?? quotesQuery.data?.quotes ?? [];
  const fills = dedupeFills([
    ...(streamPayload?.fills ?? []),
    ...(fillsQuery.data?.items ?? []),
  ]);
  const pnl = dedupePnl([
    ...(streamPayload?.pnl ? [streamPayload.pnl] : []),
    ...(pnlQuery.data?.items ?? []),
  ]);
  const inventory = streamPayload?.inventory ?? inventoryQuery.data?.current ?? [];
  const health = streamPayload?.exchangeHealth ?? quotesQuery.data?.exchangeHealth ?? [];
  const config = streamPayload?.config ?? quotesQuery.data?.config ?? null;
  const connected = streamConnected || quotesQuery.data?.connected || false;
  const pendingPair = pairActionMutation.variables?.pair ?? null;

  return (
    <main className="mx-auto max-w-7xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div>
          <h1 className="text-xl font-semibold">Crispy Crypto Market Maker</h1>
          <p className="text-sm text-slate-400">
            Market maker bot connected to a simulated exchange — real-time metrics via Next.js BFF + SSE.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={connected ? 'success' : 'danger'}>
            {connected ? 'bot live' : 'bot offline'}
          </Badge>
          {configMutation.isPending || pairActionMutation.isPending ? (
            <Badge tone="warning">Applying changes...</Badge>
          ) : null}
        </div>
      </header>

      <LiveQuotesSection quotes={quotes} connected={connected} />

      <div className="grid gap-4 xl:grid-cols-2">
        <InventoryMonitorSection
          inventory={inventory}
          quotes={quotes}
          pendingPair={pendingPair}
          onTogglePause={(pair, paused) =>
            pairActionMutation.mutate({ pair, action: 'pause', paused })
          }
          onManualHedge={(pair) => pairActionMutation.mutate({ pair, action: 'hedge' })}
        />
        <PnlPerformanceSection pnl={pnl} fills={fills} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QuoteHistorySection
          entries={liveQuoteHistory.length > 0 ? liveQuoteHistory : quotesQuery.data?.quoteHistory ?? []}
        />
        <ConfigPanelSection
          config={config}
          saving={configMutation.isPending}
          onSubmit={(next) => configMutation.mutate(next)}
        />
      </div>

      <ExchangeHealthSection health={health} />
    </main>
  );
}

function dedupeFills(fills: Fill[]) {
  const seen = new Set<string>();
  const output: Fill[] = [];
  for (const fill of fills) {
    if (seen.has(fill.id)) continue;
    seen.add(fill.id);
    output.push(fill);
  }
  return output.slice(0, 300);
}

function dedupePnl(pnl: PnLSnapshot[]) {
  const seen = new Set<string>();
  const output: PnLSnapshot[] = [];
  for (const row of pnl) {
    if (seen.has(row.timestamp)) continue;
    seen.add(row.timestamp);
    output.push(row);
  }
  return output.slice(0, 300);
}
