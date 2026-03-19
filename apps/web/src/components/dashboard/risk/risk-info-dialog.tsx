import type { FC } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog-content';
import { DialogHeader } from '@/components/ui/dialog-header';
import { DialogTitle } from '@/components/ui/dialog-title';

type RiskInfoDialogProps = { open: boolean; onClose: () => void };

export const RiskInfoDialog: FC<RiskInfoDialogProps> = ({ open, onClose }) => (
    <Dialog open={open} onClose={onClose}>
        <DialogHeader>
            <DialogTitle>Risk Dashboard</DialogTitle>
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
                The Risk section tracks live control metrics across four
                categories. Each metric has a warn and critical threshold; when
                breached, the recommended action and runbook path are shown.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
                <li>
                    <span className="font-medium text-slate-200">Exposure</span>
                    : Inventory skew, position size relative to configured
                    limits, and total notional in USD.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        PnL Quality
                    </span>
                    : Adverse selection rate, fill rate, and hedging costs
                    derived from the latest PnL snapshot.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Market State
                    </span>
                    : Feed staleness, pair volatility, and tick latency from
                    exchange health data.
                </li>
                <li>
                    <span className="font-medium text-slate-200">
                        Execution Health
                    </span>
                    : Bot and exchange connectivity, paused pairs, and kill
                    switch state.
                </li>
            </ul>
            <p className="text-slate-400">
                The overall status badge (
                <span className="font-mono text-emerald-300">GREEN</span> /{' '}
                <span className="font-mono text-amber-300">YELLOW</span> /{' '}
                <span className="font-mono text-red-300">RED</span>) reflects
                the worst metric across all categories. The Top Breaches list
                surfaces yellow and red metrics sorted by severity for rapid
                triage.
            </p>
        </DialogContent>
    </Dialog>
);
