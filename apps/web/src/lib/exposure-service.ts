import type { InventorySnapshot, MMConfig, QuoteSnapshot } from '@crispy/shared';

import { priceFromFp, sizeFromFp } from './fixed-point';

export type ExposureRow = {
  pair: string;
  baseInventory: number;
  mid: number;
  notional: number;
  maxInventory: number;
  pctOfLimit: number;
  stressUp5: number;
  stressDown5: number;
};

export function buildExposureRows(
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

export function limitTone(pct: number): 'danger' | 'warning' | 'success' {
  if (pct > 90) return 'danger';
  if (pct > 70) return 'warning';
  return 'success';
}
