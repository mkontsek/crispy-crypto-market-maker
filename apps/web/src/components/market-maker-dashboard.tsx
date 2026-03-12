'use client';

import type { RuntimeTopology } from '@crispy/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { BotDashboardPanel } from '@/components/dashboard/bot-dashboard-panel';
import { TopologyConfigSection } from '@/components/dashboard/topology-config-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchJson } from '@/lib/fetch-json';

export function MarketMakerDashboard() {
  const queryClient = useQueryClient();

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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topology'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['fills'] });
      queryClient.invalidateQueries({ queryKey: ['pnl'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const topology = topologyQuery.data ?? null;
  const bots = topology?.bots ?? [];

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

      {bots.map((bot) => (
        <BotDashboardPanel key={bot.id} bot={bot} />
      ))}
    </main>
  );
}
