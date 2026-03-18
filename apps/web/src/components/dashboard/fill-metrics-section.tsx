import type { Fill } from '@crispy/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { priceFromFp } from '@/lib/fixed-point';

import type { QuoteHistoryEntry } from './quote-history-section';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

export function FillMetricsSection({
  fills,
  quoteHistory,
}: {
  fills: Fill[];
  quoteHistory: QuoteHistoryEntry[];
}) {
  const total = fills.length;
  const taker = fills.filter((f) => f.adverseSelection).length;
  const maker = total - taker;

  const pct = (n: number) => (total > 0 ? ((n / total) * 100).toFixed(1) : '0.0');

  const filled = quoteHistory.filter((q) => q.status === 'filled').length;
  const expired = quoteHistory.filter((q) => q.status === 'expired').length;
  const cancelToTrade = filled > 0 ? (expired / filled).toFixed(2) : 'N/A';

  const wins = fills.filter((f) => priceFromFp(f.realizedSpread) > 0).length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';

  const avgSpread =
    total > 0
      ? (fills.reduce((sum, f) => sum + priceFromFp(f.realizedSpread), 0) / total).toFixed(4)
      : '0.0000';

  const pairCounts = new Map<string, number>();
  for (const fill of fills) {
    pairCounts.set(fill.pair, (pairCounts.get(fill.pair) ?? 0) + 1);
  }

  const buys = fills.filter((f) => f.side === 'buy').length;
  const sells = total - buys;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fill Metrics & Execution Quality</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Metric label="Total Fills" value={String(total)} />
          <Metric label="Maker (passive)" value={`${maker} (${pct(maker)}%)`} />
          <Metric label="Taker (aggressive)" value={`${taker} (${pct(taker)}%)`} />
          <Metric label="Win Rate" value={`${winRate}%`} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Metric label="Cancel-to-Trade" value={cancelToTrade} />
          <Metric label="Avg Realized Spread" value={avgSpread} />
          <Metric label="Buys" value={String(buys)} />
          <Metric label="Sells" value={String(sells)} />
        </div>

        {pairCounts.size > 0 && (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Fills per Pair</div>
            <div className="flex flex-wrap gap-2">
              {[...pairCounts.entries()].map(([pair, count]) => (
                <div key={pair} className="rounded border border-slate-800 px-3 py-1 text-sm">
                  <span className="font-medium">{pair}</span>
                  <span className="ml-1 text-slate-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
            Quote outcomes — {filled} filled / {expired} expired
          </div>
          {filled + expired > 0 && (
            <div className="h-2 overflow-hidden rounded bg-slate-800">
              <div
                className="h-2 bg-emerald-500"
                style={{ width: `${((filled / (filled + expired)) * 100).toFixed(1)}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
