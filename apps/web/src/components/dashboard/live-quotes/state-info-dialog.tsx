'use client';

import type { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';
import { Dialog } from '@/components/ui/dialog';

type StateInfoDialogProps = { open: boolean; onClose: () => void };

export const StateInfoDialog: FC<StateInfoDialogProps> = ({
    open,
    onClose,
}) => (
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
                    The pair is actively being quoted on the exchange. Bid and
                    ask orders are placed and refreshed according to the
                    configured spread and refresh rate.
                </p>
            </div>
            <div>
                <div className="mb-1 flex items-center gap-2">
                    <Badge tone="warning">paused</Badge>
                </div>
                <p className="text-slate-400">
                    Quote submission is paused for this pair. No new orders will
                    be placed until quoting is resumed, for example via the
                    Inventory Monitor controls.
                </p>
            </div>
        </DialogContent>
    </Dialog>
);
