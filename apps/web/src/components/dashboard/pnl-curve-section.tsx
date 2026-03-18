import type { FC } from 'react';

import type { PnLSnapshot } from '@crispy/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { priceFromFp } from '@/lib/fixed-point';
import { MetricCard } from './metric-card';
import { PnlChart } from './pnl-chart';

type PnlCurveSectionProps = { pnl: PnLSnapshot[] };

export const PnlCurveSection: FC<PnlCurveSectionProps> = ({ pnl }) => {
  const values = pnl.map((p) => priceFromFp(p.totalPnl)).reverse();

  const current = values[values.length - 1] ?? 0;
  const peak = values.length > 0 ? Math.max(...values) : 0;
  const drawdown = current - peak;
  const drawdownPct = peak !== 0 ? ((drawdown / Math.abs(peak)) * 100).toFixed(1) : '0.0';

  const realizedLatest = pnl[0] ? priceFromFp(pnl[0].realizedSpread) : 0;
  const hedgingLatest = pnl[0] ? priceFromFp(pnl[0].hedgingCosts) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intraday P&L Curve</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <PnlChart values={values} />

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <MetricCard label="Current P&L" value={current.toFixed(2)} positive={current >= 0} />
          <MetricCard label="Peak P&L" value={peak.toFixed(2)} positive={peak >= 0} />
          <MetricCard
            label="Drawdown"
            value={`${drawdown.toFixed(2)} (${drawdownPct}%)`}
            positive={drawdown >= 0}
          />
          <MetricCard label="Snapshots" value={String(pnl.length)} positive={true} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <MetricCard label="Realized Spread" value={realizedLatest.toFixed(4)} positive={realizedLatest >= 0} />
          <MetricCard label="Hedging Costs" value={hedgingLatest.toFixed(4)} positive={hedgingLatest <= 0} />
        </div>
      </CardContent>
    </Card>
  );
};
