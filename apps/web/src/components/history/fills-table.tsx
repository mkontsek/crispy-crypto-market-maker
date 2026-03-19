'use client';

import type { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SortTh } from '@/components/history/sort-th';
import { useTableSort } from '@/lib/use-table-sort';

export type DbFill = {
    id: string;
    botId: string | null;
    pair: string;
    side: string;
    price: number;
    size: number;
    midAtFill: number;
    realizedSpread: number;
    adverseSelection: boolean;
    createdAt: string;
};

type FillsTableProps = {
    fills: DbFill[];
    total: number;
    page: number;
    pageSize: number;
    isLoading: boolean;
    deleteAllHistoryPending: boolean;
    deleteAllHistoryError: boolean;
    onDeleteAllHistory: () => void;
    onPageChange: (page: number) => void;
};

export const FillsTable: FC<FillsTableProps> = ({
    fills,
    total,
    page,
    pageSize,
    isLoading,
    deleteAllHistoryPending,
    deleteAllHistoryError,
    onDeleteAllHistory,
    onPageChange,
}) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const { sort, toggle, sorted } = useTableSort(fills, 'createdAt', 'desc');
    const thProps = (col: string) => ({
        col,
        activeCol: sort.col,
        dir: sort.dir,
        onSort: toggle,
        className: 'px-4 py-3',
    });

    const goToPrevPage = () => onPageChange(page - 1);
    const goToNextPage = () => onPageChange(page + 1);

    return (
        <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Fill History ({total} total)</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                    {isLoading && <Badge tone="warning">Loading…</Badge>}
                    {!isLoading && <Badge tone="success">Loaded</Badge>}
                    <Badge tone="default">Auto-refreshes every 5s</Badge>
                    <Button
                        className="h-5"
                        variant="danger"
                        disabled={deleteAllHistoryPending}
                        onClick={onDeleteAllHistory}
                    >
                        {deleteAllHistoryPending
                            ? 'Deleting…'
                            : 'Delete all history'}
                    </Button>
                    {deleteAllHistoryError && (
                        <Badge tone="danger">Delete failed</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                    <thead className="border-b border-slate-800 text-left text-slate-400">
                        <tr>
                            <SortTh label="Time" {...thProps('createdAt')} />
                            <SortTh label="Bot" {...thProps('botId')} />
                            <SortTh label="Pair" {...thProps('pair')} />
                            <SortTh label="Side" {...thProps('side')} />
                            <SortTh label="Price" {...thProps('price')} />
                            <SortTh label="Size" {...thProps('size')} />
                            <SortTh label="Spread" {...thProps('realizedSpread')} />
                            <SortTh label="Adverse" {...thProps('adverseSelection')} />
                        </tr>
                    </thead>
                    <tbody>
                        {fills.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-6 text-center text-slate-400"
                                >
                                    No fills stored yet. Start the bot to
                                    generate data.
                                </td>
                            </tr>
                        )}
                        {fills.length > 0 && sorted.map((fill) => (
                            <tr
                                key={fill.id}
                                className="border-b border-slate-800/50 hover:bg-slate-900/50"
                            >
                                <td className="px-4 py-2 font-mono text-xs text-slate-400">
                                    {new Date(
                                        fill.createdAt
                                    ).toLocaleTimeString()}
                                </td>
                                <td className="px-4 py-2 text-xs text-slate-400">
                                    {fill.botId ?? '—'}
                                </td>
                                <td className="px-4 py-2 font-medium">
                                    {fill.pair}
                                </td>
                                <td className="px-4 py-2">
                                    <Badge tone={fill.side === 'buy' ? 'success' : 'danger'}>
                                        {fill.side}
                                    </Badge>
                                </td>
                                <td className="px-4 py-2 font-mono">
                                    {fill.price.toFixed(2)}
                                </td>
                                <td className="px-4 py-2 font-mono">
                                    {fill.size.toFixed(4)}
                                </td>
                                <td className="px-4 py-2 font-mono">
                                    {fill.realizedSpread.toFixed(4)}
                                </td>
                                <td className="px-4 py-2">
                                    <Badge tone={fill.adverseSelection ? 'danger' : 'success'}>
                                        {fill.adverseSelection ? 'yes' : 'no'}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
                        <span className="text-xs text-slate-400">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={goToPrevPage}
                                className="rounded border border-slate-700 px-3 py-1 text-xs disabled:opacity-40 hover:bg-slate-800"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={goToNextPage}
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
