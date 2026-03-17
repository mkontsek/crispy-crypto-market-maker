import type { QuoteSnapshot } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { priceFromFp } from '@/lib/fixed-point';

export type QuoteHistoryEntry = QuoteSnapshot & {
  status: 'filled' | 'expired';
  timestamp: string;
};

export function QuoteHistorySection({ entries }: { entries: QuoteHistoryEntry[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Quote History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">Pair</th>
              <th className="py-2">Bid</th>
              <th className="py-2">Ask</th>
              <th className="py-2">Spread</th>
              <th className="py-2">Skew</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.slice(0, 40).map((entry, index) => (
              <tr key={`${entry.pair}-${entry.timestamp}-${index}`} className="border-t border-slate-800">
                <td className="py-2">{entry.pair}</td>
                <td className="py-2">{priceFromFp(entry.bid).toFixed(2)}</td>
                <td className="py-2">{priceFromFp(entry.ask).toFixed(2)}</td>
                <td className="py-2">{priceFromFp(entry.spreadBps).toFixed(2)}</td>
                <td className="py-2">{priceFromFp(entry.inventorySkew).toFixed(3)}</td>
                <td className="py-2">
                  <Badge tone={entry.status === 'filled' ? 'success' : 'default'}>
                    {entry.status}
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
