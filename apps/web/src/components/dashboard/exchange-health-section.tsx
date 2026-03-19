'use client';

import { useState, type FC } from 'react';

import type { ExchangeHealth } from '@crispy/shared';

import { InfoIcon } from '@/components/dashboard/live-quotes/info-icon';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { priceFromFp } from '@/lib/fixed-point';
import { ExchangeHealthInfoDialog } from './exchange-health-info-dialog';

type ExchangeHealthSectionProps = { health: ExchangeHealth[]; loading: boolean; stale: boolean };

export const ExchangeHealthSection: FC<ExchangeHealthSectionProps> = ({
    health,
    loading,
    stale,
}) => {
    const [infoOpen, setInfoOpen] = useState(false);

    const openInfo = () => setInfoOpen(true);
    const closeInfo = () => setInfoOpen(false);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="inline-flex items-center gap-2">
                        <CardTitle>Exchange Connectivity (via Bot)</CardTitle>
                        <button
                            type="button"
                            onClick={openInfo}
                            className="text-slate-500 transition hover:text-slate-300"
                            aria-label="Exchange connectivity section information"
                        >
                            <InfoIcon />
                        </button>
                        {stale && (
                            <span
                                className="text-amber-400"
                                title="Stale data - showing last known values"
                                role="status"
                                aria-label="Stale data - reconnecting"
                            >
                                !
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="h-64 overflow-auto">
                    <table className="w-full min-w-[620px] text-sm">
                        <thead className="text-left text-slate-400">
                            <tr>
                                <th className="py-2">Pair</th>
                                <th className="py-2">Exchange</th>
                                <th className="py-2">Tick latency (ms)</th>
                                <th className="py-2">Feed staleness (ms)</th>
                                <th className="py-2">Connectivity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && health.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="border-t border-slate-800">
                                    {Array.from({ length: 5 }).map((__, j) => (
                                        <td key={j} className="py-2 pr-4">
                                            <Skeleton className="h-4 w-16" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {!loading && health.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-sm text-slate-400">
                                        No exchange health data available.
                                    </td>
                                </tr>
                            )}
                            {health.map((entry) => (
                                <tr
                                    key={`${entry.pair}-${entry.exchange}`}
                                    className="border-t border-slate-800"
                                >
                                    <td className="py-2">{entry.pair}</td>
                                    <td className="py-2">{entry.exchange}</td>
                                    <td className="py-2">
                                        {priceFromFp(
                                            entry.tickLatencyMs
                                        ).toFixed(1)}
                                    </td>
                                    <td className="py-2">
                                        {priceFromFp(
                                            entry.feedStalenessMs
                                        ).toFixed(1)}
                                    </td>
                                    <td className="py-2">
                                        <Badge
                                            tone={
                                                entry.connected
                                                    ? 'success'
                                                    : 'danger'
                                            }
                                        >
                                            {entry.connected
                                                ? 'healthy'
                                                : 'stale'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
            <ExchangeHealthInfoDialog
                open={infoOpen}
                onClose={closeInfo}
            />
        </>
    );
};
