'use client';

import type { FC } from 'react';
import { useState } from 'react';

import type { QuoteSnapshot } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { priceFromFp } from '@/lib/fixed-point';
import { InfoIcon } from './info-icon';
import { LiveQuotesInfoDialog } from './live-quotes-info-dialog';
import { StateInfoDialog } from './state-info-dialog';

type LiveQuotesSectionProps = {
    quotes: QuoteSnapshot[];
    connected: boolean;
    loading: boolean;
};

export const LiveQuotesSection: FC<LiveQuotesSectionProps> = ({
    quotes,
    connected,
    loading,
}) => {
    const [sectionInfoOpen, setSectionInfoOpen] = useState(false);
    const [stateInfoOpen, setStateInfoOpen] = useState(false);

    const openSectionInfo = () => setSectionInfoOpen(true);
    const closeSectionInfo = () => setSectionInfoOpen(false);
    const openStateInfo = () => setStateInfoOpen(true);
    const closeStateInfo = () => setStateInfoOpen(false);

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                        <CardTitle>Live Quoting Dashboard</CardTitle>
                        <button
                            type="button"
                            onClick={openSectionInfo}
                            className="text-slate-500 transition hover:text-slate-300"
                            aria-label="Live quoting section information"
                        >
                            <InfoIcon />
                        </button>
                    </div>
                    <Badge tone={connected ? 'success' : 'danger'}>
                        {connected ? 'stream connected' : 'stream disconnected'}
                    </Badge>
                </CardHeader>
                <CardContent className="h-64 overflow-auto">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="text-left text-slate-400">
                            <tr>
                                <th className="py-2">Pair</th>
                                <th className="py-2">Bid</th>
                                <th className="py-2">Ask</th>
                                <th className="py-2">Mid</th>
                                <th className="py-2">Spread (bps)</th>
                                <th className="py-2">Skew</th>
                                <th className="py-2">Refresh / sec</th>
                                <th className="py-2">
                                    <span className="inline-flex items-center gap-1">
                                        State
                                        <button
                                            onClick={openStateInfo}
                                            className="text-slate-500 hover:text-slate-300 transition"
                                            aria-label="State information"
                                        >
                                            <InfoIcon />
                                        </button>
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && quotes.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="border-t border-slate-800">
                                    {Array.from({ length: 8 }).map((__, j) => (
                                        <td key={j} className="py-2 pr-4">
                                            <Skeleton className="h-4 w-16" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {!loading && quotes.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-4 text-center text-sm text-slate-400">
                                        {connected ? 'No quotes available.' : 'Waiting for bot data…'}
                                    </td>
                                </tr>
                            )}
                            {quotes.map((quote) => {
                                const skewVal = priceFromFp(
                                    quote.inventorySkew
                                );
                                const skewColor =
                                    Math.abs(skewVal) < 0.001
                                        ? 'text-slate-300'
                                        : skewVal > 0
                                          ? 'text-emerald-400'
                                          : 'text-amber-400';
                                return (
                                    <tr
                                        key={quote.pair}
                                        className="border-t border-slate-800"
                                    >
                                        <td className="py-2 font-medium">
                                            {quote.pair}
                                        </td>
                                        <td className="py-2">
                                            {priceFromFp(quote.bid).toFixed(2)}
                                        </td>
                                        <td className="py-2">
                                            {priceFromFp(quote.ask).toFixed(2)}
                                        </td>
                                        <td className="py-2">
                                            {priceFromFp(quote.mid).toFixed(2)}
                                        </td>
                                        <td className="py-2">
                                            {priceFromFp(
                                                quote.spreadBps
                                            ).toFixed(2)}
                                        </td>
                                        <td
                                            className={`py-2 font-mono ${skewColor}`}
                                        >
                                            {skewVal.toFixed(3)}
                                        </td>
                                        <td className="py-2">
                                            {priceFromFp(
                                                quote.quoteRefreshRate
                                            ).toFixed(2)}
                                        </td>
                                        <td className="py-2">
                                            <Badge
                                                tone={
                                                    quote.paused
                                                        ? 'warning'
                                                        : 'success'
                                                }
                                            >
                                                {quote.paused
                                                    ? 'paused'
                                                    : 'quoting'}
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
            <LiveQuotesInfoDialog
                open={sectionInfoOpen}
                onClose={closeSectionInfo}
            />
            <StateInfoDialog
                open={stateInfoOpen}
                onClose={closeStateInfo}
            />
        </>
    );
};
