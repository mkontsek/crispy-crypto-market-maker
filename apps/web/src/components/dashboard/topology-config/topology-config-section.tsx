'use client';

import type { FC } from 'react';
import type { RuntimeTopology, TopologyBot } from '@crispy/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    buildNewBot,
    botUrlsFromDomain,
    cloneTopology,
    domainFromBotUrl,
    domainFromExchangeUrl,
    exchangeUrlsFromDomain,
} from '@/lib/topology-service';

import { TextField } from './text-field';

type TopologyConfigSectionProps = {
    topology: RuntimeTopology | null;
    saving: boolean;
    onSubmit: (next: RuntimeTopology) => void;
};

export const TopologyConfigSection: FC<TopologyConfigSectionProps> = ({
    topology,
    saving,
    onSubmit,
}) => {
    const [draft, setDraft] = useState<RuntimeTopology | null>(
        topology ? cloneTopology(topology) : null
    );
    const [isOpen, setIsOpen] = useState(false);

    if (!topology || !draft) {
        return (
            <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col items-center gap-2">
                        <CardTitle>Network Topology</CardTitle>
                        <Badge tone="default">
                            {topology?.bots.length ?? 0} bot(s) configured
                        </Badge>
                    </div>
                    <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setIsOpen((v) => !v)}
                        className="text-xs text-slate-400 hover:text-slate-200"
                    >
                        {isOpen ? '▲ Collapse' : '▼ Expand'}
                    </button>
                </CardHeader>
                {isOpen && (
                    <CardContent>Loading topology configuration...</CardContent>
                )}
            </Card>
        );
    }

    const setExchangeDomain = (domain: string) => {
        const { wsUrl, httpUrl } = exchangeUrlsFromDomain(domain);
        setDraft((current) =>
            current
                ? { ...current, exchangeWsUrl: wsUrl, exchangeHttpUrl: httpUrl }
                : current
        );
    };

    const setBotField = (
        botId: string,
        key: keyof TopologyBot,
        value: string
    ) => {
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

    const setBotDomain = (botId: string, domain: string) => {
        const { wsUrl, httpUrl } = botUrlsFromDomain(domain);
        setDraft((current) =>
            current
                ? {
                      ...current,
                      bots: current.bots.map((bot) =>
                          bot.id === botId
                              ? { ...bot, wsUrl, httpUrl }
                              : bot
                      ),
                  }
                : current
        );
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
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                    <CardTitle>Network Topology</CardTitle>
                    <Badge tone="default">
                        {draft.bots.length} bot(s) configured
                    </Badge>
                </div>
                <div className="flex items-center justify-end gap-2">
                    {isOpen && (
                        <Button
                            className="h-6"
                            disabled={saving}
                            onClick={() => onSubmit(draft)}
                        >
                            {saving ? 'Saving...' : 'Save Topology'}
                        </Button>
                    )}
                    <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setIsOpen((v) => !v)}
                        className={cn(
                            'text-xs text-slate-400 hover:text-slate-200'
                        )}
                    >
                        {isOpen ? '▲ Collapse' : '▼ Expand'}
                    </button>
                </div>
            </CardHeader>
            {isOpen && (
                <CardContent className="space-y-4">
                    <p className="text-xs text-slate-400">
                        Remote hosts must use secure endpoints (`wss://` and
                        `https://`). For localhost development, `ws://` and
                        `http://` are allowed.
                    </p>

                    <div className="rounded border border-slate-800 p-3">
                        <div className="mb-2 text-sm font-semibold">
                            Exchange
                        </div>
                        <TextField
                            label="Exchange Domain"
                            value={domainFromExchangeUrl(draft.exchangeWsUrl)}
                            onChange={setExchangeDomain}
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
                                <div className="grid gap-3 md:grid-cols-2">
                                    <TextField
                                        label="Bot Name"
                                        value={bot.name}
                                        onChange={(value) =>
                                            setBotField(bot.id, 'name', value)
                                        }
                                    />
                                    <TextField
                                        label="Bot Domain"
                                        value={domainFromBotUrl(bot.wsUrl)}
                                        onChange={(value) =>
                                            setBotDomain(bot.id, value)
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <Button
                            variant="outline"
                            disabled={saving}
                            onClick={addBot}
                        >
                            <span
                                aria-hidden
                                className="mr-1 text-base leading-none"
                            >
                                +
                            </span>
                            Add Bot
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
