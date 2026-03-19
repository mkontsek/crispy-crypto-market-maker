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
import { deriveKillSwitchUiState } from '@/lib/kill-switch-ui-service';

type KillSwitchSectionProps = {
    engaged: boolean;
    stateKnown: boolean;
    pending: boolean;
    onToggle: (engaged: boolean) => void;
};

export const KillSwitchSection: FC<KillSwitchSectionProps> = ({
    engaged,
    stateKnown,
    pending,
    onToggle,
}) => {
    const [confirmOpen, setConfirmOpen] = useState(false);

    const closeConfirm = () => setConfirmOpen(false);
    const toggleKillSwitch = () =>
        engaged ? onToggle(false) : setConfirmOpen(true);
    const engageKillSwitch = () => {
        setConfirmOpen(false);
        onToggle(true);
    };
    const uiState = deriveKillSwitchUiState({
        engaged,
        stateKnown,
        pending,
    });

    return (
        <>
            <Card className={uiState.cardClassName}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold uppercase tracking-wide">
                            Kill Switch
                        </span>
                        <Badge tone={uiState.statusTone}>
                            {uiState.statusLabel}
                        </Badge>
                    </div>
                    <Button
                        variant={uiState.buttonVariant}
                        disabled={uiState.buttonDisabled}
                        onClick={toggleKillSwitch}
                    >
                        {uiState.buttonLabel}
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
                        X
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
