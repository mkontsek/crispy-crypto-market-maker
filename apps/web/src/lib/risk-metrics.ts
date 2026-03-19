import type {
    ExchangeHealth,
    Fill,
    InventorySnapshot,
    MMConfig,
    PnLSnapshot,
    QuoteSnapshot,
} from '@crispy/shared';

import { buildExposureRows } from './exposure-service';
import { priceFromFp, ratioFromDecimal } from './fixed-point';
import type { RiskMetric, RiskStatus } from './risk-service';

export function statusFromThresholds(
    value: number,
    warn: number,
    critical: number,
    lowerIsBad = false
): RiskStatus {
    if (lowerIsBad) {
        if (value <= critical) return 'red';
        if (value <= warn) return 'yellow';
        return 'green';
    }
    if (value >= critical) return 'red';
    if (value >= warn) return 'yellow';
    return 'green';
}

export function buildExposureMetrics(
    inventory: InventorySnapshot[],
    quotes: QuoteSnapshot[],
    config: MMConfig | null
): RiskMetric[] {
    const exposureRows = buildExposureRows(inventory, quotes, config);
    const maxSkew = inventory.reduce(
        (max, inv) => Math.max(max, Math.abs(ratioFromDecimal(inv.normalizedSkew))),
        0
    );
    const maxPctFrac =
        exposureRows.reduce((max, row) => Math.max(max, row.pctOfLimit), 0) / 100;
    const totalNotional = exposureRows.reduce(
        (sum, row) => sum + Math.abs(row.notional),
        0
    );
    return [
        {
            metric: 'inventory_skew_pct',
            label: 'Max Inventory Skew',
            value: `${(maxSkew * 100).toFixed(1)}%`,
            valueRaw: maxSkew,
            warn: 0.25,
            critical: 0.4,
            actionWarn: 'Reduce order size 50%',
            actionCritical: 'Disable aggressive side',
            runbook: '/runbooks/inventory-skew.md',
            status: statusFromThresholds(maxSkew, 0.25, 0.4),
        },
        {
            metric: 'position_pct_of_limit',
            label: 'Max Position (% of Limit)',
            value: `${(maxPctFrac * 100).toFixed(1)}%`,
            valueRaw: maxPctFrac,
            warn: 0.7,
            critical: 0.9,
            actionWarn: 'Reduce order size',
            actionCritical: 'Pause new quotes',
            runbook: '/runbooks/position-limit.md',
            status: statusFromThresholds(maxPctFrac, 0.7, 0.9),
        },
        {
            metric: 'total_notional_usd',
            label: 'Total Notional (USD)',
            value: `$${totalNotional.toFixed(2)}`,
            valueRaw: totalNotional,
            warn: 10000,
            critical: 25000,
            actionWarn: 'Review position sizing',
            actionCritical: 'Halt quoting',
            runbook: '/runbooks/notional-limit.md',
            status: statusFromThresholds(totalNotional, 10000, 25000),
        },
    ];
}

export function buildPnlMetrics(
    fills: Fill[],
    pnl: PnLSnapshot | null
): RiskMetric[] {
    const metrics: RiskMetric[] = [];

    if (fills.length > 0) {
        const avgSpread =
            fills.reduce((sum, f) => sum + priceFromFp(f.realizedSpread), 0) /
            fills.length;
        metrics.push({
            metric: 'avg_realized_spread',
            label: 'Avg Realized Spread',
            value: avgSpread.toFixed(4),
            valueRaw: avgSpread,
            warn: 0,
            critical: -0.001,
            actionWarn: 'Monitor spread competitiveness',
            actionCritical: 'Review pricing & tighten spread',
            runbook: '/runbooks/spread-capture.md',
            status: statusFromThresholds(avgSpread, 0, -0.001, true),
        });
    }

    if (pnl) {
        const adverseRate = ratioFromDecimal(pnl.adverseSelectionRate);
        const fillRate = ratioFromDecimal(pnl.fillRate);
        const hedgingCosts = priceFromFp(pnl.hedgingCosts);
        metrics.push(
            {
                metric: 'adverse_selection_rate',
                label: 'Adverse Selection Rate',
                value: `${(adverseRate * 100).toFixed(1)}%`,
                valueRaw: adverseRate,
                warn: 0.3,
                critical: 0.5,
                actionWarn: 'Widen spread',
                actionCritical: 'Pause quoting & review',
                runbook: '/runbooks/adverse-selection.md',
                status: statusFromThresholds(adverseRate, 0.3, 0.5),
            },
            {
                metric: 'fill_rate',
                label: 'Fill Rate',
                value: `${(fillRate * 100).toFixed(2)}%`,
                valueRaw: fillRate,
                warn: 0.05,
                critical: 0.01,
                actionWarn: 'Check quote competitiveness',
                actionCritical: 'Reduce spread',
                runbook: '/runbooks/fill-rate.md',
                status: statusFromThresholds(fillRate, 0.05, 0.01, true),
            },
            {
                metric: 'hedging_costs',
                label: 'Hedging Costs',
                value: hedgingCosts.toFixed(4),
                valueRaw: hedgingCosts,
                warn: 10,
                critical: 50,
                actionWarn: 'Review hedge threshold',
                actionCritical: 'Disable auto-hedge',
                runbook: '/runbooks/hedging-costs.md',
                status: statusFromThresholds(hedgingCosts, 10, 50),
            }
        );
    }

    return metrics;
}

export function buildMarketMetrics(
    health: ExchangeHealth[],
    quotes: QuoteSnapshot[]
): RiskMetric[] {
    const maxStalenessMs = health.reduce(
        (max, h) => Math.max(max, priceFromFp(h.feedStalenessMs)),
        0
    );
    const maxVolatility = quotes.reduce(
        (max, q) => Math.max(max, priceFromFp(q.volatility)),
        0
    );
    const maxTickLatencyMs = health.reduce(
        (max, h) => Math.max(max, priceFromFp(h.tickLatencyMs)),
        0
    );
    return [
        {
            metric: 'feed_staleness_ms',
            label: 'Max Feed Staleness (ms)',
            value: `${maxStalenessMs.toFixed(0)} ms`,
            valueRaw: maxStalenessMs,
            warn: 1000,
            critical: 2000,
            actionWarn: 'Widen spread on stale pairs',
            actionCritical: 'Pause affected pairs',
            runbook: '/runbooks/feed-staleness.md',
            status: statusFromThresholds(maxStalenessMs, 1000, 2000),
        },
        {
            metric: 'realized_volatility',
            label: 'Max Pair Volatility',
            value: `${(maxVolatility * 100).toFixed(2)}%`,
            valueRaw: maxVolatility,
            warn: 0.02,
            critical: 0.05,
            actionWarn: 'Apply volatility multiplier',
            actionCritical: 'Widen spread significantly or pause',
            runbook: '/runbooks/volatility-regime.md',
            status: statusFromThresholds(maxVolatility, 0.02, 0.05),
        },
        {
            metric: 'tick_latency_ms',
            label: 'Max Tick Latency (ms)',
            value: `${maxTickLatencyMs.toFixed(1)} ms`,
            valueRaw: maxTickLatencyMs,
            warn: 100,
            critical: 500,
            actionWarn: 'Monitor & alert',
            actionCritical: 'Pause quoting',
            runbook: '/runbooks/tick-latency.md',
            status: statusFromThresholds(maxTickLatencyMs, 100, 500),
        },
    ];
}

export function buildExecMetrics(
    health: ExchangeHealth[],
    quotes: QuoteSnapshot[],
    killSwitchEngaged: boolean,
    connected: boolean
): RiskMetric[] {
    const disconnectedCount = health.filter((h) => !h.connected).length;
    const pausedCount = quotes.filter((q) => q.paused).length;
    return [
        {
            metric: 'bot_connected',
            label: 'Bot Connection',
            value: connected ? 'connected' : 'disconnected',
            valueRaw: connected ? 0 : 1,
            warn: 0.5,
            critical: 1,
            actionWarn: '',
            actionCritical: 'Reconnect or restart bot',
            runbook: '/runbooks/bot-connectivity.md',
            status: connected ? 'green' : 'red',
        },
        {
            metric: 'exchange_disconnects',
            label: 'Disconnected Feeds',
            value: `${disconnectedCount} / ${health.length}`,
            valueRaw: disconnectedCount,
            warn: 1,
            critical: health.length > 0 ? health.length : 1,
            actionWarn: 'Alert & monitor',
            actionCritical: 'Engage kill switch',
            runbook: '/runbooks/exchange-connectivity.md',
            status: statusFromThresholds(
                disconnectedCount,
                1,
                health.length > 0 ? health.length : 1
            ),
        },
        {
            metric: 'paused_pairs',
            label: 'Paused Pairs',
            value: `${pausedCount} / ${quotes.length}`,
            valueRaw: pausedCount,
            warn: 1,
            critical: quotes.length > 0 ? quotes.length : 1,
            actionWarn: 'Investigate & resume if safe',
            actionCritical: 'Review all pairs and resume',
            runbook: '/runbooks/paused-pairs.md',
            status: statusFromThresholds(
                pausedCount,
                1,
                quotes.length > 0 ? quotes.length : 1
            ),
        },
        {
            metric: 'kill_switch',
            label: 'Kill Switch',
            value: killSwitchEngaged ? 'ENGAGED' : 'disengaged',
            valueRaw: killSwitchEngaged ? 1 : 0,
            warn: 0.5,
            critical: 1,
            actionWarn: '',
            actionCritical: 'Disengage when safe & root cause identified',
            runbook: '/runbooks/kill-switch.md',
            status: killSwitchEngaged ? 'red' : 'green',
        },
    ];
}
