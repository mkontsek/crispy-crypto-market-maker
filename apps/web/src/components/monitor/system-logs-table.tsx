'use client';

import type { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SortTh } from '@/components/history/sort-th';
import { useTableSort } from '@/lib/use-table-sort';
import type { DbSystemLog } from './use-system-logs-query';

type LevelBadgeProps = { level: DbSystemLog['level'] };

const LevelBadge: FC<LevelBadgeProps> = ({ level }) => {
    const tone =
        level === 'error' ? 'danger' : level === 'warn' ? 'warning' : 'default';
    return <Badge tone={tone}>{level}</Badge>;
};

type SystemLogsTableProps = {
    logs: DbSystemLog[];
    total: number;
    page: number;
    pageSize: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
};

export const SystemLogsTable: FC<SystemLogsTableProps> = ({
    logs,
    total,
    page,
    pageSize,
    isLoading,
    onPageChange,
}) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const { sort, toggle, sorted } = useTableSort(logs, 'createdAt', 'desc');
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
                <CardTitle>System Logs ({total} total)</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                    {isLoading && <Badge tone="warning">Loading…</Badge>}
                    {!isLoading && <Badge tone="success">Loaded</Badge>}
                    <Badge tone="default">Auto-refreshes every 5s</Badge>
                </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                    <thead className="border-b border-slate-800 text-left text-slate-400">
                        <tr>
                            <SortTh label="Time" {...thProps('createdAt')} />
                            <SortTh label="Bot" {...thProps('botId')} />
                            <SortTh label="Level" {...thProps('level')} />
                            <th className="px-4 py-3">Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-6 text-center text-slate-400"
                                >
                                    No system logs stored yet. Start the bot to
                                    generate events.
                                </td>
                            </tr>
                        )}
                        {logs.length > 0 &&
                            sorted.map((log) => (
                                <tr
                                    key={log.id}
                                    className="border-b border-slate-800/50 hover:bg-slate-900/50"
                                >
                                    <td className="px-4 py-2 font-mono text-xs text-slate-400 whitespace-nowrap">
                                        {new Date(
                                            log.createdAt
                                        ).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-slate-400">
                                        {log.botId ?? '—'}
                                    </td>
                                    <td className="px-4 py-2">
                                        <LevelBadge level={log.level} />
                                    </td>
                                    <td className="px-4 py-2 text-slate-200">
                                        {log.message}
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
