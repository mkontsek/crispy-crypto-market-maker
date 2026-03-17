'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type DbPnLSnapshot = {
  id: string;
  botId: string | null;
  totalPnl: number;
  realizedSpread: number;
  hedgingCosts: number;
  adverseSelectionRate: number;
  fillRate: number;
  createdAt: string;
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

export function PnlHistorySection({ snapshots }: { snapshots: DbPnLSnapshot[] }) {
  const latest = snapshots[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>PnL History ({snapshots.length} snapshots stored)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest ? (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Latest snapshot — {new Date(latest.createdAt).toLocaleString()}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
              <Metric label="Total PnL" value={latest.totalPnl.toFixed(2)} />
              <Metric label="Realized Spread" value={latest.realizedSpread.toFixed(4)} />
              <Metric label="Fill Rate" value={`${(latest.fillRate * 100).toFixed(1)}%`} />
              <Metric
                label="Adverse Sel."
                value={`${(latest.adverseSelectionRate * 100).toFixed(1)}%`}
              />
              <Metric label="Hedging Costs" value={latest.hedgingCosts.toFixed(4)} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No PnL snapshots stored yet.</p>
        )}

        {snapshots.length > 1 && (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Recent snapshots
            </div>
            <div className="max-h-52 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-950 text-left text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Bot</th>
                    <th className="py-2 pr-4">Total PnL</th>
                    <th className="py-2 pr-4">Fill Rate</th>
                    <th className="py-2">Adverse</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snap) => (
                    <tr key={snap.id} className="border-b border-slate-800/50">
                      <td className="py-1 pr-4 font-mono text-xs text-slate-400">
                        {new Date(snap.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-1 pr-4 text-xs text-slate-400">{snap.botId ?? '—'}</td>
                      <td className="py-1 pr-4 font-mono">{snap.totalPnl.toFixed(2)}</td>
                      <td className="py-1 pr-4 font-mono">
                        {(snap.fillRate * 100).toFixed(1)}%
                      </td>
                      <td className="py-1 font-mono">
                        {(snap.adverseSelectionRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
