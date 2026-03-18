'use client';

import type { FC } from 'react';
import { type RuntimeTopology } from '@crispy/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { BotDashboardPanel } from '@/components/dashboard/bot-dashboard-panel';
import { BotTabButton } from '@/components/dashboard/bot-tab-button';
import { GeoMapSection } from '@/components/dashboard/geo-map-section';
import { TopologyConfigSection } from '@/components/dashboard/topology-config-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchJson } from '@/lib/fetch-json';

export const MarketMakerDashboard: FC = () => {
  const queryClient = useQueryClient();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  const topologyQuery = useQuery({
    queryKey: ['topology'],
    queryFn: () => fetchJson<RuntimeTopology>('/api/topology'),
  });

  const topologyMutation = useMutation({
    mutationFn: async (payload: RuntimeTopology) => {
      const response = await fetch('/api/topology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('failed to update topology');
      }
      return (await response.json()) as RuntimeTopology;
    },
    onSuccess: (updatedTopology) => {
      const previousTopology = queryClient.getQueryData<RuntimeTopology>([
        'topology',
      ]);

      queryClient.setQueryData(['topology'], updatedTopology);

      if (
        previousTopology &&
        updatedTopology.bots.length > previousTopology.bots.length
      ) {
        setSelectedBotId(updatedTopology.bots[updatedTopology.bots.length - 1]?.id ?? null);
      } else {
        setSelectedBotId((current) =>
          current && updatedTopology.bots.some((bot) => bot.id === current)
            ? current
            : (updatedTopology.bots[0]?.id ?? null)
        );
      }

      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['fills'] });
      queryClient.invalidateQueries({ queryKey: ['pnl'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const topology = topologyQuery.data ?? null;
  const bots = topology?.bots ?? [];
  const activeBot = bots.find((bot) => bot.id === selectedBotId) ?? bots[0] ?? null;
  const topologyKey = topology ? JSON.stringify(topology) : 'topology-loading';

  return (
    <main className="mx-auto max-w-7xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div>
          <h1 className="text-xl font-semibold">Crispy Crypto Market Maker</h1>
          <p className="text-sm text-slate-400">
            Multi-bot market maker control plane with runtime topology routing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="default">{bots.length} bots configured</Badge>
          {topologyMutation.isPending ? (
            <Badge tone="warning">Applying topology...</Badge>
          ) : null}
        </div>
      </header>

      <TopologyConfigSection
        key={topologyKey}
        topology={topology}
        saving={topologyMutation.isPending}
        onSubmit={(next) => topologyMutation.mutate(next)}
      />

      {topologyQuery.isError ? (
        <Card>
          <CardContent className="py-4 text-sm text-red-300">
            Failed to load topology from `/api/topology`.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Bot Dashboards</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {bots.map((bot) => (
            <BotTabButton
              key={bot.id}
              bot={bot}
              active={activeBot?.id === bot.id}
              onClick={() => setSelectedBotId(bot.id)}
            />
          ))}
        </CardContent>
      </Card>

      {activeBot ? (
        <BotDashboardPanel key={activeBot.id} bot={activeBot} />
      ) : (
        <Card>
          <CardContent className="py-4 text-sm text-slate-300">
            No bots configured. Add at least one bot in Network Topology.
          </CardContent>
        </Card>
      )}

      {topology ? <GeoMapSection topology={topology} /> : null}
    </main>
  );
};
