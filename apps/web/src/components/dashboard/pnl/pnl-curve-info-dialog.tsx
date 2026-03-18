import type { FC } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type PnlCurveInfoDialogProps = { open: boolean; onClose: () => void };

export const PnlCurveInfoDialog: FC<PnlCurveInfoDialogProps> = ({
    open,
    onClose,
}) => (
    <Dialog open={open} onClose={onClose}>
        <DialogHeader>
            <DialogTitle>Intraday P&amp;L Curve</DialogTitle>
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
                This section visualizes cumulative intraday P&amp;L and
                highlights recent risk/performance changes.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
                <li>
                    <span className="font-medium text-slate-200">
                        Current P&amp;L
                    </span>{' '}
                    is the latest total mark-to-model value.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Peak P&amp;L
                    </span>{' '}
                    tracks the highest value in the displayed window.
                </li>
                <li>
                    <span className="font-medium text-slate-200">Drawdown</span>{' '}
                    shows distance from current to peak, both absolute and
                    percentage.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Realized Spread
                    </span>{' '}
                    and{' '}
                    <span className="font-medium text-slate-200">
                        Hedging Costs
                    </span>{' '}
                    break down contributors to total P&amp;L.
                </li>
            </ul>
            <p className="text-slate-400">
                Use this view to detect trend changes, widening drawdowns, and
                whether hedging costs are overpowering spread capture.
            </p>
        </DialogContent>
    </Dialog>
);
