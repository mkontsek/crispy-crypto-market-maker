import type { FC } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type InventoryMonitorInfoDialogProps = { open: boolean; onClose: () => void };

export const InventoryMonitorInfoDialog: FC<
    InventoryMonitorInfoDialogProps
> = ({ open, onClose }) => (
    <Dialog open={open} onClose={onClose}>
        <DialogHeader>
            <DialogTitle>Inventory Monitor</DialogTitle>
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
                This section tracks per-pair inventory imbalance and gives quick
                controls to reduce exposure.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
                <li>
                    <span className="font-medium text-slate-200">
                        Inventory
                    </span>{' '}
                    shows current base-asset position size for the pair.
                </li>
                <li>
                    <span className="font-medium text-slate-200">Skew</span>{' '}
                    reflects normalized inventory pressure; larger magnitude
                    indicates stronger directional imbalance.
                </li>
                <li>The colored bar visualizes skew intensity at a glance.</li>
                <li>
                    <span className="font-medium text-slate-200">
                        Pause/Resume Pair
                    </span>{' '}
                    toggles quoting for that market.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Manual Hedge
                    </span>{' '}
                    sends an immediate hedging action for the selected pair.
                </li>
            </ul>
            <p className="text-slate-400">
                Use this panel when inventory drifts too far from neutral and
                requires quick operational action.
            </p>
        </DialogContent>
    </Dialog>
);
