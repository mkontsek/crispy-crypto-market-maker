'use client';

import { useState } from 'react';

import type { QuoteSnapshot } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { priceFromFp } from '@/lib/fixed-point';

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="10" y="14.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor">
        i
      </text>
    </svg>
  );
}

function StateInfoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Quote States</DialogTitle>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition"
          aria-label="Close"
        >
          ✕
        </button>
      </DialogHeader>
      <DialogContent>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge tone="success">quoting</Badge>
          </div>
          <p className="text-slate-400">
            The pair is actively being quoted on the exchange. Bid and ask orders are placed and
            refreshed according to the configured spread and refresh rate.
          </p>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge tone="warning">paused</Badge>
          </div>
          <p className="text-slate-400">
            Quote submission is paused for this pair. No new orders will be placed until quoting is
            resumed, for example via the Inventory Monitor controls.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LiveQuotesSection({
  quotes,
  connected,
}: {
  quotes: QuoteSnapshot[];
  connected: boolean;
}) {
  const [stateInfoOpen, setStateInfoOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Live Quoting Dashboard</CardTitle>
          <Badge tone={connected ? 'success' : 'danger'}>
            {connected ? 'stream connected' : 'stream disconnected'}
          </Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2">Pair</th>
                <th className="py-2">Bid</th>
                <th className="py-2">Ask</th>
                <th className="py-2">Mid</th>
                <th className="py-2">Spread (bps)</th>
                <th className="py-2">Skew</th>
                <th className="py-2">Refresh / sec</th>
                <th className="py-2">
                  <span className="inline-flex items-center gap-1">
                    State
                    <button
                      onClick={() => setStateInfoOpen(true)}
                      className="text-slate-500 hover:text-slate-300 transition"
                      aria-label="State information"
                    >
                      <InfoIcon />
                    </button>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => {
                const skewVal = priceFromFp(quote.inventorySkew);
                const skewColor =
                  Math.abs(skewVal) < 0.001
                    ? 'text-slate-300'
                    : skewVal > 0
                    ? 'text-emerald-400'
                    : 'text-amber-400';
                return (
                  <tr key={quote.pair} className="border-t border-slate-800">
                    <td className="py-2 font-medium">{quote.pair}</td>
                    <td className="py-2">{priceFromFp(quote.bid).toFixed(2)}</td>
                    <td className="py-2">{priceFromFp(quote.ask).toFixed(2)}</td>
                    <td className="py-2">{priceFromFp(quote.mid).toFixed(2)}</td>
                    <td className="py-2">{priceFromFp(quote.spreadBps).toFixed(2)}</td>
                    <td className={`py-2 font-mono ${skewColor}`}>{skewVal.toFixed(3)}</td>
                    <td className="py-2">{priceFromFp(quote.quoteRefreshRate).toFixed(2)}</td>
                    <td className="py-2">
                      <Badge tone={quote.paused ? 'warning' : 'success'}>
                        {quote.paused ? 'paused' : 'quoting'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <StateInfoDialog open={stateInfoOpen} onClose={() => setStateInfoOpen(false)} />
    </>
  );
}
