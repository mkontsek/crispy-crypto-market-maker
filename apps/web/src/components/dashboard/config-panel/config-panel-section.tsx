'use client';

import type { FC } from 'react';
import { EXCHANGES, type MMConfig } from '@crispy/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfigNumberField } from './config-number-field';
import { DecimalField } from './decimal-field';

type ConfigPanelSectionProps = {
  config: MMConfig | null;
  saving: boolean;
  onSubmit: (next: MMConfig) => void;
};

export const ConfigPanelSection: FC<ConfigPanelSectionProps> = ({ config, saving, onSubmit }) => {
  const [pairOverrides, setPairOverrides] = useState<
    Record<string, Partial<MMConfig['pairs'][number]>>
  >({});

  const draft = config
    ? {
        pairs: config.pairs.map((pairConfig) => ({
          ...pairConfig,
          ...(pairOverrides[pairConfig.pair] ?? {}),
        })),
      }
    : null;

  const updatePair = (
    pair: string,
    updates: Partial<MMConfig['pairs'][number]>
  ) => {
    setPairOverrides((current) => ({
      ...current,
      [pair]: {
        ...(current[pair] ?? {}),
        ...updates,
      },
    }));
  };

  if (!draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MM Config Panel</CardTitle>
        </CardHeader>
        <CardContent>Waiting for first config payload from engine...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>MM Config Panel</CardTitle>
        <Button disabled={saving} onClick={() => onSubmit(draft)}>
          {saving ? 'Saving...' : 'Save Config'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {draft.pairs.map((pairConfig) => (
          <div key={pairConfig.pair} className="rounded border border-slate-800 p-3 text-sm">
            <div className="mb-2 font-semibold">{pairConfig.pair}</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <DecimalField
                label="Base spread bps"
                value={pairConfig.baseSpreadBps}
                onChange={(value) => updatePair(pairConfig.pair, { baseSpreadBps: value })}
              />
              <DecimalField
                label="Vol multiplier"
                value={pairConfig.volatilityMultiplier}
                onChange={(value) =>
                  updatePair(pairConfig.pair, { volatilityMultiplier: value })
                }
              />
              <DecimalField
                label="Max inventory"
                value={pairConfig.maxInventory}
                onChange={(value) => updatePair(pairConfig.pair, { maxInventory: value })}
              />
              <DecimalField
                label="Skew sensitivity"
                value={pairConfig.inventorySkewSensitivity}
                onChange={(value) =>
                  updatePair(pairConfig.pair, {
                    inventorySkewSensitivity: value,
                  })
                }
              />
              <ConfigNumberField
                label="Refresh (ms)"
                value={pairConfig.quoteRefreshIntervalMs}
                onChange={(value) =>
                  updatePair(pairConfig.pair, {
                    quoteRefreshIntervalMs: Math.max(Math.floor(value), 50),
                  })
                }
              />
              <DecimalField
                label="Hedge threshold"
                value={pairConfig.hedgeThreshold}
                onChange={(value) => updatePair(pairConfig.pair, { hedgeThreshold: value })}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pairConfig.enabled}
                  onChange={(event) =>
                    updatePair(pairConfig.pair, {
                      enabled: event.target.checked,
                    })
                  }
                />
                Enabled
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pairConfig.hedgingEnabled}
                  onChange={(event) =>
                    updatePair(pairConfig.pair, {
                      hedgingEnabled: event.target.checked,
                    })
                  }
                />
                Hedging enabled
              </label>
              <label className="space-y-1">
                <span className="block text-xs text-slate-400">Hedge exchange</span>
                <select
                  className="h-9 w-full rounded border border-slate-700 bg-slate-900 px-2"
                  value={pairConfig.hedgeExchange}
                  onChange={(event) => {
                    const selected = event.target.value as (typeof EXCHANGES)[number];
                    updatePair(pairConfig.pair, { hedgeExchange: selected });
                  }}
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
        ))}
      </CardContent>
    </Card>
  );
};
