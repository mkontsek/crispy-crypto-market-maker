import { describe, expect, it } from 'vitest';

import type { Fill, PnLSnapshot } from '@crispy/shared';

import { dedupeFills, dedupePnl } from '../bot-data-service';

const fill = (id: string): Fill => ({
    id,
    pair: 'BTC/USDT',
    side: 'buy',
    price: '50000',
    size: '1',
    midAtFill: '50000',
    realizedSpread: '10',
    adverseSelection: false,
    timestamp: '0',
});

const snap = (ts: string): PnLSnapshot => ({
    timestamp: ts,
    totalPnl: '0',
    realizedSpread: '0',
    hedgingCosts: '0',
    adverseSelectionRate: '0',
    fillRate: '0',
});

describe('dedupeFills', () => {
    it('removes duplicate fills by id', () => {
        const result = dedupeFills([fill('1'), fill('1'), fill('2')]);
        expect(result).toHaveLength(2);
        expect(result.map((f) => f.id)).toEqual(['1', '2']);
    });

    it('caps result at 300 entries', () => {
        const fills = Array.from({ length: 400 }, (_, i) => fill(`f-${i}`));
        expect(dedupeFills(fills)).toHaveLength(300);
    });
});

describe('dedupePnl', () => {
    it('removes duplicate snapshots by timestamp', () => {
        const result = dedupePnl([snap('t1'), snap('t1'), snap('t2')]);
        expect(result).toHaveLength(2);
        expect(result.map((s) => s.timestamp)).toEqual(['t1', 't2']);
    });

    it('caps result at 300 entries', () => {
        const snaps = Array.from({ length: 400 }, (_, i) => snap(`t-${i}`));
        expect(dedupePnl(snaps)).toHaveLength(300);
    });
});
