type KillSwitchBadgeTone = 'warning' | 'danger' | 'success';
type KillSwitchButtonVariant = 'outline' | 'danger';

type KillSwitchUiStateInput = {
    engaged: boolean;
    stateKnown: boolean;
    pending: boolean;
};

type KillSwitchUiState = {
    buttonDisabled: boolean;
    buttonLabel: string;
    buttonVariant: KillSwitchButtonVariant;
    statusTone: KillSwitchBadgeTone;
    statusLabel: string;
    cardClassName: string;
};

export function deriveKillSwitchUiState(
    params: KillSwitchUiStateInput
): KillSwitchUiState {
    const { engaged, stateKnown, pending } = params;

    const buttonDisabled = pending || !stateKnown;

    let buttonLabel = 'Engage Kill Switch';
    if (!stateKnown) {
        buttonLabel = 'Waiting for state...';
    } else if (pending) {
        buttonLabel = 'Applying...';
    } else if (engaged) {
        buttonLabel = 'Disengage Kill Switch';
    }

    const buttonVariant: KillSwitchButtonVariant = engaged
        ? 'outline'
        : 'danger';

    let statusTone: KillSwitchBadgeTone = 'success';
    let statusLabel = 'DISENGAGED';
    if (!stateKnown) {
        statusTone = 'warning';
        statusLabel = 'UNKNOWN - waiting for bot state';
    } else if (engaged) {
        statusTone = 'danger';
        statusLabel = 'ENGAGED - all quoting halted';
    }

    let cardClassName = '';
    if (!stateKnown) {
        cardClassName = 'opacity-80';
    } else if (engaged) {
        cardClassName = 'border-red-600';
    }

    return {
        buttonDisabled,
        buttonLabel,
        buttonVariant,
        statusTone,
        statusLabel,
        cardClassName,
    };
}
