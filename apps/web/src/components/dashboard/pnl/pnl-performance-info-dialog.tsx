import type { FC } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type PnlPerformanceInfoDialogProps = { open: boolean; onClose: () => void };

export const PnlPerformanceInfoDialog: FC<PnlPerformanceInfoDialogProps> = ({
    open,
    onClose,
}) => (
    <Dialog open={open} onClose={onClose}>
        <DialogHeader>
            <DialogTitle>PnL &amp; Performance Analytics</DialogTitle>
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
                This section combines latest P&amp;L metrics with recent fill
                outcomes to evaluate strategy quality.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
                <li>
                    <span className="font-medium text-slate-200">
                        Total P&amp;L
                    </span>{' '}
                    and{' '}
                    <span className="font-medium text-slate-200">
                        Realized Spread
                    </span>{' '}
                    summarize profitability.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Fill Rate
                    </span>{' '}
                    and{' '}
                    <span className="font-medium text-slate-200">
                        Adverse Selection
                    </span>{' '}
                    show execution quality and slippage pressure.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Hedging Costs
                    </span>{' '}
                    tracks cost paid to rebalance risk.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Latest fills
                    </span>{' '}
                    provides a timestamped tape of recent trades, spread
                    capture, and adverse/clean labeling.
                </li>
            </ul>
            <p className="text-slate-400">
                Use these metrics together to decide whether spread settings,
                hedging thresholds, or quoting pace need adjustment.
            </p>
        </DialogContent>
    </Dialog>
);
