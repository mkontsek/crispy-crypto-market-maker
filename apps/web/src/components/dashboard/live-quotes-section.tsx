import type { QuoteSnapshot } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { priceFromFp } from '@/lib/fixed-point';

export function LiveQuotesSection({
  quotes,
  connected,
}: {
  quotes: QuoteSnapshot[];
  connected: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Live Quoting Dashboard</CardTitle>
        <Badge tone={connected ? 'success' : 'danger'}>
          {connected ? 'stream connected' : 'stream disconnected'}
        </Badge>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">Pair</th>
              <th className="py-2">Bid</th>
              <th className="py-2">Ask</th>
              <th className="py-2">Mid</th>
              <th className="py-2">Spread (bps)</th>
              <th className="py-2">Refresh / sec</th>
              <th className="py-2">State</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.pair} className="border-t border-slate-800">
                <td className="py-2 font-medium">{quote.pair}</td>
                <td className="py-2">{priceFromFp(quote.bid).toFixed(2)}</td>
                <td className="py-2">{priceFromFp(quote.ask).toFixed(2)}</td>
                <td className="py-2">{priceFromFp(quote.mid).toFixed(2)}</td>
                <td className="py-2">{priceFromFp(quote.spreadBps).toFixed(2)}</td>
                <td className="py-2">{priceFromFp(quote.quoteRefreshRate).toFixed(2)}</td>
                <td className="py-2">
                  <Badge tone={quote.paused ? 'warning' : 'success'}>
                    {quote.paused ? 'paused' : 'quoting'}
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
