'use client';

import { useState, type FC } from 'react';

import type { Fill } from '@crispy/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoIcon } from '@/components/dashboard/live-quotes/info-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { priceFromFp } from '@/lib/fixed-point';
import { MetricCard } from './metric-card';
import { FillMetricsInfoDialog } from './fill-metrics-info-dialog';

import type { QuoteHistoryEntry } from './quote-history-section';

type FillMetricsSectionProps = {
    fills: Fill[];
    quoteHistory: QuoteHistoryEntry[];
    loading: boolean;
};

export const FillMetricsSection: FC<FillMetricsSectionProps> = ({
    fills,
    quoteHistory,
    loading,
}) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const total = fills.length;
    const taker = fills.filter((f) => f.adverseSelection).length;
    const maker = total - taker;

    const pct = (n: number) =>
        total > 0 ? ((n / total) * 100).toFixed(1) : '0.0';

    const filled = quoteHistory.filter((q) => q.status === 'filled').length;
    const expired = quoteHistory.filter((q) => q.status === 'expired').length;
    const cancelToTrade = filled > 0 ? (expired / filled).toFixed(2) : 'N/A';

    const wins = fills.filter((f) => priceFromFp(f.realizedSpread) > 0).length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';

    const avgSpread =
        total > 0
            ? (
                  fills.reduce(
                      (sum, f) => sum + priceFromFp(f.realizedSpread),
                      0
                  ) / total
              ).toFixed(4)
            : '0.0000';

    const pairCounts = new Map<string, number>();
    for (const fill of fills) {
        pairCounts.set(fill.pair, (pairCounts.get(fill.pair) ?? 0) + 1);
    }

    const buys = fills.filter((f) => f.side === 'buy').length;
    const sells = total - buys;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="inline-flex items-center gap-2">
                        <CardTitle>Fill Metrics & Execution Quality</CardTitle>
                        <button
                            type="button"
                            onClick={() => setInfoOpen(true)}
                            className="text-slate-500 transition hover:text-slate-300"
                            aria-label="Fill metrics section information"
                        >
                            <InfoIcon />
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading && fills.length === 0 && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full" />
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full" />
                                ))}
                            </div>
                        </div>
                    )}
                    {!loading && fills.length === 0 && (
                        <p className="text-sm text-slate-400">
                            No fill data available yet.
                        </p>
                    )}
                    {fills.length > 0 && (
                        <>
                            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                <MetricCard
                                    label="Total Fills"
                                    value={String(total)}
                                />
                                <MetricCard
                                    label="Maker (passive)"
                                    value={`${maker} (${pct(maker)}%)`}
                                />
                                <MetricCard
                                    label="Taker (aggressive)"
                                    value={`${taker} (${pct(taker)}%)`}
                                />
                                <MetricCard
                                    label="Win Rate"
                                    value={`${winRate}%`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                <MetricCard
                                    label="Cancel-to-Trade"
                                    value={cancelToTrade}
                                />
                                <MetricCard
                                    label="Avg Realized Spread"
                                    value={avgSpread}
                                />
                                <MetricCard
                                    label="Buys"
                                    value={String(buys)}
                                />
                                <MetricCard
                                    label="Sells"
                                    value={String(sells)}
                                />
                            </div>
                            {pairCounts.size > 0 && (
                                <div>
                                    <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                                        Fills per Pair
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[...pairCounts.entries()].map(
                                            ([pair, count]) => (
                                                <div
                                                    key={pair}
                                                    className="rounded border border-slate-800 px-3 py-1 text-sm"
                                                >
                                                    <span className="font-medium">
                                                        {pair}
                                                    </span>
                                                    <span className="ml-1 text-slate-400">
                                                        {count}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                                    Quote outcomes — {filled} filled /{' '}
                                    {expired} expired
                                </div>
                                {filled + expired > 0 && (
                                    <div className="h-2 overflow-hidden rounded bg-slate-800">
                                        <div
                                            className="h-2 bg-emerald-500"
                                            style={{
                                                width: `${((filled / (filled + expired)) * 100).toFixed(1)}%`,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <FillMetricsInfoDialog
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
            />
        </>
    );
};
