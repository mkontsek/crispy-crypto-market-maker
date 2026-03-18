import type { FC } from 'react';

import type { ExchangeHealth, InventorySnapshot, MMConfig, PnLSnapshot, QuoteSnapshot } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deriveAlerts } from '@/lib/alert-service';

type AlertPanelSectionProps = {
  health: ExchangeHealth[];
  inventory: InventorySnapshot[];
  config: MMConfig | null;
  pnl: PnLSnapshot | null;
  killSwitchEngaged: boolean;
  quotes: QuoteSnapshot[];
};

export const AlertPanelSection: FC<AlertPanelSectionProps> = (props) => {
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
};
