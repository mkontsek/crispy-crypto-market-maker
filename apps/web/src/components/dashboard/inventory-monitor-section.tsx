import type { FC } from 'react';

import type { InventorySnapshot, QuoteSnapshot } from '@crispy/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ratioFromDecimal, sizeFromFp } from '@/lib/fixed-point';
import { inventorySkewColor, inventorySkewWidth } from '@/lib/inventory-skew-service';

type InventoryMonitorSectionProps = {
  inventory: InventorySnapshot[];
  quotes: QuoteSnapshot[];
  pendingPair: string | null;
  onTogglePause: (pair: string, paused: boolean) => void;
  onManualHedge: (pair: string) => void;
};

export const InventoryMonitorSection: FC<InventoryMonitorSectionProps> = ({
  inventory,
  quotes,
  pendingPair,
  onTogglePause,
  onManualHedge,
}) => {
  const quoteMap = new Map(quotes.map((quote) => [quote.pair, quote]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Monitor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {inventory.map((item) => {
          const quote = quoteMap.get(item.pair);
          const normalizedSkew = ratioFromDecimal(item.normalizedSkew);
          const isBusy = pendingPair === item.pair;

          return (
            <div key={item.pair} className="rounded-lg border border-slate-800 p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{item.pair}</span>
                <span>
                  inventory {sizeFromFp(item.inventory).toFixed(3)} | skew {normalizedSkew.toFixed(2)}
                </span>
              </div>
              <div className="h-2 rounded bg-slate-800">
                <div
                  className={`${inventorySkewColor(normalizedSkew)} ${inventorySkewWidth(normalizedSkew)} h-2 rounded`}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  disabled={isBusy || !quote}
                  onClick={() => onTogglePause(item.pair, !quote?.paused)}
                >
                  {quote?.paused ? 'Resume Pair' : 'Pause Pair'}
                </Button>
                <Button
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => onManualHedge(item.pair)}
                >
                  {isBusy ? 'Submitting...' : 'Manual Hedge'}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
