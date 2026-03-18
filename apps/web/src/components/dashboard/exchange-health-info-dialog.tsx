import type { FC } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type ExchangeHealthInfoDialogProps = { open: boolean; onClose: () => void };

export const ExchangeHealthInfoDialog: FC<ExchangeHealthInfoDialogProps> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogHeader>
      <DialogTitle>Exchange Connectivity (via Bot)</DialogTitle>
      <button
        onClick={onClose}
        className="text-slate-400 transition hover:text-slate-200"
        aria-label="Close"
      >
        ✕
      </button>
    </DialogHeader>
    <DialogContent>
      <p className="text-slate-400">
        This section shows the bot&apos;s observed connection quality to each exchange feed by pair.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-slate-300">
        <li>
          <span className="font-medium text-slate-200">Tick latency</span> estimates how quickly market
          updates are seen.
        </li>
        <li>
          <span className="font-medium text-slate-200">Feed staleness</span> measures data freshness; a
          higher value implies lagging quotes.
        </li>
        <li>
          <span className="font-medium text-slate-200">Connectivity</span> marks each feed as healthy or
          stale from the bot&apos;s perspective.
        </li>
      </ul>
      <p className="text-slate-400">
        Use this table to detect degraded venues before they impact quoting quality or hedging behavior.
      </p>
    </DialogContent>
  </Dialog>
);
