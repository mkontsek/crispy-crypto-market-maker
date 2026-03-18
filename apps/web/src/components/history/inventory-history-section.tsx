'use client';

import type { FC } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    inventorySkewColor,
    inventorySkewWidth,
} from '@/lib/inventory-skew-service';

export type DbInventory = {
    id: string;
    botId: string | null;
    pair: string;
    inventory: number;
    normalizedSkew: number;
    createdAt: string;
};

type InventoryHistorySectionProps = { rows: DbInventory[] };

export const InventoryHistorySection: FC<InventoryHistorySectionProps> = ({
    rows,
}) => {
    const byPair = rows.reduce<Record<string, DbInventory[]>>((acc, row) => {
        acc[row.pair] = acc[row.pair] ?? [];
        acc[row.pair].push(row);
        return acc;
    }, {});

    const pairs = Object.keys(byPair).sort();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Inventory History ({rows.length} snapshots stored)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {pairs.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        No inventory snapshots stored yet.
                    </p>
                ) : (
                    pairs.map((pair) => {
                        const history = byPair[pair] ?? [];
                        const latest = history[0];
                        if (!latest) return null;
                        return (
                            <div
                                key={pair}
                                className="rounded border border-slate-800 p-3"
                            >
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-semibold">
                                        {pair}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        inventory: {latest.inventory.toFixed(4)}
                                    </span>
                                </div>
                                <div className="mb-3 h-2 w-full overflow-hidden rounded bg-slate-800">
                                    <div
                                        className={`h-full rounded transition-all ${inventorySkewColor(latest.normalizedSkew)} ${inventorySkewWidth(latest.normalizedSkew)}`}
                                    />
                                </div>
                                <div className="max-h-36 overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-slate-950 text-left text-slate-400">
                                            <tr>
                                                <th className="py-1 pr-3">
                                                    Time
                                                </th>
                                                <th className="py-1 pr-3">
                                                    Inventory
                                                </th>
                                                <th className="py-1">Skew</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="border-b border-slate-800/30"
                                                >
                                                    <td className="py-1 pr-3 font-mono text-slate-400">
                                                        {new Date(
                                                            row.createdAt
                                                        ).toLocaleTimeString()}
                                                    </td>
                                                    <td className="py-1 pr-3 font-mono">
                                                        {row.inventory.toFixed(
                                                            4
                                                        )}
                                                    </td>
                                                    <td className="py-1 font-mono">
                                                        {row.normalizedSkew.toFixed(
                                                            3
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
};
