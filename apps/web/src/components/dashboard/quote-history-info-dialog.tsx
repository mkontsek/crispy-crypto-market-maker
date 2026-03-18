import type { FC } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type QuoteHistoryInfoDialogProps = { open: boolean; onClose: () => void };

export const QuoteHistoryInfoDialog: FC<QuoteHistoryInfoDialogProps> = ({
    open,
    onClose,
}) => (
    <Dialog open={open} onClose={onClose}>
        <DialogHeader>
            <DialogTitle>Quote History</DialogTitle>
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
                This section lists recent quotes emitted by the active bot, with
                execution outcome attached.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
                <li>
                    <span className="font-medium text-slate-200">
                        Bid / Ask / Spread
                    </span>{' '}
                    show the quoted levels at each event.
                </li>
                <li>
                    <span className="font-medium text-slate-200">Skew</span>{' '}
                    indicates inventory-based directional adjustment at quote
                    time.
                </li>
                <li>
                    <span className="font-medium text-slate-200">Status</span>{' '}
                    marks whether the quote ended as a fill or expired without
                    execution.
                </li>
            </ul>
            <p className="text-slate-400">
                Use this table to inspect quote quality, monitor fill
                conversion, and identify pairs where spreads or skew might need
                adjustment.
            </p>
        </DialogContent>
    </Dialog>
);
