import type { ChangeEvent, FC } from 'react';

import { EXCHANGES, type MMConfig } from '@crispy/shared';

import { ConfigNumberField } from './config-number-field';
import { DecimalField } from './decimal-field';

type PairConfig = MMConfig['pairs'][number];

type PairConfigRowProps = {
    pairConfig: PairConfig;
    onUpdate: (pair: string, updates: Partial<PairConfig>) => void;
};

export const PairConfigRow: FC<PairConfigRowProps> = ({
    pairConfig,
    onUpdate,
}) => {
    const updateBaseSpreadBps = (value: string) =>
        onUpdate(pairConfig.pair, { baseSpreadBps: value });

    const updateVolatilityMultiplier = (value: string) =>
        onUpdate(pairConfig.pair, { volatilityMultiplier: value });

    const updateMaxInventory = (value: string) =>
        onUpdate(pairConfig.pair, { maxInventory: value });

    const updateInventorySkewSensitivity = (value: string) =>
        onUpdate(pairConfig.pair, { inventorySkewSensitivity: value });

    const updateQuoteRefreshIntervalMs = (value: number) =>
        onUpdate(pairConfig.pair, {
            quoteRefreshIntervalMs: Math.max(Math.floor(value), 50),
        });

    const updateHedgeThreshold = (value: string) =>
        onUpdate(pairConfig.pair, { hedgeThreshold: value });

    const updateEnabled = (event: ChangeEvent<HTMLInputElement>) =>
        onUpdate(pairConfig.pair, { enabled: event.target.checked });

    const updateHedgingEnabled = (event: ChangeEvent<HTMLInputElement>) =>
        onUpdate(pairConfig.pair, { hedgingEnabled: event.target.checked });

    const updateHedgeExchange = (event: ChangeEvent<HTMLSelectElement>) => {
        const selected = event.target.value as (typeof EXCHANGES)[number];
        onUpdate(pairConfig.pair, { hedgeExchange: selected });
    };

    return (
        <div className="rounded border border-slate-800 p-3 text-sm">
            <div className="mb-2 font-semibold">{pairConfig.pair}</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <DecimalField
                    label="Base spread bps"
                    value={pairConfig.baseSpreadBps}
                    onChange={updateBaseSpreadBps}
                />
                <DecimalField
                    label="Vol multiplier"
                    value={pairConfig.volatilityMultiplier}
                    onChange={updateVolatilityMultiplier}
                />
                <DecimalField
                    label="Max inventory"
                    value={pairConfig.maxInventory}
                    onChange={updateMaxInventory}
                />
                <DecimalField
                    label="Skew sensitivity"
                    value={pairConfig.inventorySkewSensitivity}
                    onChange={updateInventorySkewSensitivity}
                />
                <ConfigNumberField
                    label="Refresh (ms)"
                    value={pairConfig.quoteRefreshIntervalMs}
                    onChange={updateQuoteRefreshIntervalMs}
                />
                <DecimalField
                    label="Hedge threshold"
                    value={pairConfig.hedgeThreshold}
                    onChange={updateHedgeThreshold}
                />
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={pairConfig.enabled}
                        onChange={updateEnabled}
                    />
                    Enabled
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={pairConfig.hedgingEnabled}
                        onChange={updateHedgingEnabled}
                    />
                    Hedging enabled
                </label>
                <label className="space-y-1">
                    <span className="block text-xs text-slate-400">
                        Hedge exchange
                    </span>
                    <select
                        className="h-9 w-full rounded border border-slate-700 bg-slate-900 px-2"
                        value={pairConfig.hedgeExchange}
                        onChange={updateHedgeExchange}
                    >
                        {EXCHANGES.map((exchange) => (
                            <option key={exchange} value={exchange}>
                                {exchange}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
        </div>
    );
};
