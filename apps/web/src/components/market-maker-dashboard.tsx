'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import type { RuntimeTopology } from '@crispy/shared';
import { BotDashboardPanel } from '@/components/dashboard/bot-dashboard-panel';
import { DashboardHeaderNavLinks } from '@/components/dashboard/dashboard-header-nav-links';
import { BotTabButton } from '@/components/dashboard/bot-tab-button';
import { GeoMapSection } from '@/components/dashboard/geo-map/geo-map-section';
import { TopologyConfigSection } from '@/components/dashboard/topology-config/topology-config-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadTopologyFromStorage } from '@/lib/topology-storage';

import { useResetAllMutation } from './dashboard/use-reset-all-mutation';
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
    const resetAllMutation = useResetAllMutation();

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

    const resetAllData = () => resetAllMutation.mutate();
    const saveTopology = (next: RuntimeTopology) => topologyMutation.mutate(next);
    const selectBotTab = (id: string) => () => setSelectedBotId(id);

    return (
        <main className="w-full px-4 py-4">
            <motion.header
                className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 mb-4 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
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
                    <Button
                        variant="outline"
                        disabled={resetAllMutation.isPending}
                        onClick={resetAllData}
                    >
                        {resetAllMutation.isPending ? 'Resetting...' : 'Reset all test data'}
                    </Button>
                    <DashboardHeaderNavLinks activePage="dashboard" />
                    {topologyMutation.isPending && (
                        <Badge tone="warning">Applying topology...</Badge>
                    )}
                </div>
            </motion.header>
            <motion.div
                className="mx-auto max-w-7xl space-y-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <TopologyConfigSection
                    key={topologyKey}
                    topology={topology}
                    saving={topologyMutation.isPending}
                    onSubmit={saveTopology}
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
                                onClick={selectBotTab(bot.id)}
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
            </motion.div>
        </main>
    );
};
