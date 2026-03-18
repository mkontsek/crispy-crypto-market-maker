import type { FC } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type LiveQuotesInfoDialogProps = { open: boolean; onClose: () => void };

export const LiveQuotesInfoDialog: FC<LiveQuotesInfoDialogProps> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogHeader>
      <DialogTitle>Live Quoting Dashboard</DialogTitle>
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
        This section shows the latest quote state for each pair on the active bot in near real time.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-slate-300">
        <li>
          <span className="font-medium text-slate-200">Bid / Ask / Mid / Spread</span> represent current
          quoting levels.
        </li>
        <li>
          <span className="font-medium text-slate-200">Skew</span> and{' '}
          <span className="font-medium text-slate-200">Refresh / sec</span> show inventory bias and quote
          update speed.
        </li>
        <li>
          <span className="font-medium text-slate-200">State</span> indicates whether each pair is
          actively quoting or paused.
        </li>
      </ul>
      <p className="text-slate-400">
        The header badge reflects websocket stream health for the bot. Use this with State indicators to
        quickly detect stalled or paused quoting.
      </p>
    </DialogContent>
  </Dialog>
);
