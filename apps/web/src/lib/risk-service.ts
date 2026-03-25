import type {
    ExchangeHealth,
    Fill,
    InventorySnapshot,
    MMConfig,
    PnLSnapshot,
    QuoteSnapshot,
} from '@crispy/shared';

import {
    buildExecMetrics,
    buildExposureMetrics,
    buildMarketMetrics,
    buildPnlMetrics,
} from './risk-metrics';

export type RiskStatus = 'green' | 'yellow' | 'red';

export type RiskMetric = {
    metric: string;
    label: string;
    value: string;
    valueRaw: number;
    warn: number;
    critical: number;
    actionWarn: string;
    actionCritical: string;
    runbook: string;
    status: RiskStatus;
};

export type RiskSubsection = {
    title: string;
    metrics: RiskMetric[];
};

export type RiskReport = {
    overallStatus: RiskStatus;
    breaches: RiskMetric[];
    subsections: RiskSubsection[];
};

export function buildRiskReport(params: {
    inventory: InventorySnapshot[];
    quotes: QuoteSnapshot[];
    fills: Fill[];
    pnl: PnLSnapshot | null;
    health: ExchangeHealth[];
    config: MMConfig | null;
    killSwitchEngaged: boolean;
    connected: boolean;
}): RiskReport {
    const { inventory, quotes, fills, pnl, health, config, killSwitchEngaged, connected } =
        params;

    const exposureMetrics = buildExposureMetrics(inventory, quotes, config);
    const pnlMetrics = buildPnlMetrics(fills, pnl);
    const marketMetrics = buildMarketMetrics(health, quotes);
    const execMetrics = buildExecMetrics(health, quotes, killSwitchEngaged, connected);

    const subsections: RiskSubsection[] = [
        { title: 'Exposure', metrics: exposureMetrics },
        ...(pnlMetrics.length > 0
            ? [{ title: 'PnL Quality', metrics: pnlMetrics }]
            : []),
        { title: 'Market State', metrics: marketMetrics },
        { title: 'Execution Health', metrics: execMetrics },
    ];

    const allMetrics = subsections.flatMap((s) => s.metrics);

    const breaches = allMetrics
        .filter((m) => m.status !== 'green')
        .sort((a, b) => {
            const order: Record<RiskStatus, number> = { red: 0, yellow: 1, green: 2 };
            return order[a.status] - order[b.status];
        });

    const overallStatus: RiskStatus = breaches.some((m) => m.status === 'red')
        ? 'red'
        : breaches.some((m) => m.status === 'yellow')
          ? 'yellow'
          : 'green';

    return { overallStatus, breaches, subsections };
}
