'use client';

import type { FC } from 'react';
import type { Strategy } from '@crispy/shared';
import { STRATEGIES } from '@crispy/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STRATEGY_LABELS: Record<Strategy, string> = {
    conservative: 'Conservative',
    balanced: 'Balanced',
    aggressive: 'Aggressive',
};

const STRATEGY_DESCRIPTIONS: Record<Strategy, string> = {
    conservative: 'Wide spreads · Low inventory · Frequent hedging',
    balanced: 'Moderate spreads · Standard inventory · Auto-hedging',
    aggressive: 'Tight spreads · High inventory · No hedging',
};

type StrategySectionProps = {
    strategy: Strategy;
    pending: boolean;
    onSelect: (strategy: Strategy) => void;
};

export const StrategySection: FC<StrategySectionProps> = ({
    strategy,
    pending,
    onSelect,
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Strategy</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-3">
                    {STRATEGIES.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            disabled={pending}
                            onClick={() => onSelect(preset)}
                            className={[
                                'rounded border p-3 text-left transition',
                                strategy === preset
                                    ? 'border-sky-500 bg-sky-950 text-sky-200'
                                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500',
                                pending ? 'opacity-50 cursor-not-allowed' : '',
                            ].join(' ')}
                        >
                            <div className="mb-1 text-sm font-semibold">
                                {STRATEGY_LABELS[preset]}
                            </div>
                            <div className="text-xs text-slate-400">
                                {STRATEGY_DESCRIPTIONS[preset]}
                            </div>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
