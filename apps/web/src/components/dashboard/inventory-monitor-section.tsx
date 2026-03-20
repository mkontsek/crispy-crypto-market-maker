'use client';

import { useState, type FC } from 'react';

import type { InventorySnapshot, QuoteSnapshot } from '@crispy/shared';

import { InfoIcon } from '@/components/dashboard/live-quotes/info-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ratioFromDecimal, sizeFromFp } from '@/lib/fixed-point';
import {
    inventorySkewColor,
    inventorySkewWidth,
} from '@/lib/inventory-skew-service';
import { InventoryMonitorInfoDialog } from './inventory-monitor-info-dialog';

type InventoryMonitorSectionProps = {
    inventory: InventorySnapshot[];
    quotes: QuoteSnapshot[];
    pendingPair: string | null;
    loading: boolean;
    onTogglePause: (pair: string, paused: boolean) => void;
    onManualHedge: (pair: string) => void;
};

export const InventoryMonitorSection: FC<InventoryMonitorSectionProps> = ({
    inventory,
    quotes,
    pendingPair,
    loading,
    onTogglePause,
    onManualHedge,
}) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const quoteMap = new Map(quotes.map((quote) => [quote.pair, quote]));

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="inline-flex items-center gap-2">
                        <CardTitle>Inventory Monitor</CardTitle>
                        <button
                            type="button"
                            onClick={() => setInfoOpen(true)}
                            className="text-slate-500 transition hover:text-slate-300"
                            aria-label="Inventory monitor section information"
                        >
                            <InfoIcon />
                        </button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[500px] space-y-4 overflow-y-auto">
                    {loading && inventory.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-lg border border-slate-800 p-3 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-2 w-full" />
                            <div className="flex gap-2 mt-3">
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-8 w-24" />
                            </div>
                        </div>
                    ))}
                    {!loading && inventory.length === 0 && (
                        <p className="text-sm text-slate-400">
                            No inventory data available.
                        </p>
                    )}
                    {inventory.map((item) => {
                        const quote = quoteMap.get(item.pair);
                        const normalizedSkew = ratioFromDecimal(
                            item.normalizedSkew
                        );
                        const isBusy = pendingPair === item.pair;

                        return (
                            <div
                                key={item.pair}
                                className="rounded-lg border border-slate-800 p-3"
                            >
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-medium">
                                        {item.pair}
                                    </span>
                                    <span>
                                        inventory{' '}
                                        {sizeFromFp(item.inventory).toFixed(3)}{' '}
                                        | skew {normalizedSkew.toFixed(2)}
                                    </span>
                                </div>
                                <div className="h-2 rounded bg-slate-800">
                                    <div
                                        className={`${inventorySkewColor(normalizedSkew)} ${inventorySkewWidth(normalizedSkew)} h-2 rounded`}
                                    />
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        variant="outline"
                                        disabled={isBusy || !quote}
                                        onClick={() =>
                                            onTogglePause(
                                                item.pair,
                                                !quote?.paused
                                            )
                                        }
                                    >
                                        {quote?.paused
                                            ? 'Resume Pair'
                                            : 'Pause Pair'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={isBusy}
                                        onClick={() => onManualHedge(item.pair)}
                                    >
                                        {isBusy
                                            ? 'Submitting...'
                                            : 'Manual Hedge'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </CardContent>
            </Card>
            <InventoryMonitorInfoDialog
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
            />
        </>
    );
};
