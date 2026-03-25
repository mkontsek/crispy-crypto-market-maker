import { describe, expect, it } from 'vitest';

import { buildRiskReport } from '../risk-service';

const baseParams = {
    inventory: [],
    quotes: [],
    fills: [],
    pnl: null,
    health: [],
    config: null,
    killSwitchEngaged: false,
    connected: true,
};

describe('buildRiskReport', () => {
    it('returns green overall status when no data is present', () => {
        const report = buildRiskReport(baseParams);
        expect(report.overallStatus).toBe('green');
        expect(report.breaches).toHaveLength(0);
    });

    it('returns red when bot is disconnected', () => {
        const report = buildRiskReport({ ...baseParams, connected: false });
        expect(report.overallStatus).toBe('red');
        const botMetric = report.breaches.find(
            (m) => m.metric === 'bot_connected'
        );
        expect(botMetric?.status).toBe('red');
    });

    it('returns red when kill switch is engaged', () => {
        const report = buildRiskReport({
            ...baseParams,
            killSwitchEngaged: true,
        });
        const killMetric = report.subsections
            .flatMap((s) => s.metrics)
            .find((m) => m.metric === 'kill_switch');
        expect(killMetric?.status).toBe('red');
    });

    it('returns yellow for inventory skew above warn threshold', () => {
        const inventory = [
            {
                pair: 'BTC/USDT' as const,
                inventory: '1',
                normalizedSkew: '0.30',
                timestamp: '0',
            },
        ];
        const report = buildRiskReport({ ...baseParams, inventory });
        const skewMetric = report.subsections
            .flatMap((s) => s.metrics)
            .find((m) => m.metric === 'inventory_skew_pct');
        expect(skewMetric?.status).toBe('yellow');
    });

    it('returns red for inventory skew above critical threshold', () => {
        const inventory = [
            {
                pair: 'BTC/USDT' as const,
                inventory: '1',
                normalizedSkew: '0.45',
                timestamp: '0',
            },
        ];
        const report = buildRiskReport({ ...baseParams, inventory });
        const skewMetric = report.subsections
            .flatMap((s) => s.metrics)
            .find((m) => m.metric === 'inventory_skew_pct');
        expect(skewMetric?.status).toBe('red');
    });

    it('returns red for disconnected exchange feeds', () => {
        const health = [
            {
                pair: 'BTC/USDT' as const,
                exchange: 'Binance' as const,
                tickLatencyMs: '10',
                feedStalenessMs: '100',
                connected: false,
            },
        ];
        const report = buildRiskReport({ ...baseParams, health });
        const disconnectMetric = report.subsections
            .flatMap((s) => s.metrics)
            .find((m) => m.metric === 'exchange_disconnects');
        expect(disconnectMetric?.status).toBe('red');
    });

    it('returns yellow for high adverse selection rate', () => {
        const pnl = {
            timestamp: '0',
            totalPnl: '100',
            realizedSpread: '200',
            hedgingCosts: '5',
            adverseSelectionRate: '0.35',
            fillRate: '0.10',
        };
        const report = buildRiskReport({ ...baseParams, pnl });
        const adverseMetric = report.subsections
            .flatMap((s) => s.metrics)
            .find((m) => m.metric === 'adverse_selection_rate');
        expect(adverseMetric?.status).toBe('yellow');
    });

    it('returns yellow for low fill rate', () => {
        const pnl = {
            timestamp: '0',
            totalPnl: '100',
            realizedSpread: '200',
            hedgingCosts: '5',
            adverseSelectionRate: '0.10',
            fillRate: '0.03',
        };
        const report = buildRiskReport({ ...baseParams, pnl });
        const fillRateMetric = report.subsections
            .flatMap((s) => s.metrics)
            .find((m) => m.metric === 'fill_rate');
        expect(fillRateMetric?.status).toBe('yellow');
    });

    it('returns red for stale feed above critical threshold', () => {
        const health = [
            {
                pair: 'ETH/USDT' as const,
                exchange: 'Binance' as const,
                tickLatencyMs: '10',
                feedStalenessMs: '3000',
                connected: true,
            },
        ];
        const report = buildRiskReport({ ...baseParams, health });
        const stalenessMetric = report.subsections
            .flatMap((s) => s.metrics)
            .find((m) => m.metric === 'feed_staleness_ms');
        expect(stalenessMetric?.status).toBe('red');
    });

    it('breaches list is sorted red before yellow', () => {
        const health = [
            {
                pair: 'BTC/USDT' as const,
                exchange: 'Binance' as const,
                tickLatencyMs: '10',
                feedStalenessMs: '3000',
                connected: false,
            },
        ];
        const inventory = [
            {
                pair: 'BTC/USDT' as const,
                inventory: '1',
                normalizedSkew: '0.30',
                timestamp: '0',
            },
        ];
        const report = buildRiskReport({ ...baseParams, health, inventory });
        const statuses = report.breaches.map((m) => m.status);
        const firstYellowIdx = statuses.indexOf('yellow');
        const lastRedIdx = statuses.lastIndexOf('red');
        if (firstYellowIdx !== -1 && lastRedIdx !== -1) {
            expect(lastRedIdx).toBeLessThan(firstYellowIdx);
        }
    });

    it('includes PnL Quality subsection when pnl or fills data is provided', () => {
        const withoutPnlOrFills = buildRiskReport(baseParams);
        const pnlSubsection = withoutPnlOrFills.subsections.find(
            (s) => s.title === 'PnL Quality'
        );
        expect(pnlSubsection).toBeUndefined();

        const pnl = {
            timestamp: '0',
            totalPnl: '100',
            realizedSpread: '200',
            hedgingCosts: '5',
            adverseSelectionRate: '0.10',
            fillRate: '0.10',
        };
        const withPnl = buildRiskReport({ ...baseParams, pnl });
        expect(
            withPnl.subsections.find((s) => s.title === 'PnL Quality')
        ).toBeDefined();

        const fills = [
            {
                id: 'f1',
                pair: 'BTC/USDT' as const,
                side: 'buy' as const,
                price: '50000',
                size: '0.1',
                midAtFill: '50001',
                realizedSpread: '0.0010',
                adverseSelection: false,
                timestamp: '0',
            },
        ];
        const withFills = buildRiskReport({ ...baseParams, fills });
        expect(
            withFills.subsections.find((s) => s.title === 'PnL Quality')
        ).toBeDefined();
    });

    it('overall status is worst of all metric statuses', () => {
        const report = buildRiskReport({ ...baseParams, connected: false });
        expect(report.overallStatus).toBe('red');
    });
});
