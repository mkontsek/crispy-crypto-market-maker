import type { ExchangeHealth } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ExchangeHealthSection({ health }: { health: ExchangeHealth[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exchange Connectivity (via Bot)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">Pair</th>
              <th className="py-2">Exchange</th>
              <th className="py-2">Tick latency (ms)</th>
              <th className="py-2">Feed staleness (ms)</th>
              <th className="py-2">Connectivity</th>
            </tr>
          </thead>
          <tbody>
            {health.map((entry) => (
              <tr
                key={`${entry.pair}-${entry.exchange}`}
                className="border-t border-slate-800"
              >
                <td className="py-2">{entry.pair}</td>
                <td className="py-2">{entry.exchange}</td>
                <td className="py-2">{entry.tickLatencyMs.toFixed(1)}</td>
                <td className="py-2">{entry.feedStalenessMs.toFixed(1)}</td>
                <td className="py-2">
                  <Badge tone={entry.connected ? 'success' : 'danger'}>
                    {entry.connected ? 'healthy' : 'stale'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
