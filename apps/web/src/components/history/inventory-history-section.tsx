'use client';

import type { FC } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    inventorySkewColor,
    inventorySkewWidth,
} from '@/lib/inventory-skew-service';
import { SortTh } from '@/components/history/sort-th';
import { useTableSort } from '@/lib/use-table-sort';

export type DbInventory = {
    id: string;
    botId: string | null;
    pair: string;
    inventory: number;
    normalizedSkew: number;
    createdAt: string;
};

type PairTableProps = { pair: string; history: DbInventory[] };

const PairTable: FC<PairTableProps> = ({ pair, history }) => {
    const latest = history[0];
    const { sort, toggle, sorted } = useTableSort(history, 'createdAt', 'desc');
    const thProps = (col: string) => ({
        col,
        activeCol: sort.col,
        dir: sort.dir,
        onSort: toggle,
    });
    if (!latest) return null;
    return (
        <div className="rounded border border-slate-800 p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">{pair}</span>
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
                            <SortTh
                                label="Time"
                                {...thProps('createdAt')}
                                className="py-1 pr-3"
                            />
                            <SortTh
                                label="Inventory"
                                {...thProps('inventory')}
                                className="py-1 pr-3"
                            />
                            <SortTh
                                label="Skew"
                                {...thProps('normalizedSkew')}
                                className="py-1"
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-slate-800/30"
                            >
                                <td className="py-1 pr-3 font-mono text-slate-400">
                                    {new Date(
                                        row.createdAt,
                                    ).toLocaleTimeString()}
                                </td>
                                <td className="py-1 pr-3 font-mono">
                                    {row.inventory.toFixed(4)}
                                </td>
                                <td className="py-1 font-mono">
                                    {row.normalizedSkew.toFixed(3)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

type InventoryHistorySectionProps = {
    rows: DbInventory[];
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
};

export const InventoryHistorySection: FC<InventoryHistorySectionProps> = ({
    rows,
    total,
    page,
    pageSize,
    onPageChange,
}) => {
    const byPair = rows.reduce<Record<string, DbInventory[]>>((acc, row) => {
        acc[row.pair] = acc[row.pair] ?? [];
        acc[row.pair].push(row);
        return acc;
    }, {});

    const pairs = Object.keys(byPair).sort();
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Inventory History ({total} snapshots stored)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {pairs.length === 0 && (
                    <p className="text-sm text-slate-400">
                        No inventory snapshots stored yet.
                    </p>
                )}
                {pairs.length > 0 && pairs.map((pair) => (
                    <PairTable
                        key={pair}
                        pair={pair}
                        history={byPair[pair] ?? []}
                    />
                ))}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                        <span className="text-xs text-slate-400">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => onPageChange(page - 1)}
                                className="rounded border border-slate-700 px-3 py-1 text-xs disabled:opacity-40 hover:bg-slate-800"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => onPageChange(page + 1)}
                                className="rounded border border-slate-700 px-3 py-1 text-xs disabled:opacity-40 hover:bg-slate-800"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
