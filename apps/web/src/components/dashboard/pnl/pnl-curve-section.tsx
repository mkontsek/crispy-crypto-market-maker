'use client';

import { useState, type FC } from 'react';

import type { PnLSnapshot } from '@crispy/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon } from '@/components/dashboard/live-quotes/info-icon';
import { priceFromFp } from '@/lib/fixed-point';
import { MetricCard } from '../metric-card';
import { PnlChart } from './pnl-chart';
import { PnlCurveInfoDialog } from './pnl-curve-info-dialog';

type PnlCurveSectionProps = { pnl: PnLSnapshot[]; loading: boolean };

export const PnlCurveSection: FC<PnlCurveSectionProps> = ({ pnl, loading }) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const values = pnl.map((p) => priceFromFp(p.totalPnl)).reverse();

    const current = values[values.length - 1] ?? 0;
    const peak = values.length > 0 ? Math.max(...values) : 0;
    const drawdown = current - peak;
    const drawdownPct =
        peak !== 0 ? ((drawdown / Math.abs(peak)) * 100).toFixed(1) : '0.0';

    const realizedLatest = pnl[0] ? priceFromFp(pnl[0].realizedSpread) : 0;
    const hedgingLatest = pnl[0] ? priceFromFp(pnl[0].hedgingCosts) : 0;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="inline-flex items-center gap-2">
                        <CardTitle>Intraday P&L Curve</CardTitle>
                        <button
                            type="button"
                            onClick={() => setInfoOpen(true)}
                            className="text-slate-500 transition hover:text-slate-300"
                            aria-label="P&L curve section information"
                        >
                            <InfoIcon />
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading && pnl.length === 0 && (
                        <div className="space-y-3">
                            <Skeleton className="h-[100px] w-full" />
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full" />
                                ))}
                            </div>
                        </div>
                    )}
                    {!loading && pnl.length === 0 && (
                        <p className="text-sm text-slate-400">
                            No P&L data available yet.
                        </p>
                    )}
                    {pnl.length > 0 && (
                        <>
                            <PnlChart values={values} />
                            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                <MetricCard
                                    label="Current P&L"
                                    value={current.toFixed(2)}
                                    positive={current >= 0}
                                />
                                <MetricCard
                                    label="Peak P&L"
                                    value={peak.toFixed(2)}
                                    positive={peak >= 0}
                                />
                                <MetricCard
                                    label="Drawdown"
                                    value={`${drawdown.toFixed(2)} (${drawdownPct}%)`}
                                    positive={drawdown >= 0}
                                />
                                <MetricCard
                                    label="Snapshots"
                                    value={String(pnl.length)}
                                    positive={true}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <MetricCard
                                    label="Realized Spread"
                                    value={realizedLatest.toFixed(4)}
                                    positive={realizedLatest >= 0}
                                />
                                <MetricCard
                                    label="Hedging Costs"
                                    value={hedgingLatest.toFixed(4)}
                                    positive={hedgingLatest <= 0}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <PnlCurveInfoDialog
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
            />
        </>
    );
};
