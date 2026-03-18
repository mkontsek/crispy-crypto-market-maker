import type { FC } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type ExposureInfoDialogProps = { open: boolean; onClose: () => void };

export const ExposureInfoDialog: FC<ExposureInfoDialogProps> = ({
    open,
    onClose,
}) => (
    <Dialog open={open} onClose={onClose}>
        <DialogHeader>
            <DialogTitle>Inventory Exposure & Stress Test</DialogTitle>
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
                This section summarizes position risk per pair from the latest
                inventory and quote data.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
                <li>
                    <span className="font-medium text-slate-200">Base Qty</span>
                    : Current inventory amount held in the pair&apos;s base
                    asset.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Notional (USD)
                    </span>
                    : Base quantity multiplied by current mid price.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        % of Limit
                    </span>
                    : Share of configured max inventory currently consumed for
                    that pair.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Concentration
                    </span>
                    : Percentage contribution of each pair to total absolute
                    portfolio notional.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        +5% / −5% Stress
                    </span>
                    : Estimated PnL impact if prices move up or down by 5% from
                    current levels.
                </li>
            </ul>
            <p className="text-slate-400">
                Use this table to identify oversized positions, limit breaches,
                and concentration risk before hedging or pausing quotes.
            </p>
        </DialogContent>
    </Dialog>
);
