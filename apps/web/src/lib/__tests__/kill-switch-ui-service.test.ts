import { describe, expect, it } from 'vitest';

import { deriveKillSwitchUiState } from '../kill-switch-ui-service';

describe('deriveKillSwitchUiState', () => {
    it('returns waiting state when switch state is unknown', () => {
        const result = deriveKillSwitchUiState({
            engaged: false,
            stateKnown: false,
            pending: false,
        });

        expect(result).toMatchObject({
            buttonDisabled: true,
            buttonLabel: 'Waiting for state...',
            buttonVariant: 'danger',
            statusTone: 'warning',
            statusLabel: 'UNKNOWN - waiting for bot state',
            cardClassName: 'opacity-80',
        });
    });

    it('returns applying state when known and pending', () => {
        const result = deriveKillSwitchUiState({
            engaged: false,
            stateKnown: true,
            pending: true,
        });

        expect(result).toMatchObject({
            buttonDisabled: true,
            buttonLabel: 'Applying...',
            buttonVariant: 'danger',
            statusTone: 'success',
            statusLabel: 'DISENGAGED',
            cardClassName: '',
        });
    });

    it('returns engaged state when known and engaged', () => {
        const result = deriveKillSwitchUiState({
            engaged: true,
            stateKnown: true,
            pending: false,
        });

        expect(result).toMatchObject({
            buttonDisabled: false,
            buttonLabel: 'Disengage Kill Switch',
            buttonVariant: 'outline',
            statusTone: 'danger',
            statusLabel: 'ENGAGED - all quoting halted',
            cardClassName: 'border-red-600',
        });
    });

    it('returns disengaged actionable state when known and idle', () => {
        const result = deriveKillSwitchUiState({
            engaged: false,
            stateKnown: true,
            pending: false,
        });

        expect(result).toMatchObject({
            buttonDisabled: false,
            buttonLabel: 'Engage Kill Switch',
            buttonVariant: 'danger',
            statusTone: 'success',
            statusLabel: 'DISENGAGED',
            cardClassName: '',
        });
    });
});
