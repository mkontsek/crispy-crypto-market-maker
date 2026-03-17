import type { PnLSnapshot } from '@crispy/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { priceFromFp } from '@/lib/fixed-point';

function Metric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="rounded border border-slate-800 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-base font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
        {value}
      </div>
    </div>
  );
}

function PnlChart({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <p className="py-4 text-center text-sm text-slate-400">Collecting data…</p>;
  }

  const W = 400;
  const H = 80;
  const PAD = 4;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values
    .map((v, i) => {
      const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
      const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const current = values[values.length - 1] ?? 0;
  const zeroY = PAD + (1 - (0 - min) / range) * (H - PAD * 2);
  const clampedZeroY = Math.min(Math.max(zeroY, PAD), H - PAD);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: '80px' }}
      aria-hidden="true"
    >
      <line
        x1={PAD}
        y1={clampedZeroY}
        x2={W - PAD}
        y2={clampedZeroY}
        stroke="#334155"
        strokeWidth="0.5"
        strokeDasharray="4,4"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={current >= 0 ? '#10b981' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PnlCurveSection({ pnl }: { pnl: PnLSnapshot[] }) {
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
        <CardTitle>Intraday P&amp;L Curve</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <PnlChart values={values} />

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Metric label="Current P&L" value={current.toFixed(2)} positive={current >= 0} />
          <Metric label="Peak P&L" value={peak.toFixed(2)} positive={peak >= 0} />
          <Metric
            label="Drawdown"
            value={`${drawdown.toFixed(2)} (${drawdownPct}%)`}
            positive={drawdown >= 0}
          />
          <Metric label="Snapshots" value={String(pnl.length)} positive={true} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="Realized Spread" value={realizedLatest.toFixed(4)} positive={realizedLatest >= 0} />
          <Metric label="Hedging Costs" value={hedgingLatest.toFixed(4)} positive={hedgingLatest <= 0} />
        </div>
      </CardContent>
    </Card>
  );
}
