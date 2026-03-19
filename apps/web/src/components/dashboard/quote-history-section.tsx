'use client';

import { useState, type FC } from 'react';

import type { QuoteSnapshot } from '@crispy/shared';

import { InfoIcon } from '@/components/dashboard/live-quotes/info-icon';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { priceFromFp } from '@/lib/fixed-point';
import { QuoteHistoryInfoDialog } from './quote-history-info-dialog';
import { QuoteHistoryStatusInfoDialog } from './quote-history-status-info-dialog';

export type QuoteHistoryEntry = QuoteSnapshot & {
    status: 'filled' | 'expired';
    timestamp: string;
};

type QuoteHistorySectionProps = { entries: QuoteHistoryEntry[]; loading: boolean; stale: boolean };

export const QuoteHistorySection: FC<QuoteHistorySectionProps> = ({
    entries,
    loading,
    stale,
}) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const [statusInfoOpen, setStatusInfoOpen] = useState(false);

    const openInfo = () => setInfoOpen(true);
    const closeInfo = () => setInfoOpen(false);
    const openStatusInfo = () => setStatusInfoOpen(true);
    const closeStatusInfo = () => setStatusInfoOpen(false);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="inline-flex items-center gap-2">
                        <CardTitle>Quote History</CardTitle>
                        <button
                            type="button"
                            onClick={openInfo}
                            className="text-slate-500 transition hover:text-slate-300"
                            aria-label="Quote history section information"
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
                <CardContent className="h-[800px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-400">
                            <tr>
                                <th className="py-2">Pair</th>
                                <th className="py-2">Bid</th>
                                <th className="py-2">Ask</th>
                                <th className="py-2">Spread</th>
                                <th className="py-2">Skew</th>
                                <th className="py-2">
                                    <span className="inline-flex items-center gap-1">
                                        Status
                                        <button
                                            type="button"
                                            onClick={openStatusInfo}
                                            className="text-slate-500 transition hover:text-slate-300"
                                            aria-label="Quote history status information"
                                        >
                                            <InfoIcon />
                                        </button>
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && entries.length === 0 && Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-t border-slate-800">
                                    {Array.from({ length: 6 }).map((__, j) => (
                                        <td key={j} className="py-2 pr-4">
                                            <Skeleton className="h-4 w-14" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {!loading && entries.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-4 text-center text-sm text-slate-400">
                                        No quote history yet.
                                    </td>
                                </tr>
                            )}
                            {entries.slice(0, 40).map((entry, index) => (
                                <tr
                                    key={`${entry.pair}-${entry.timestamp}-${index}`}
                                    className="border-t border-slate-800"
                                >
                                    <td className="py-2">{entry.pair}</td>
                                    <td className="py-2">
                                        {priceFromFp(entry.bid).toFixed(2)}
                                    </td>
                                    <td className="py-2">
                                        {priceFromFp(entry.ask).toFixed(2)}
                                    </td>
                                    <td className="py-2">
                                        {priceFromFp(entry.spreadBps).toFixed(
                                            2
                                        )}
                                    </td>
                                    <td className="py-2">
                                        {priceFromFp(
                                            entry.inventorySkew
                                        ).toFixed(3)}
                                    </td>
                                    <td className="py-2">
                                        <Badge
                                            tone={
                                                entry.status === 'filled'
                                                    ? 'success'
                                                    : 'default'
                                            }
                                        >
                                            {entry.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
            <QuoteHistoryInfoDialog
                open={infoOpen}
                onClose={closeInfo}
            />
            <QuoteHistoryStatusInfoDialog
                open={statusInfoOpen}
                onClose={closeStatusInfo}
            />
        </>
    );
};
