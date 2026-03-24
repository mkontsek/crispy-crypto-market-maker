'use client';

import type { FC } from 'react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type KillSwitchSectionProps = {
    engaged: boolean;
    pending: boolean;
    onToggle: (engaged: boolean) => void;
};

export const KillSwitchSection: FC<KillSwitchSectionProps> = ({
    engaged,
    pending,
    onToggle,
}) => {
    const [confirmOpen, setConfirmOpen] = useState(false);

    const openConfirm = () => setConfirmOpen(true);
    const closeConfirm = () => setConfirmOpen(false);
    const toggleKillSwitch = () =>
        engaged ? onToggle(false) : setConfirmOpen(true);
    const engageKillSwitch = () => {
        setConfirmOpen(false);
        onToggle(true);
    };

    return (
        <>
            <Card className={engaged ? 'border-red-600' : ''}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold uppercase tracking-wide">
                            Kill Switch
                        </span>
                        <Badge tone={engaged ? 'danger' : 'success'}>
                            {engaged
                                ? 'ENGAGED — all quoting halted'
                                : 'DISENGAGED'}
                        </Badge>
                    </div>
                    <Button
                        variant={engaged ? 'outline' : 'danger'}
                        disabled={pending}
                        onClick={toggleKillSwitch}
                    >
                        {pending
                            ? 'Applying…'
                            : engaged
                              ? 'Disengage Kill Switch'
                              : 'Engage Kill Switch'}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={confirmOpen} onClose={closeConfirm}>
                <DialogHeader>
                    <DialogTitle>Confirm Kill Switch</DialogTitle>
                    <button
                        onClick={closeConfirm}
                        className="text-slate-400 transition hover:text-slate-200"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </DialogHeader>
                <DialogContent>
                    <p>
                        Engaging the kill switch will immediately{' '}
                        <strong className="text-red-300">
                            pause all quoting
                        </strong>{' '}
                        across every pair. No new orders will be placed until
                        the kill switch is disengaged.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={closeConfirm}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={engageKillSwitch}
                        >
                            Engage Kill Switch
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
