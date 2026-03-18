import { describe, expect, it } from 'vitest';

import { buildExposureRows, limitTone } from '../exposure-service';

describe('limitTone', () => {
    it('returns danger for pct > 90', () => {
        expect(limitTone(91)).toBe('danger');
        expect(limitTone(100)).toBe('danger');
    });

    it('returns warning for pct between 70 and 90', () => {
        expect(limitTone(71)).toBe('warning');
        expect(limitTone(90)).toBe('warning');
    });

    it('returns success for pct <= 70', () => {
        expect(limitTone(70)).toBe('success');
        expect(limitTone(0)).toBe('success');
    });
});

describe('buildExposureRows', () => {
    it('returns empty array for empty inventory', () => {
        expect(buildExposureRows([], [], null)).toEqual([]);
    });

    it('calculates notional and stress values', () => {
        const inventory = [
            {
                pair: 'BTC/USDT' as const,
                inventory: '2',
                normalizedSkew: '0',
                timestamp: '0',
            },
        ];
        const quotes = [
            {
                pair: 'BTC/USDT' as const,
                bid: '0',
                ask: '0',
                mid: '50000',
                spreadBps: '0',
                inventorySkew: '0',
                quoteRefreshRate: '0',
                volatility: '0',
                paused: false,
                updatedAt: '',
            },
        ];
        const rows = buildExposureRows(inventory, quotes, null);
        expect(rows).toHaveLength(1);
        expect(rows[0]?.notional).toBe(100000);
        expect(rows[0]?.stressUp5).toBeCloseTo(5000);
        expect(rows[0]?.stressDown5).toBeCloseTo(-5000);
    });

    it('calculates pctOfLimit when config is provided', () => {
        const inventory = [
            {
                pair: 'BTC/USDT' as const,
                inventory: '5',
                normalizedSkew: '0',
                timestamp: '0',
            },
        ];
        const quotes = [
            {
                pair: 'BTC/USDT' as const,
                bid: '0',
                ask: '0',
                mid: '1',
                spreadBps: '0',
                inventorySkew: '0',
                quoteRefreshRate: '0',
                volatility: '0',
                paused: false,
                updatedAt: '',
            },
        ];
        const config = {
            pairs: [
                {
                    pair: 'BTC/USDT' as const,
                    maxInventory: '10',
                    baseSpreadBps: '10',
                    volatilityMultiplier: '1',
                    inventorySkewSensitivity: '0.5',
                    quoteRefreshIntervalMs: 500,
                    hedgeThreshold: '5',
                    hedgeExchange: 'Binance' as const,
                    enabled: true,
                    hedgingEnabled: true,
                },
            ],
        };
        const rows = buildExposureRows(inventory, quotes, config);
        expect(rows[0]?.pctOfLimit).toBeCloseTo(50);
    });
});
