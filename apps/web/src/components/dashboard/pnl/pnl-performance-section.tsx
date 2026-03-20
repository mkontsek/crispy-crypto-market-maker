'use client';

import { useState, type FC } from 'react';

import type { BotId, PnLSnapshot } from '@crispy/shared';

import { InfoIcon } from '@/components/dashboard/live-quotes/info-icon';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dedupeFills } from '@/lib/bot-data-service';
import { priceFromFp, ratioFromDecimal, sizeFromFp } from '@/lib/fixed-point';
import { nanosToTime } from '@/lib/timestamp';
import { MetricCard } from '../metric-card';
import { PnlPerformanceInfoDialog } from './pnl-performance-info-dialog';
import { useBotFillsQuery } from './use-bot-fills-query';

type PnlPerformanceSectionProps = {
    botId: BotId;
    pnl: PnLSnapshot[];
    loading: boolean;
};

export const PnlPerformanceSection: FC<PnlPerformanceSectionProps> = ({
    botId,
    pnl,
    loading,
}) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const fillsQuery = useBotFillsQuery(botId);
    const fills = dedupeFills(fillsQuery.data?.items ?? []);
    const isLoading = loading || fillsQuery.isLoading;
    const latest = pnl[0];
    const totalFills = fills.length;
    const adverseFills = fills.filter((f) => f.adverseSelection).length;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="inline-flex items-center gap-2">
                        <CardTitle>PnL & Performance Analytics</CardTitle>
                        <button
                            type="button"
                            onClick={() => setInfoOpen(true)}
                            className="text-slate-500 transition hover:text-slate-300"
                            aria-label="P&L performance section information"
                        >
                            <InfoIcon />
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading && pnl.length === 0 && fills.length === 0 ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full" />
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full" />
                                ))}
                            </div>
                            <div className="space-y-1">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-full" />
                                ))}
                            </div>
                        </div>
                    ) : !isLoading && pnl.length === 0 && fills.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            No performance data available yet.
                        </p>
                    ) : (
                        <>
                    {latest && (
                        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                            <MetricCard
                                label="Total PnL"
                                value={priceFromFp(latest.totalPnl).toFixed(2)}
                            />
                            <MetricCard
                                label="Realized Spread"
                                value={priceFromFp(
                                    latest.realizedSpread
                                ).toFixed(2)}
                            />
                            <MetricCard
                                label="Fill Rate"
                                value={`${(ratioFromDecimal(latest.fillRate) * 100).toFixed(1)}%`}
                            />
                            <MetricCard
                                label="Adverse Selection"
                                value={`${(ratioFromDecimal(latest.adverseSelectionRate) * 100).toFixed(1)}%`}
                            />
                            <MetricCard
                                label="Hedging Costs"
                                value={priceFromFp(latest.hedgingCosts).toFixed(
                                    2
                                )}
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <MetricCard
                            label="Total Fills"
                            value={String(totalFills)}
                        />
                        <MetricCard
                            label="Adverse Fills"
                            value={String(adverseFills)}
                        />
                        <MetricCard
                            label="Clean Fills"
                            value={String(totalFills - adverseFills)}
                        />
                    </div>
                    <div>
                        <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                            Latest fills
                        </div>
                        <div className="h-[280px] space-y-1 overflow-y-auto">
                            {fills.slice(0, 10).map((fill) => (
                                <div
                                    key={fill.id}
                                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded border border-slate-800 px-3 py-2 text-sm"
                                >
                                    <span className="font-mono text-xs text-slate-400">
                                        {nanosToTime(fill.timestamp)}
                                    </span>
                                    <span>
                                        {fill.pair} {fill.side.toUpperCase()} @{' '}
                                        {priceFromFp(fill.price).toFixed(2)} (
                                        {sizeFromFp(fill.size).toFixed(3)})
                                    </span>
                                    <span className="flex items-center gap-2">
                                        spread{' '}
                                        {priceFromFp(
                                            fill.realizedSpread
                                        ).toFixed(4)}
                                        <Badge
                                            tone={
                                                fill.adverseSelection
                                                    ? 'danger'
                                                    : 'success'
                                            }
                                        >
                                            {fill.adverseSelection
                                                ? 'adverse'
                                                : 'clean'}
                                        </Badge>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <PnlPerformanceInfoDialog
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
            />
        </>
    );
};
