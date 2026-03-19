import { describe, expect, it } from 'vitest';

import { derivePnlBadge } from '../pnl-badge-service';

describe('derivePnlBadge', () => {
    it('returns success tone with up arrow and plus sign for positive value', () => {
        expect(derivePnlBadge(123.45)).toEqual({
            tone: 'success',
            arrow: '▲',
            sign: '+',
        });
    });

    it('returns danger tone with down arrow and no sign for negative value', () => {
        expect(derivePnlBadge(-50.0)).toEqual({
            tone: 'danger',
            arrow: '▼',
            sign: '',
        });
    });

    it('returns default tone with dash and no sign for zero', () => {
        expect(derivePnlBadge(0)).toEqual({
            tone: 'default',
            arrow: '–',
            sign: '',
        });
    });

    it('handles small positive values', () => {
        const badge = derivePnlBadge(0.01);
        expect(badge.tone).toBe('success');
        expect(badge.arrow).toBe('▲');
        expect(badge.sign).toBe('+');
    });

    it('handles small negative values', () => {
        const badge = derivePnlBadge(-0.01);
        expect(badge.tone).toBe('danger');
        expect(badge.arrow).toBe('▼');
        expect(badge.sign).toBe('');
    });
});
