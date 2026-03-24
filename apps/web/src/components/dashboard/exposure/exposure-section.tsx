import { useState, type FC } from 'react';

import type {
    InventorySnapshot,
    MMConfig,
    QuoteSnapshot,
} from '@crispy/shared';

import { ExposureInfoDialog } from '@/components/dashboard/exposure/exposure-info-dialog';
import { InfoIcon } from '@/components/dashboard/live-quotes/info-icon';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { buildExposureRows, limitTone } from '@/lib/exposure-service';

type ExposureSectionProps = {
    inventory: InventorySnapshot[];
    quotes: QuoteSnapshot[];
    config: MMConfig | null;
    loading: boolean;
};

export const ExposureSection: FC<ExposureSectionProps> = ({
    inventory,
    quotes,
    config,
    loading,
}) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const rows = buildExposureRows(inventory, quotes, config);
    const totalNotional = rows.reduce(
        (sum, r) => sum + Math.abs(r.notional),
        0
    );

    const openInfo = () => setInfoOpen(true);
    const closeInfo = () => setInfoOpen(false);

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                        <CardTitle>Inventory Exposure & Stress Test</CardTitle>
                        <button
                            type="button"
                            onClick={openInfo}
                            className="text-slate-500 transition hover:text-slate-300"
                            aria-label="Inventory exposure section information"
                        >
                            <InfoIcon />
                        </button>
                    </div>
                    <span className="text-xs text-slate-400">
                        Total notional:{' '}
                        <span className="font-mono text-slate-200">
                            {totalNotional.toFixed(2)} USD
                        </span>
                    </span>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead className="text-left text-slate-400">
                            <tr>
                                <th className="py-2">Pair</th>
                                <th className="py-2">Base Qty</th>
                                <th className="py-2">Notional (USD)</th>
                                <th className="py-2">% of Limit</th>
                                <th className="py-2">Concentration</th>
                                <th className="py-2">+5% Stress</th>
                                <th className="py-2">−5% Stress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && rows.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="border-t border-slate-800">
                                    {Array.from({ length: 7 }).map((__, j) => (
                                        <td key={j} className="py-2 pr-4">
                                            <Skeleton className="h-4 w-16" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-4 text-center text-sm text-slate-400">
                                        No exposure data available.
                                    </td>
                                </tr>
                            )}
                            {rows.map((row) => {
                                const concentration =
                                    totalNotional > 0
                                        ? (
                                              (Math.abs(row.notional) /
                                                  totalNotional) *
                                              100
                                          ).toFixed(1)
                                        : '0.0';
                                return (
                                    <tr
                                        key={row.pair}
                                        className="border-t border-slate-800"
                                    >
                                        <td className="py-2 font-medium">
                                            {row.pair}
                                        </td>
                                        <td className="py-2 font-mono">
                                            {row.baseInventory.toFixed(3)}
                                        </td>
                                        <td className="py-2 font-mono">
                                            {row.notional.toFixed(2)}
                                        </td>
                                        <td className="py-2">
                                            <Badge
                                                tone={limitTone(row.pctOfLimit)}
                                            >
                                                {row.pctOfLimit.toFixed(1)}%
                                            </Badge>
                                        </td>
                                        <td className="py-2 font-mono">
                                            {concentration}%
                                        </td>
                                        <td className="py-2 font-mono text-emerald-400">
                                            +{row.stressUp5.toFixed(2)}
                                        </td>
                                        <td className="py-2 font-mono text-red-400">
                                            {row.stressDown5.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
            <ExposureInfoDialog
                open={infoOpen}
                onClose={closeInfo}
            />
        </>
    );
};
