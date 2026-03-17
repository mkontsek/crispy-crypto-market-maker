import type { ExchangeHealth, InventorySnapshot, MMConfig, PnLSnapshot, QuoteSnapshot } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { priceFromFp, ratioFromDecimal, sizeFromFp } from '@/lib/fixed-point';

type AlertSeverity = 'critical' | 'warning';
type Alert = { id: string; severity: AlertSeverity; message: string };

function deriveAlerts(params: {
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

export function AlertPanelSection(props: {
  health: ExchangeHealth[];
  inventory: InventorySnapshot[];
  config: MMConfig | null;
  pnl: PnLSnapshot | null;
  killSwitchEngaged: boolean;
  quotes: QuoteSnapshot[];
}) {
  const alerts = deriveAlerts(props);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Alerts</CardTitle>
        {alerts.length > 0 ? (
          <Badge tone={alerts.some((a) => a.severity === 'critical') ? 'danger' : 'warning'}>
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
          </Badge>
        ) : (
          <Badge tone="success">all clear</Badge>
        )}
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-400">No active alerts.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex items-center gap-2 text-sm">
                <Badge tone={alert.severity === 'critical' ? 'danger' : 'warning'}>
                  {alert.severity}
                </Badge>
                <span>{alert.message}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
