'use client';

import type {
  BotId,
  ExchangeHealth,
  Fill,
  InventorySnapshot,
  MMConfig,
  PnLSnapshot,
  QuoteSnapshot,
  TopologyBot,
} from '@crispy/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ConfigPanelSection } from '@/components/dashboard/config-panel-section';
import { ExchangeHealthSection } from '@/components/dashboard/exchange-health-section';
import { InventoryMonitorSection } from '@/components/dashboard/inventory-monitor-section';
import { LiveQuotesSection } from '@/components/dashboard/live-quotes-section';
import {
  QuoteHistorySection,
  type QuoteHistoryEntry,
} from '@/components/dashboard/quote-history-section';
import { PnlPerformanceSection } from '@/components/dashboard/pnl-performance-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchJson } from '@/lib/fetch-json';

type QuotesResponse = {
  botId: BotId;
  connected: boolean;
  updatedAt: string | null;
  quotes: QuoteSnapshot[];
  quoteHistory: QuoteHistoryEntry[];
  exchangeHealth: ExchangeHealth[];
  config: MMConfig | null;
};

type FillsResponse = {
  botId: BotId;
  items: Fill[];
};

type PnlResponse = {
  botId: BotId;
  items: PnLSnapshot[];
};

type InventoryResponse = {
  botId: BotId;
  current: InventorySnapshot[];
};

export function BotDashboardPanel({ bot }: { bot: TopologyBot }) {
  const queryClient = useQueryClient();
  const botQuery = encodeURIComponent(bot.id);

  const quotesQuery = useQuery({
    queryKey: ['quotes', bot.id],
    queryFn: () => fetchJson<QuotesResponse>(`/api/quotes?botId=${botQuery}`),
    refetchInterval: 1_500,
  });
  const fillsQuery = useQuery({
    queryKey: ['fills', bot.id],
    queryFn: () =>
      fetchJson<FillsResponse>(`/api/fills?botId=${botQuery}&page=1&pageSize=100`),
    refetchInterval: 1_500,
  });
  const pnlQuery = useQuery({
    queryKey: ['pnl', bot.id],
    queryFn: () => fetchJson<PnlResponse>(`/api/pnl?botId=${botQuery}`),
    refetchInterval: 1_500,
  });
  const inventoryQuery = useQuery({
    queryKey: ['inventory', bot.id],
    queryFn: () => fetchJson<InventoryResponse>(`/api/inventory?botId=${botQuery}`),
    refetchInterval: 1_500,
  });

  const configMutation = useMutation({
    mutationFn: async (payload: MMConfig) => {
      const response = await fetch(`/api/config?botId=${botQuery}`, {
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
      queryClient.invalidateQueries({ queryKey: ['quotes', bot.id] });
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
        const response = await fetch(
          `/api/pairs/${encodeURIComponent(pair)}/pause?botId=${botQuery}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paused }),
          }
        );
        if (!response.ok) {
          throw new Error('failed to update pair pause status');
        }
        return response.json();
      }

      const response = await fetch(`/api/hedge?botId=${botQuery}`, {
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
      queryClient.invalidateQueries({ queryKey: ['quotes', bot.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', bot.id] });
      queryClient.invalidateQueries({ queryKey: ['pnl', bot.id] });
      queryClient.invalidateQueries({ queryKey: ['fills', bot.id] });
    },
  });

  const quotes = quotesQuery.data?.quotes ?? [];
  const fills = dedupeFills(fillsQuery.data?.items ?? []);
  const pnl = dedupePnl(pnlQuery.data?.items ?? []);
  const inventory = inventoryQuery.data?.current ?? [];
  const health = quotesQuery.data?.exchangeHealth ?? [];
  const config = quotesQuery.data?.config ?? null;
  const connected = quotesQuery.data?.connected ?? false;
  const pendingPair = pairActionMutation.variables?.pair ?? null;
  const quoteHistoryEntries = quotesQuery.data?.quoteHistory ?? [];

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{bot.name}</h2>
          <p className="text-xs text-slate-400">
            WS: {bot.wsUrl} | API: {bot.httpUrl}
          </p>
        </div>
        <Badge tone={connected ? 'success' : 'danger'}>
          {connected ? 'connected' : 'disconnected'}
        </Badge>
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
        <QuoteHistorySection entries={quoteHistoryEntries} />
        <ConfigPanelSection
          config={config}
          saving={configMutation.isPending}
          onSubmit={(next) => configMutation.mutate(next)}
        />
      </div>

      <ExchangeHealthSection health={health} />

      {quotesQuery.isError ? (
        <Card>
          <CardContent className="py-4 text-sm text-red-300">
            Failed to load bot quotes stream.
          </CardContent>
        </Card>
      ) : null}
    </section>
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
