import type { FC } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type FillMetricsInfoDialogProps = { open: boolean; onClose: () => void };

export const FillMetricsInfoDialog: FC<FillMetricsInfoDialogProps> = ({
    open,
    onClose,
}) => (
    <Dialog open={open} onClose={onClose}>
        <DialogHeader>
            <DialogTitle>Fill Metrics & Execution Quality</DialogTitle>
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
                This section summarizes how effectively quotes convert into
                fills and the quality of those executions.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
                <li>
                    <span className="font-medium text-slate-200">
                        Maker / Taker split
                    </span>{' '}
                    shows passive fills versus adverse-selection fills marked as
                    aggressive.
                </li>
                <li>
                    <span className="font-medium text-slate-200">Win Rate</span>{' '}
                    measures how often realized spread is positive across recent
                    fills.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Cancel-to-Trade
                    </span>{' '}
                    compares expired quotes to filled quotes; lower values
                    generally indicate better conversion.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Avg Realized Spread
                    </span>
                    , <span className="font-medium text-slate-200">Buys</span>,
                    and{' '}
                    <span className="font-medium text-slate-200">Sells</span>{' '}
                    provide execution direction and profitability context.
                </li>
            </ul>
            <p className="text-slate-400">
                Use fills-per-pair and quote outcomes to spot which markets are
                converting well and where quote quality may need tuning.
            </p>
        </DialogContent>
    </Dialog>
);
