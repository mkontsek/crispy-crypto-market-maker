import type { InventorySnapshot, MMConfig, QuoteSnapshot } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { priceFromFp, sizeFromFp } from '@/lib/fixed-point';

type ExposureRow = {
  pair: string;
  baseInventory: number;
  mid: number;
  notional: number;
  maxInventory: number;
  pctOfLimit: number;
  stressUp5: number;
  stressDown5: number;
};

function buildRows(
  inventory: InventorySnapshot[],
  quotes: QuoteSnapshot[],
  config: MMConfig | null
): ExposureRow[] {
  const midMap = new Map(quotes.map((q) => [q.pair, priceFromFp(q.mid)]));
  const maxMap = config
    ? new Map(config.pairs.map((p) => [p.pair, sizeFromFp(p.maxInventory)]))
    : new Map<string, number>();

  return inventory.map((inv) => {
    const baseInventory = sizeFromFp(inv.inventory);
    const mid = midMap.get(inv.pair) ?? 0;
    const notional = baseInventory * mid;
    const maxInventory = maxMap.get(inv.pair) ?? 1;
    const pctOfLimit = maxInventory > 0 ? (Math.abs(baseInventory) / maxInventory) * 100 : 0;
    return {
      pair: inv.pair,
      baseInventory,
      mid,
      notional,
      maxInventory,
      pctOfLimit,
      stressUp5: notional * 0.05,
      stressDown5: -notional * 0.05,
    };
  });
}

function limitTone(pct: number) {
  if (pct > 90) return 'danger' as const;
  if (pct > 70) return 'warning' as const;
  return 'success' as const;
}

export function ExposureSection({
  inventory,
  quotes,
  config,
}: {
  inventory: InventorySnapshot[];
  quotes: QuoteSnapshot[];
  config: MMConfig | null;
}) {
  const rows = buildRows(inventory, quotes, config);
  const totalNotional = rows.reduce((sum, r) => sum + Math.abs(r.notional), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Inventory Exposure & Stress Test</CardTitle>
        <span className="text-xs text-slate-400">
          Total notional: <span className="font-mono text-slate-200">{totalNotional.toFixed(2)} USD</span>
        </span>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">Pair</th>
              <th className="py-2">Base Qty</th>
              <th className="py-2">Notional (USD)</th>
              <th className="py-2">% of Limit</th>
              <th className="py-2">Concentration</th>
              <th className="py-2">+5% Stress</th>
              <th className="py-2">−5% Stress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const concentration =
                totalNotional > 0
                  ? ((Math.abs(row.notional) / totalNotional) * 100).toFixed(1)
                  : '0.0';
              return (
                <tr key={row.pair} className="border-t border-slate-800">
                  <td className="py-2 font-medium">{row.pair}</td>
                  <td className="py-2 font-mono">{row.baseInventory.toFixed(3)}</td>
                  <td className="py-2 font-mono">{row.notional.toFixed(2)}</td>
                  <td className="py-2">
                    <Badge tone={limitTone(row.pctOfLimit)}>
                      {row.pctOfLimit.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="py-2 font-mono">{concentration}%</td>
                  <td className="py-2 font-mono text-emerald-400">+{row.stressUp5.toFixed(2)}</td>
                  <td className="py-2 font-mono text-red-400">{row.stressDown5.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
