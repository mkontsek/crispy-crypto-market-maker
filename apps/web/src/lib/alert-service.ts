import type { ExchangeHealth, InventorySnapshot, MMConfig, PnLSnapshot, QuoteSnapshot } from '@crispy/shared';

import { priceFromFp, ratioFromDecimal, sizeFromFp } from './fixed-point';

export type AlertSeverity = 'critical' | 'warning';
export type Alert = { id: string; severity: AlertSeverity; message: string };

export function deriveAlerts(params: {
  health: ExchangeHealth[];
  inventory: InventorySnapshot[];
  config: MMConfig | null;
  pnl: PnLSnapshot | null;
  killSwitchEngaged: boolean;
  quotes: QuoteSnapshot[];
}): Alert[] {
  const { health, inventory, config, pnl, killSwitchEngaged, quotes } = params;
  const alerts: Alert[] = [];

  if (killSwitchEngaged) {
    alerts.push({
      id: 'kill-switch',
      severity: 'critical',
      message: 'Kill switch is ENGAGED — all quoting halted.',
    });
  }

  const disconnected = health.filter((h) => !h.connected);
  if (disconnected.length > 0) {
    const names = disconnected.map((h) => `${h.exchange} (${h.pair})`).join(', ');
    alerts.push({ id: 'exchange-disconnect', severity: 'critical', message: `Feed disconnected: ${names}` });
  }

  const stale = health.filter((h) => priceFromFp(h.feedStalenessMs) > 2000);
  if (stale.length > 0) {
    const names = stale.map((h) => `${h.exchange} (${h.pair})`).join(', ');
    alerts.push({ id: 'feed-stale', severity: 'warning', message: `Feed staleness >2 s: ${names}` });
  }

  if (config) {
    const maxMap = new Map(config.pairs.map((p) => [p.pair, sizeFromFp(p.maxInventory)]));
    for (const inv of inventory) {
      const max = maxMap.get(inv.pair);
      if (max == null || max === 0) continue;
      const ratio = Math.abs(sizeFromFp(inv.inventory)) / max;
      if (ratio > 0.9) {
        alerts.push({ id: `inv-crit-${inv.pair}`, severity: 'critical', message: `${inv.pair} inventory at ${(ratio * 100).toFixed(0)}% of hard limit` });
      } else if (ratio > 0.75) {
        alerts.push({ id: `inv-warn-${inv.pair}`, severity: 'warning', message: `${inv.pair} inventory at ${(ratio * 100).toFixed(0)}% of limit` });
      }
    }
  }

  if (pnl) {
    const adverse = ratioFromDecimal(pnl.adverseSelectionRate);
    if (adverse > 0.4) {
      alerts.push({ id: 'adverse-high', severity: 'warning', message: `Adverse selection high: ${(adverse * 100).toFixed(1)}%` });
    }
    const fillRate = ratioFromDecimal(pnl.fillRate);
    if (fillRate > 0 && fillRate < 0.02) {
      alerts.push({ id: 'fill-low', severity: 'warning', message: `Fill rate very low: ${(fillRate * 100).toFixed(2)}%` });
    }
  }

  const allPaused = quotes.length > 0 && quotes.every((q) => q.paused);
  if (allPaused && !killSwitchEngaged) {
    alerts.push({ id: 'all-paused', severity: 'warning', message: 'All pairs are currently paused' });
  }

  return alerts;
}
