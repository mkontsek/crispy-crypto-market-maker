'use client';

import type { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  onPageChange: (page: number) => void;
};

export const FillsTable: FC<FillsTableProps> = ({ fills, total, page, pageSize, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fill History ({total} total)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Bot</th>
              <th className="px-4 py-3">Pair</th>
              <th className="px-4 py-3">Side</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Spread</th>
              <th className="px-4 py-3">Adverse</th>
            </tr>
          </thead>
          <tbody>
            {fills.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  No fills stored yet. Start the bot to generate data.
                </td>
              </tr>
            ) : (
              fills.map((fill) => (
                <tr key={fill.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                  <td className="px-4 py-2 font-mono text-xs text-slate-400">
                    {new Date(fill.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-400">{fill.botId ?? '—'}</td>
                  <td className="px-4 py-2 font-medium">{fill.pair}</td>
                  <td className="px-4 py-2">
                    <Badge tone={fill.side === 'buy' ? 'success' : 'danger'}>{fill.side}</Badge>
                  </td>
                  <td className="px-4 py-2 font-mono">{fill.price.toFixed(2)}</td>
                  <td className="px-4 py-2 font-mono">{fill.size.toFixed(4)}</td>
                  <td className="px-4 py-2 font-mono">{fill.realizedSpread.toFixed(4)}</td>
                  <td className="px-4 py-2">
                    <Badge tone={fill.adverseSelection ? 'danger' : 'success'}>
                      {fill.adverseSelection ? 'yes' : 'no'}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
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
