import type { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type QuoteHistoryStatusInfoDialogProps = { open: boolean; onClose: () => void };

export const QuoteHistoryStatusInfoDialog: FC<
    QuoteHistoryStatusInfoDialogProps
> = ({ open, onClose }) => (
    <Dialog open={open} onClose={onClose}>
        <DialogHeader>
            <DialogTitle>Quote History Statuses</DialogTitle>
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
                These are all status values currently shown in Quote History.
            </p>
            <div className="space-y-3">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <Badge tone="success">filled</Badge>
                    </div>
                    <p className="text-slate-400">
                        The quote resulted in an execution (fill) for the pair
                        on that update.
                    </p>
                </div>
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <Badge tone="default">expired</Badge>
                    </div>
                    <p className="text-slate-400">
                        The quote did not fill during that update window and is
                        tracked as expired.
                    </p>
                </div>
            </div>
        </DialogContent>
    </Dialog>
);
