'use client';

import { Activity, Wifi } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useBotStore } from '@/stores/botStore';
import Link from 'next/link';

export function GlobalHeader() {
    const {
        mode,
        setMode,
        pnl24h,
        pnlPercent24h,
        inventory,
        wsLatency,
        wsConnected,
    } = useBotStore();

    const isLive = mode === 'live';

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
            <div className="flex h-14 items-center justify-between px-6">
                {/* Brand */}
                <div className="flex items-center gap-3">
                    <Activity className="size-5 text-electric-blue" />
                    <Link href="/">
                        <Button
                            variant="ghost"
                            className="text-sm font-semibold tracking-wider text-slate-100 cursor-pointer hover:text-slate-100"
                        >
                            CRISPY{' '}
                            <span className="text-electric-blue">MM</span>
                        </Button>
                    </Link>
                </div>

                {/* Center metrics */}
                <div className="flex items-center gap-8">
                    {/* WS Status */}
                    <div className="flex items-center gap-2">
                        <span className="relative flex size-2">
                            <span
                                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                                    wsConnected
                                        ? 'bg-neon-green'
                                        : 'bg-neon-red'
                                }`}
                            />
                            <span
                                className={`relative inline-flex size-2 rounded-full ${
                                    wsConnected
                                        ? 'bg-neon-green'
                                        : 'bg-neon-red'
                                }`}
                            />
                        </span>
                        <span className="text-xs text-slate-400">
                            WS:{' '}
                            <span
                                className={
                                    wsConnected
                                        ? 'text-neon-green'
                                        : 'text-neon-red'
                                }
                            >
                                {wsConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </span>
                        <span className="font-mono text-xs text-slate-500">
                            Latency:{' '}
                            <span className="text-slate-300">
                                {wsLatency}ms
                            </span>
                        </span>
                    </div>

                    <div className="h-4 w-px bg-slate-700" />

                    {/* 24h PnL */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">24h PnL</span>
                        <span className="font-mono text-sm font-semibold text-neon-green">
                            +$
                            {pnl24h.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                            })}
                        </span>
                        <Badge className="border-neon-green/30 bg-neon-green/10 font-mono text-xs text-neon-green">
                            +{pnlPercent24h}%
                        </Badge>
                    </div>

                    <div className="h-4 w-px bg-slate-700" />

                    {/* Inventory */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">
                            Inventory
                        </span>
                        <span className="font-mono text-sm font-medium text-slate-200">
                            $
                            {inventory.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                            })}{' '}
                            USDT
                        </span>
                    </div>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={isLive ? 'outline' : 'default'}
                        size="sm"
                        className={`font-mono text-xs tracking-widest ${
                            !isLive
                                ? 'border-electric-blue bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30'
                                : 'border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        onClick={() => setMode('simulation')}
                    >
                        SIMULATION
                    </Button>
                    <Button
                        variant={isLive ? 'destructive' : 'outline'}
                        size="sm"
                        className={`font-mono text-xs tracking-widest ${
                            isLive
                                ? 'bg-neon-red hover:bg-neon-red/90'
                                : 'border-slate-700 text-slate-400 hover:border-neon-red hover:text-neon-red'
                        }`}
                        onClick={() => setMode('live')}
                    >
                        <Wifi className="size-3" />
                        LIVE
                    </Button>
                </div>
            </div>
        </header>
    );
}
