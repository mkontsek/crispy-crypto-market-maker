import type { Fill, PnLSnapshot } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { priceFromFp, ratioFromDecimal, sizeFromFp } from '@/lib/fixed-point';

export function PnlPerformanceSection({
  pnl,
  fills,
}: {
  pnl: PnLSnapshot[];
  fills: Fill[];
}) {
  const latest = pnl[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>PnL & Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest ? (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
            <Metric label="Total PnL" value={priceFromFp(latest.totalPnl).toFixed(2)} />
            <Metric label="Realized Spread" value={priceFromFp(latest.realizedSpread).toFixed(2)} />
            <Metric label="Fill Rate" value={`${(ratioFromDecimal(latest.fillRate) * 100).toFixed(1)}%`} />
            <Metric
              label="Adverse Selection"
              value={`${(ratioFromDecimal(latest.adverseSelectionRate) * 100).toFixed(1)}%`}
            />
            <Metric label="Hedging Costs" value={priceFromFp(latest.hedgingCosts).toFixed(2)} />
          </div>
        ) : null}

        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Latest fills</div>
          <div className="space-y-2">
            {fills.slice(0, 10).map((fill) => (
              <div
                key={fill.id}
                className="flex items-center justify-between rounded border border-slate-800 px-3 py-2 text-sm"
              >
                <span>
                  {fill.pair} {fill.side.toUpperCase()} @ {priceFromFp(fill.price).toFixed(2)} ({sizeFromFp(fill.size).toFixed(3)})
                </span>
                <span className="flex items-center gap-2">
                  spread {priceFromFp(fill.realizedSpread).toFixed(4)}
                  <Badge tone={fill.adverseSelection ? 'danger' : 'success'}>
                    {fill.adverseSelection ? 'adverse' : 'clean'}
                  </Badge>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}
