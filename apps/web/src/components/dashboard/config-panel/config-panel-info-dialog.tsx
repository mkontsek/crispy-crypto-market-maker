import type { FC } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type ConfigPanelInfoDialogProps = { open: boolean; onClose: () => void };

export const ConfigPanelInfoDialog: FC<ConfigPanelInfoDialogProps> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogHeader>
      <DialogTitle>MM Config Panel</DialogTitle>
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
        This panel controls per-pair quoting behavior and inventory risk limits used by the market maker.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-slate-300">
        <li>
          <span className="font-medium text-slate-200">Spread &amp; volatility fields</span> determine
          quote width and how aggressively quotes react to volatility.
        </li>
        <li>
          <span className="font-medium text-slate-200">Max inventory</span> and{' '}
          <span className="font-medium text-slate-200">skew sensitivity</span> control position limits
          and directional quote bias.
        </li>
        <li>
          <span className="font-medium text-slate-200">Refresh (ms)</span> sets quote update frequency.
        </li>
        <li>
          <span className="font-medium text-slate-200">Hedging options</span> define threshold, target
          venue, and whether automatic hedging is enabled.
        </li>
        <li>
          <span className="font-medium text-slate-200">Enabled</span> toggles quoting per pair.
        </li>
      </ul>
      <p className="text-slate-400">
        Changes are staged in the form and applied to the bot only when you click{' '}
        <span className="font-medium text-slate-200">Save Config</span>.
      </p>
    </DialogContent>
  </Dialog>
);
