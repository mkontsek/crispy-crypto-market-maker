'use client';

import type { FC } from 'react';
import type { TopologyBot } from '@crispy/shared';
import { useState } from 'react';

import { motion } from 'framer-motion';

import { AlertPanelSection } from '@/components/dashboard/alert-panel-section';
import { RiskSection } from '@/components/dashboard/risk/risk-section';
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
import { StrategySection } from '@/components/dashboard/strategy-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { dedupeFills, dedupePnl } from '@/lib/bot-data-service';
import { priceFromFp } from '@/lib/fixed-point';
import { derivePnlBadge } from '@/lib/pnl-badge-service';
import { cn } from '@/lib/utils';

import { useBotFillsQuery } from './pnl/use-bot-fills-query';
import { useBotInventoryQuery } from './use-bot-inventory-query';
import { useBotPnlQuery } from './use-bot-pnl-query';
import { useBotQuotesQuery } from './use-bot-quotes-query';
import { useConfigMutation } from './use-config-mutation';
import { useKillSwitchMutation } from './use-kill-switch-mutation';
import { usePairActionMutation } from './use-pair-action-mutation';
import { useStrategyMutation } from './use-strategy-mutation';

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
    const strategyMutation = useStrategyMutation(bot.id);

    const quotesLoading = quotesQuery.isLoading;
    const fillsLoading = fillsQuery.isLoading;
    const pnlLoading = pnlQuery.isLoading;
    const inventoryLoading = inventoryQuery.isLoading;

    const quotes = quotesQuery.data?.quotes ?? [];
    const fills = dedupeFills(fillsQuery.data?.items ?? []);
    const pnl = dedupePnl(pnlQuery.data?.items ?? []);
    const inventory = inventoryQuery.data?.current ?? [];
    const health = quotesQuery.data?.exchangeHealth ?? [];
    const config = quotesQuery.data?.config ?? null;
    const connected = quotesQuery.data?.connected ?? false;
    const updatedAt = quotesQuery.data?.updatedAt ?? null;
    const stale = !connected && updatedAt !== null;
    const killSwitchEngaged = quotesQuery.data?.killSwitchEngaged ?? false;
    const serverStrategy = quotesQuery.data?.strategy ?? 'balanced';
    const strategy = serverStrategy;
    const pendingPair = pairActionMutation.variables?.pair ?? null;
    const quoteHistoryEntries = quotesQuery.data?.quoteHistory ?? [];
    const latestPnl = pnl[0] ?? null;
    const currentPnlValue = latestPnl ? priceFromFp(latestPnl.totalPnl) : null;
    const pnlBadge = currentPnlValue !== null ? derivePnlBadge(currentPnlValue) : null;

    return (
        <motion.section
            id={`${bot.id}-section`}
            className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
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
                    {pnlBadge !== null && currentPnlValue !== null && (
                        <Badge tone={pnlBadge.tone}>
                            {pnlBadge.arrow}{' '}
                            {pnlBadge.sign}
                            {currentPnlValue.toFixed(2)}
                        </Badge>
                    )}
                    <button
                        type="button"
                        aria-controls={`${bot.id}-section-content`}
                        aria-expanded={!collapsed}
                        onClick={() =>
                            setCollapsed((isCollapsed) => !isCollapsed)
                        }
                        className={cn(
                            'text-xs text-slate-400 hover:text-slate-200'
                        )}
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
                <StrategySection
                    strategy={strategy}
                    pending={strategyMutation.isPending}
                    connected={connected}
                    onSelect={(next) => strategyMutation.mutate(next)}
                />
                <AlertPanelSection
                    health={health}
                    inventory={inventory}
                    config={config}
                    pnl={latestPnl}
                    killSwitchEngaged={killSwitchEngaged}
                    quotes={quotes}
                />
                <RiskSection
                    inventory={inventory}
                    quotes={quotes}
                    fills={fills}
                    pnl={latestPnl}
                    health={health}
                    config={config}
                    killSwitchEngaged={killSwitchEngaged}
                    connected={connected}
                    stale={stale}
                    loading={quotesLoading || inventoryLoading}
                />
                <LiveQuotesSection
                    quotes={quotes}
                    connected={connected}
                    stale={stale}
                    loading={quotesLoading}
                />
                <div className="grid gap-4 xl:grid-cols-2">
                    <InventoryMonitorSection
                        inventory={inventory}
                        quotes={quotes}
                        pendingPair={pendingPair}
                        loading={inventoryLoading}
                        stale={stale}
                        onTogglePause={(pair, paused) =>
                            pairActionMutation.mutate({
                                pair,
                                action: 'pause',
                                paused,
                            })
                        }
                        onManualHedge={(pair) =>
                            pairActionMutation.mutate({ pair, action: 'hedge' })
                        }
                    />
                    <PnlPerformanceSection
                        botId={bot.id}
                        pnl={pnl}
                        loading={pnlLoading}
                    />
                </div>
                <ExposureSection
                    inventory={inventory}
                    quotes={quotes}
                    config={config}
                    stale={stale}
                    loading={inventoryLoading}
                />
                <div className="grid gap-4 xl:grid-cols-2">
                    <FillMetricsSection
                        fills={fills}
                        quoteHistory={quoteHistoryEntries}
                        loading={fillsLoading}
                    />
                    <PnlCurveSection pnl={pnl} loading={pnlLoading} />
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                    <QuoteHistorySection
                        entries={quoteHistoryEntries}
                        loading={quotesLoading}
                        stale={stale}
                    />
                    <ConfigPanelSection
                        config={config}
                        loading={quotesLoading}
                        saving={configMutation.isPending}
                        onSubmit={(next) => configMutation.mutate(next)}
                    />
                </div>
                <ExchangeHealthSection health={health} loading={quotesLoading} stale={stale} />
                <EventLogSection
                    connected={connected}
                    quotes={quotes}
                    killSwitchEngaged={killSwitchEngaged}
                />
                {quotesQuery.isError && (
                    <Card>
                        <CardContent className="py-4 text-sm text-red-300">
                            Failed to load bot quotes stream.
                        </CardContent>
                    </Card>
                )}
            </div>
        </motion.section>
    );
};
