'use client';

import type { FC } from 'react';
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

import { AlertPanelSection } from '@/components/dashboard/alert-panel-section';
import { ConfigPanelSection } from '@/components/dashboard/config-panel-section';
import { EventLogSection } from '@/components/dashboard/event-log-section';
import { ExchangeHealthSection } from '@/components/dashboard/exchange-health-section';
import { ExposureSection } from '@/components/dashboard/exposure-section';
import { FillMetricsSection } from '@/components/dashboard/fill-metrics-section';
import { InventoryMonitorSection } from '@/components/dashboard/inventory-monitor-section';
import { KillSwitchSection } from '@/components/dashboard/kill-switch-section';
import { LiveQuotesSection } from '@/components/dashboard/live-quotes-section';
import { PnlCurveSection } from '@/components/dashboard/pnl-curve-section';
import {
  QuoteHistorySection,
  type QuoteHistoryEntry,
} from '@/components/dashboard/quote-history-section';
import { PnlPerformanceSection } from '@/components/dashboard/pnl-performance-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchJson } from '@/lib/fetch-json';
import { dedupeFills, dedupePnl } from '@/lib/bot-data-service';

type QuotesResponse = {
  botId: BotId;
  connected: boolean;
  updatedAt: string | null;
  quotes: QuoteSnapshot[];
  quoteHistory: QuoteHistoryEntry[];
  exchangeHealth: ExchangeHealth[];
  config: MMConfig | null;
  killSwitchEngaged: boolean;
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

type BotDashboardPanelProps = { bot: TopologyBot };

export const BotDashboardPanel: FC<BotDashboardPanelProps> = ({ bot }) => {
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
      if (!response.ok) throw new Error('failed to update engine config');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes', bot.id] }),
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
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paused }) }
        );
        if (!response.ok) throw new Error('failed to update pair pause status');
        return response.json();
      }
      const response = await fetch(`/api/hedge?botId=${botQuery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair }),
      });
      if (!response.ok) throw new Error('failed to hedge pair');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', bot.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', bot.id] });
      queryClient.invalidateQueries({ queryKey: ['pnl', bot.id] });
      queryClient.invalidateQueries({ queryKey: ['fills', bot.id] });
    },
  });

  const killSwitchMutation = useMutation({
    mutationFn: async (engaged: boolean) => {
      const response = await fetch(`/api/kill-switch?botId=${botQuery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engaged }),
      });
      if (!response.ok) throw new Error('failed to toggle kill switch');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes', bot.id] }),
  });

  const quotes = quotesQuery.data?.quotes ?? [];
  const fills = dedupeFills(fillsQuery.data?.items ?? []);
  const pnl = dedupePnl(pnlQuery.data?.items ?? []);
  const inventory = inventoryQuery.data?.current ?? [];
  const health = quotesQuery.data?.exchangeHealth ?? [];
  const config = quotesQuery.data?.config ?? null;
  const connected = quotesQuery.data?.connected ?? false;
  const killSwitchEngaged = quotesQuery.data?.killSwitchEngaged ?? false;
  const pendingPair = pairActionMutation.variables?.pair ?? null;
  const quoteHistoryEntries = quotesQuery.data?.quoteHistory ?? [];
  const latestPnl = pnl[0] ?? null;

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

      <KillSwitchSection
        engaged={killSwitchEngaged}
        pending={killSwitchMutation.isPending}
        onToggle={(engaged) => killSwitchMutation.mutate(engaged)}
      />

      <AlertPanelSection
        health={health}
        inventory={inventory}
        config={config}
        pnl={latestPnl}
        killSwitchEngaged={killSwitchEngaged}
        quotes={quotes}
      />

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

      <ExposureSection inventory={inventory} quotes={quotes} config={config} />

      <div className="grid gap-4 xl:grid-cols-2">
        <FillMetricsSection fills={fills} quoteHistory={quoteHistoryEntries} />
        <PnlCurveSection pnl={pnl} />
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

      <EventLogSection
        connected={connected}
        quotes={quotes}
        killSwitchEngaged={killSwitchEngaged}
      />

      {quotesQuery.isError ? (
        <Card>
          <CardContent className="py-4 text-sm text-red-300">
            Failed to load bot quotes stream.
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
};


