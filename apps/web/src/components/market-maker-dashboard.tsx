'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { BotDashboardPanel } from '@/components/dashboard/bot-dashboard-panel';
import { DashboardHeaderNavLinks } from '@/components/dashboard/dashboard-header-nav-links';
import { BotTabButton } from '@/components/dashboard/bot-tab-button';
import { GeoMapSection } from '@/components/dashboard/geo-map/geo-map-section';
import { TopologyConfigSection } from '@/components/dashboard/topology-config/topology-config-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadTopologyFromStorage } from '@/lib/topology-storage';

import { useTopologyMutation } from './use-topology-mutation';
import { useTopologyQuery } from './use-topology-query';

function isDisconnectedExampleBot(name: string): boolean {
    return name.toLowerCase().includes('disconnected');
}

export const MarketMakerDashboard: FC = () => {
    const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

    const topologyQuery = useTopologyQuery();
    const topologyMutation = useTopologyMutation({ setSelectedBotId });
    const { mutate: restoreTopology } = topologyMutation;

    useEffect(() => {
        const saved = loadTopologyFromStorage();
        if (saved) {
            restoreTopology(saved);
        }
    }, [restoreTopology]);

    const topology = topologyQuery.data ?? null;
    const bots = topology?.bots ?? [];
    const activeBot =
        bots.find((bot) => bot.id === selectedBotId) ??
        bots.find((bot) => !isDisconnectedExampleBot(bot.name)) ??
        bots[0] ??
        null;
    const topologyKey = topology
        ? JSON.stringify(topology)
        : 'topology-loading';

    return (
        <main className="w-full px-4 py-4">
            <header className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">
                        Crispy Crypto Market Maker
                    </h1>
                    <p className="text-sm text-slate-400">
                        Multi-bot market maker control plane with runtime
                        topology routing.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DashboardHeaderNavLinks activePage="dashboard" />
                    {topologyMutation.isPending && (
                        <Badge tone="warning">Applying topology...</Badge>
                    )}
                </div>
            </header>
            <div className="mx-auto max-w-7xl space-y-4">
                <TopologyConfigSection
                    key={topologyKey}
                    topology={topology}
                    saving={topologyMutation.isPending}
                    onSubmit={(next) => topologyMutation.mutate(next)}
                />
                {topologyQuery.isError && (
                    <Card>
                        <CardContent className="py-4 text-sm text-red-300">
                            Failed to load topology from `/api/topology`.
                        </CardContent>
                    </Card>
                )}
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
                {activeBot && <BotDashboardPanel key={activeBot.id} bot={activeBot} />}
                {!activeBot && (
                    <Card>
                        <CardContent className="py-4 text-sm text-slate-300">
                            No bots configured. Add at least one bot in Network
                            Topology.
                        </CardContent>
                    </Card>
                )}
                {topology && <GeoMapSection topology={topology} />}
            </div>
        </main>
    );
};
