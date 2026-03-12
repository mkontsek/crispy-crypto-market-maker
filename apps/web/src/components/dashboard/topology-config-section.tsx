'use client';

import type { BotId, RuntimeTopology } from '@crispy/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BotOverrides = Partial<
  Record<
    BotId,
    {
      wsUrl?: string;
      httpUrl?: string;
    }
  >
>;

export function TopologyConfigSection({
  topology,
  saving,
  onSubmit,
}: {
  topology: RuntimeTopology | null;
  saving: boolean;
  onSubmit: (next: RuntimeTopology) => void;
}) {
  const [exchangeWsUrlOverride, setExchangeWsUrlOverride] = useState<
    string | undefined
  >(undefined);
  const [exchangeHttpUrlOverride, setExchangeHttpUrlOverride] = useState<
    string | undefined
  >(undefined);
  const [botOverrides, setBotOverrides] = useState<BotOverrides>({});

  if (!topology) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Topology</CardTitle>
        </CardHeader>
        <CardContent>Loading topology configuration...</CardContent>
      </Card>
    );
  }

  const draft: RuntimeTopology = {
    exchangeWsUrl: exchangeWsUrlOverride ?? topology.exchangeWsUrl,
    exchangeHttpUrl: exchangeHttpUrlOverride ?? topology.exchangeHttpUrl,
    bots: topology.bots.map((bot) => ({
      ...bot,
      ...(botOverrides[bot.id] ?? {}),
    })),
  };

  const setBotField = (botId: BotId, key: 'wsUrl' | 'httpUrl', value: string) => {
    setBotOverrides((current) => ({
      ...current,
      [botId]: {
        ...(current[botId] ?? {}),
        [key]: value,
      },
    }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Network Topology</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setExchangeWsUrlOverride(undefined);
              setExchangeHttpUrlOverride(undefined);
              setBotOverrides({});
            }}
          >
            Reset
          </Button>
          <Button disabled={saving} onClick={() => onSubmit(draft)}>
            {saving ? 'Saving...' : 'Save Topology'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded border border-slate-800 p-3">
          <div className="mb-2 text-sm font-semibold">Exchange</div>
          <div className="grid gap-3 md:grid-cols-2">
            <UrlField
              label="Exchange WS URL"
              value={draft.exchangeWsUrl}
              onChange={setExchangeWsUrlOverride}
            />
            <UrlField
              label="Exchange HTTP URL"
              value={draft.exchangeHttpUrl}
              onChange={setExchangeHttpUrlOverride}
            />
          </div>
        </div>

        <div className="space-y-3">
          {draft.bots.map((bot) => (
            <div
              key={bot.id}
              className="rounded border border-slate-800 p-3 text-sm"
            >
              <div className="mb-2 font-semibold">
                {bot.name} ({bot.id})
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <UrlField
                  label="Bot WS URL"
                  value={bot.wsUrl}
                  onChange={(value) => setBotField(bot.id, 'wsUrl', value)}
                />
                <UrlField
                  label="Bot HTTP URL"
                  value={bot.httpUrl}
                  onChange={(value) => setBotField(bot.id, 'httpUrl', value)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UrlField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs text-slate-400">{label}</span>
      <input
        className="h-9 w-full rounded border border-slate-700 bg-slate-900 px-2"
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
