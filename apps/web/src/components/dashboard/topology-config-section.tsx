'use client';

import type { GeoLocation, RuntimeTopology, TopologyBot } from '@crispy/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  LocationFields,
  TextField,
  UrlField,
} from './topology-config-fields';

function cloneTopology(topology: RuntimeTopology): RuntimeTopology {
  return {
    exchangeWsUrl: topology.exchangeWsUrl,
    exchangeHttpUrl: topology.exchangeHttpUrl,
    exchangeLocation: topology.exchangeLocation,
    bots: topology.bots.map((bot) => ({ ...bot })),
  };
}

function defaultBotName(botId: string) {
  const suffix = botId.replace(/^bot-/, '').replace(/-/g, ' ').trim();
  return suffix.length > 0 ? `Bot ${suffix}` : 'Bot';
}

function nextBotId(existingBots: TopologyBot[]) {
  const existingIds = new Set(existingBots.map((bot) => bot.id));
  let counter = existingBots.length + 1;
  while (existingIds.has(`bot-${counter}`)) {
    counter += 1;
  }
  return `bot-${counter}`;
}

function buildNewBot(existingBots: TopologyBot[]): TopologyBot {
  const botId = nextBotId(existingBots);
  return {
    id: botId,
    name: defaultBotName(botId),
    wsUrl: `wss://${botId}.example.com/stream`,
    httpUrl: `https://${botId}.example.com`,
  };
}

function applyLocationField(
  prev: GeoLocation | undefined,
  field: keyof GeoLocation,
  value: string
): GeoLocation {
  const base = prev ?? { lat: 0, lng: 0 };
  if (field === 'label') return { ...base, label: value || undefined };
  const parsed = parseFloat(value);
  return { ...base, [field]: Number.isFinite(parsed) ? parsed : (base[field] as number) };
}

export function TopologyConfigSection({
  topology,
  saving,
  onSubmit,
}: {
  topology: RuntimeTopology | null;
  saving: boolean;
  onSubmit: (next: RuntimeTopology) => void;
}) {
  const [draft, setDraft] = useState<RuntimeTopology | null>(
    topology ? cloneTopology(topology) : null
  );

  if (!topology || !draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Topology</CardTitle>
        </CardHeader>
        <CardContent>Loading topology configuration...</CardContent>
      </Card>
    );
  }

  const setExchangeField = (
    key: 'exchangeWsUrl' | 'exchangeHttpUrl',
    value: string
  ) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const setExchangeLocation = (field: keyof GeoLocation, value: string) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        exchangeLocation: applyLocationField(current.exchangeLocation, field, value),
      };
    });
  };

  const setBotField = (botId: string, key: keyof TopologyBot, value: string) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            bots: current.bots.map((bot) =>
              bot.id === botId ? { ...bot, [key]: value } : bot
            ),
          }
        : current
    );
  };

  const setBotLocation = (botId: string, field: keyof GeoLocation, value: string) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        bots: current.bots.map((bot) =>
          bot.id !== botId
            ? bot
            : { ...bot, location: applyLocationField(bot.location, field, value) }
        ),
      };
    });
  };

  const removeBot = (botId: string) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            bots:
              current.bots.length > 1
                ? current.bots.filter((bot) => bot.id !== botId)
                : current.bots,
          }
        : current
    );
  };

  const addBot = () => {
    const nextDraft: RuntimeTopology = {
      ...draft,
      bots: [...draft.bots, buildNewBot(draft.bots)],
    };
    setDraft(nextDraft);
    onSubmit(nextDraft);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Network Topology</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setDraft(cloneTopology(topology))}>
            Reset
          </Button>
          <Button disabled={saving} onClick={() => onSubmit(draft)}>
            {saving ? 'Saving...' : 'Save Topology'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-400">
          Remote hosts must use secure endpoints (`wss://` and `https://`). For
          localhost development, `ws://` and `http://` are allowed.
        </p>

        <div className="rounded border border-slate-800 p-3">
          <div className="mb-2 text-sm font-semibold">Exchange</div>
          <div className="grid gap-3 md:grid-cols-2">
            <UrlField
              label="Exchange WSS URL"
              value={draft.exchangeWsUrl}
              onChange={(value) => setExchangeField('exchangeWsUrl', value)}
            />
            <UrlField
              label="Exchange HTTPS API URL"
              value={draft.exchangeHttpUrl}
              onChange={(value) => setExchangeField('exchangeHttpUrl', value)}
            />
          </div>
          <LocationFields
            location={draft.exchangeLocation}
            onChangeField={setExchangeLocation}
          />
        </div>

        <div className="space-y-3">
          {draft.bots.map((bot) => (
            <div
              key={bot.id}
              className="rounded border border-slate-800 p-3 text-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="font-semibold">
                  {bot.name} ({bot.id})
                </div>
                <Button
                  variant="danger"
                  disabled={draft.bots.length <= 1}
                  onClick={() => removeBot(bot.id)}
                >
                  Remove Bot
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <TextField
                  label="Bot Name"
                  value={bot.name}
                  onChange={(value) => setBotField(bot.id, 'name', value)}
                />
                <UrlField
                  label="Bot WSS URL"
                  value={bot.wsUrl}
                  onChange={(value) => setBotField(bot.id, 'wsUrl', value)}
                />
                <UrlField
                  label="Bot HTTPS API URL"
                  value={bot.httpUrl}
                  onChange={(value) => setBotField(bot.id, 'httpUrl', value)}
                />
              </div>
              <LocationFields
                location={bot.location}
                onChangeField={(field, value) => setBotLocation(bot.id, field, value)}
              />
            </div>
          ))}
        </div>

        <div>
          <Button variant="outline" disabled={saving} onClick={addBot}>
            <span aria-hidden className="mr-1 text-base leading-none">
              +
            </span>
            Add Bot
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
