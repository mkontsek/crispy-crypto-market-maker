'use client';

import React, { useState, type FC } from 'react';

import type {
    ExchangeHealth,
    Fill,
    InventorySnapshot,
    MMConfig,
    PnLSnapshot,
    QuoteSnapshot,
} from '@crispy/shared';

import { InfoIcon } from '@/components/dashboard/live-quotes/info-icon';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { buildRiskReport, type RiskMetric, type RiskStatus } from '@/lib/risk-service';

import { RiskInfoDialog } from './risk-info-dialog';

type RiskSectionProps = {
    inventory: InventorySnapshot[];
    quotes: QuoteSnapshot[];
    fills: Fill[];
    pnl: PnLSnapshot | null;
    health: ExchangeHealth[];
    config: MMConfig | null;
    killSwitchEngaged: boolean;
    connected: boolean;
    loading: boolean;
};

function statusTone(status: RiskStatus): 'success' | 'warning' | 'danger' {
    if (status === 'red') return 'danger';
    if (status === 'yellow') return 'warning';
    return 'success';
}

function statusLabel(status: RiskStatus): string {
    if (status === 'red') return 'RED';
    if (status === 'yellow') return 'YELLOW';
    return 'GREEN';
}

const MetricRow: FC<{ metric: RiskMetric }> = ({ metric }) => (
    <tr className="border-t border-slate-800 text-sm">
        <td className="py-2 pr-4">{metric.label}</td>
        <td className="py-2 pr-4 font-mono">{metric.value}</td>
        <td className="py-2 pr-4">
            <Badge tone={statusTone(metric.status)}>
                {statusLabel(metric.status)}
            </Badge>
        </td>
        <td className="py-2 pr-4 text-slate-400">
            {metric.warn} / {metric.critical}
        </td>
        <td className="py-2 pr-4 text-slate-300">
            {metric.status === 'red'
                ? metric.actionCritical
                : metric.status === 'yellow'
                  ? metric.actionWarn
                  : '—'}
        </td>
        <td className="py-2 font-mono text-xs text-slate-500">
            {metric.runbook}
        </td>
    </tr>
);

export const RiskSection: FC<RiskSectionProps> = ({
    inventory,
    quotes,
    fills,
    pnl,
    health,
    config,
    killSwitchEngaged,
    connected,
    loading,
}) => {
    const [infoOpen, setInfoOpen] = useState(false);

    const openInfo = () => setInfoOpen(true);
    const closeInfo = () => setInfoOpen(false);

    const hasData =
        inventory.length > 0 ||
        quotes.length > 0 ||
        health.length > 0 ||
        pnl !== null;

    const report = buildRiskReport({
        inventory,
        quotes,
        fills,
        pnl,
        health,
        config,
        killSwitchEngaged,
        connected,
    });

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                        <CardTitle>Risk</CardTitle>
                        <button
                            type="button"
                            onClick={openInfo}
                            className="text-slate-500 transition hover:text-slate-300"
                            aria-label="Risk section information"
                        >
                            <InfoIcon />
                        </button>
                    </div>
                    {!loading && (
                        <Badge tone={statusTone(report.overallStatus)}>
                            {statusLabel(report.overallStatus)}
                            {report.breaches.length > 0 &&
                                ` — ${report.breaches.length} breach${report.breaches.length !== 1 ? 'es' : ''}`}
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading && !hasData && (
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full" />
                            ))}
                        </div>
                    )}

                    {!loading && !hasData && (
                        <p className="text-sm text-slate-400">
                            No risk data available yet.
                        </p>
                    )}

                    {hasData && (
                        <>
                            {report.breaches.length > 0 && (
                                <div>
                                    <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                                        Top Active Breaches
                                    </div>
                                    <ul className="space-y-1">
                                        {report.breaches
                                            .slice(0, 5)
                                            .map((breach) => (
                                                <li
                                                    key={breach.metric}
                                                    className="flex items-center gap-2 text-sm"
                                                >
                                                    <Badge
                                                        tone={statusTone(
                                                            breach.status
                                                        )}
                                                    >
                                                        {statusLabel(
                                                            breach.status
                                                        )}
                                                    </Badge>
                                                    <span className="font-medium">
                                                        {breach.label}
                                                    </span>
                                                    <span className="text-slate-400">
                                                        {breach.value}
                                                    </span>
                                                    {breach.status !==
                                                        'green' && (
                                                        <span className="text-xs text-slate-500">
                                                            →{' '}
                                                            {breach.status ===
                                                            'red'
                                                                ? breach.actionCritical
                                                                : breach.actionWarn}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] text-sm">
                                    <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                                        <tr>
                                            <th className="py-2 pr-4">
                                                Metric
                                            </th>
                                            <th className="py-2 pr-4">
                                                Value
                                            </th>
                                            <th className="py-2 pr-4">
                                                Status
                                            </th>
                                            <th className="py-2 pr-4">
                                                Warn / Critical
                                            </th>
                                            <th className="py-2 pr-4">
                                                Action
                                            </th>
                                            <th className="py-2">Runbook</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.subsections.map((sub) => (
                                            <React.Fragment key={sub.title}>
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="border-t border-slate-700 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
                                                    >
                                                        {sub.title}
                                                    </td>
                                                </tr>
                                                {sub.metrics.map((m) => (
                                                    <MetricRow
                                                        key={m.metric}
                                                        metric={m}
                                                    />
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3 text-sm">
                                <span className="text-xs uppercase tracking-wide text-slate-400">
                                    Safeguards
                                </span>
                                <Badge
                                    tone={
                                        killSwitchEngaged ? 'danger' : 'success'
                                    }
                                >
                                    Kill switch:{' '}
                                    {killSwitchEngaged
                                        ? 'ENGAGED'
                                        : 'disengaged'}
                                </Badge>
                                <Badge tone={connected ? 'success' : 'danger'}>
                                    Bot: {connected ? 'connected' : 'disconnected'}
                                </Badge>
                                {quotes.length > 0 && (
                                    <Badge
                                        tone={
                                            quotes.every((q) => q.paused)
                                                ? 'danger'
                                                : quotes.some((q) => q.paused)
                                                  ? 'warning'
                                                  : 'success'
                                        }
                                    >
                                        Pairs:{' '}
                                        {quotes.filter((q) => q.paused).length}{' '}
                                        / {quotes.length} paused
                                    </Badge>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <RiskInfoDialog open={infoOpen} onClose={closeInfo} />
        </>
    );
};
