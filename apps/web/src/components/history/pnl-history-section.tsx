'use client';

import type { FC } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SortTh } from '@/components/history/sort-th';
import { useTableSort } from '@/lib/use-table-sort';

export type DbPnLSnapshot = {
    id: string;
    botId: string | null;
    totalPnl: number;
    realizedSpread: number;
    hedgingCosts: number;
    adverseSelectionRate: number;
    fillRate: number;
    createdAt: string;
};

type PnlHistorySectionProps = { snapshots: DbPnLSnapshot[] };

export const PnlHistorySection: FC<PnlHistorySectionProps> = ({
    snapshots,
}) => {
    const latest = snapshots[0];
    const { sort, toggle, sorted } = useTableSort(
        snapshots,
        'createdAt',
        'desc',
    );
    const thProps = (col: string) => ({
        col,
        activeCol: sort.col,
        dir: sort.dir,
        onSort: toggle,
        className: 'py-2 pr-4',
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    PnL History ({snapshots.length} snapshots stored)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {latest ? (
                    <div>
                        <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                            Latest snapshot —{' '}
                            {new Date(latest.createdAt).toLocaleString()}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                            <MetricCard
                                label="Total PnL"
                                value={latest.totalPnl.toFixed(2)}
                            />
                            <MetricCard
                                label="Realized Spread"
                                value={latest.realizedSpread.toFixed(4)}
                            />
                            <MetricCard
                                label="Fill Rate"
                                value={`${(latest.fillRate * 100).toFixed(1)}%`}
                            />
                            <MetricCard
                                label="Adverse Sel."
                                value={`${(latest.adverseSelectionRate * 100).toFixed(1)}%`}
                            />
                            <MetricCard
                                label="Hedging Costs"
                                value={latest.hedgingCosts.toFixed(4)}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400">
                        No PnL snapshots stored yet.
                    </p>
                )}

                {snapshots.length > 1 && (
                    <div>
                        <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                            Recent snapshots
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-950 text-left text-slate-400">
                                    <tr>
                                        <SortTh label="Time" {...thProps('createdAt')} />
                                        <SortTh label="Bot" {...thProps('botId')} />
                                        <SortTh label="Total PnL" {...thProps('totalPnl')} />
                                        <SortTh label="Fill Rate" {...thProps('fillRate')} />
                                        <SortTh label="Adverse" {...thProps('adverseSelectionRate')} className="py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map((snap) => (
                                        <tr
                                            key={snap.id}
                                            className="border-b border-slate-800/50"
                                        >
                                            <td className="py-1 pr-4 font-mono text-xs text-slate-400">
                                                {new Date(
                                                    snap.createdAt
                                                ).toLocaleTimeString()}
                                            </td>
                                            <td className="py-1 pr-4 text-xs text-slate-400">
                                                {snap.botId ?? '—'}
                                            </td>
                                            <td className="py-1 pr-4 font-mono">
                                                {snap.totalPnl.toFixed(2)}
                                            </td>
                                            <td className="py-1 pr-4 font-mono">
                                                {(snap.fillRate * 100).toFixed(
                                                    1
                                                )}
                                                %
                                            </td>
                                            <td className="py-1 font-mono">
                                                {(
                                                    snap.adverseSelectionRate *
                                                    100
                                                ).toFixed(1)}
                                                %
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
