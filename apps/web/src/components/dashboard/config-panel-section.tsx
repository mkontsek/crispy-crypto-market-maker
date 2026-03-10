'use client';

import { EXCHANGES, type MMConfig } from '@crispy/shared';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ConfigPanelSection({
  config,
  saving,
  onSubmit,
}: {
  config: MMConfig | null;
  saving: boolean;
  onSubmit: (next: MMConfig) => void;
}) {
  const [draft, setDraft] = useState<MMConfig | null>(config);

  useEffect(() => {
    setDraft(config);
  }, [config]);

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
                onChange={(value) =>
                  patchPair(draft, setDraft, pairConfig.pair, {
                    baseSpreadBps: value,
                  })
                }
              />
              <DecimalField
                label="Vol multiplier"
                value={pairConfig.volatilityMultiplier}
                onChange={(value) =>
                  patchPair(draft, setDraft, pairConfig.pair, {
                    volatilityMultiplier: value,
                  })
                }
              />
              <DecimalField
                label="Max inventory"
                value={pairConfig.maxInventory}
                onChange={(value) =>
                  patchPair(draft, setDraft, pairConfig.pair, {
                    maxInventory: value,
                  })
                }
              />
              <DecimalField
                label="Skew sensitivity"
                value={pairConfig.inventorySkewSensitivity}
                onChange={(value) =>
                  patchPair(draft, setDraft, pairConfig.pair, {
                    inventorySkewSensitivity: value,
                  })
                }
              />
              <NumberField
                label="Refresh (ms)"
                value={pairConfig.quoteRefreshIntervalMs}
                onChange={(value) =>
                  patchPair(draft, setDraft, pairConfig.pair, {
                    quoteRefreshIntervalMs: Math.max(Math.floor(value), 50),
                  })
                }
              />
              <DecimalField
                label="Hedge threshold"
                value={pairConfig.hedgeThreshold}
                onChange={(value) =>
                  patchPair(draft, setDraft, pairConfig.pair, {
                    hedgeThreshold: value,
                  })
                }
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pairConfig.enabled}
                  onChange={(event) =>
                    patchPair(draft, setDraft, pairConfig.pair, {
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
                    patchPair(draft, setDraft, pairConfig.pair, {
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
                    patchPair(draft, setDraft, pairConfig.pair, {
                      hedgeExchange: selected,
                    });
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
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs text-slate-400">{label}</span>
      <input
        className="h-9 w-full rounded border border-slate-700 bg-slate-900 px-2"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function DecimalField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs text-slate-400">{label}</span>
      <input
        className="h-9 w-full rounded border border-slate-700 bg-slate-900 px-2"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function patchPair(
  draft: MMConfig,
  setDraft: (next: MMConfig) => void,
  pair: string,
  updates: Partial<MMConfig['pairs'][number]>
) {
  setDraft({
    pairs: draft.pairs.map((item) =>
      item.pair === pair
        ? {
            ...item,
            ...updates,
          }
        : item
    ),
  });
}
