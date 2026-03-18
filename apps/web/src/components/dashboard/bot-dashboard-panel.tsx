'use client';

import type { FC } from 'react';
import type { TopologyBot } from '@crispy/shared';
import { useState } from 'react';

import { AlertPanelSection } from '@/components/dashboard/alert-panel-section';
import { ConfigPanelSection } from '@/components/dashboard/config-panel/config-panel-section';
import { EventLogSection } from '@/components/dashboard/event-log-section';
import { ExchangeHealthSection } from '@/components/dashboard/exchange-health-section';
import { ExposureSection } from '@/components/dashboard/exposure/exposure-section';
import { FillMetricsSection } from '@/components/dashboard/fill-metrics-section';
import { InventoryMonitorSection } from '@/components/dashboard/inventory-monitor-section';
import { KillSwitchSection } from '@/components/dashboard/kill-switch-section';
import { LiveQuotesSection } from '@/components/dashboard/live-quotes/live-quotes-section';
import { PnlCurveSection } from '@/components/dashboard/pnl/pnl-curve-section';
import { QuoteHistorySection } from '@/components/dashboard/quote-history-section';
import { PnlPerformanceSection } from '@/components/dashboard/pnl/pnl-performance-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { dedupeFills, dedupePnl } from '@/lib/bot-data-service';
import { cn } from '@/lib/utils';

import { useBotFillsQuery } from './pnl/use-bot-fills-query';
import { useBotInventoryQuery } from './use-bot-inventory-query';
import { useBotPnlQuery } from './use-bot-pnl-query';
import { useBotQuotesQuery } from './use-bot-quotes-query';
import { useConfigMutation } from './use-config-mutation';
import { useKillSwitchMutation } from './use-kill-switch-mutation';
import { usePairActionMutation } from './use-pair-action-mutation';

type BotDashboardPanelProps = { bot: TopologyBot };

export const BotDashboardPanel: FC<BotDashboardPanelProps> = ({ bot }) => {
  const [collapsed, setCollapsed] = useState(false);

  const quotesQuery = useBotQuotesQuery(bot.id);
  const fillsQuery = useBotFillsQuery(bot.id);
  const pnlQuery = useBotPnlQuery(bot.id);
  const inventoryQuery = useBotInventoryQuery(bot.id);
  const configMutation = useConfigMutation(bot.id);
  const pairActionMutation = usePairActionMutation(bot.id);
  const killSwitchMutation = useKillSwitchMutation(bot.id);

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
    <section id={`${bot.id}-section`} className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{bot.name}</h2>
          <p className="text-xs text-slate-400">
            WS: {bot.wsUrl} | API: {bot.httpUrl}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={connected ? 'success' : 'danger'}>
            {connected ? 'connected' : 'disconnected'}
          </Badge>
          <button
            type="button"
            aria-controls={`${bot.id}-section-content`}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((isCollapsed) => !isCollapsed)}
            className={cn('text-xs text-slate-400 hover:text-slate-200')}
          >
            {collapsed ? '▼ Expand' : '▲ Collapse'}
          </button>
        </div>
      </header>

      <div
        id={`${bot.id}-section-content`}
        className={cn('space-y-4', collapsed && 'hidden')}
      >
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
          <PnlPerformanceSection botId={bot.id} pnl={pnl} />
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
      </div>
    </section>
  );
};
