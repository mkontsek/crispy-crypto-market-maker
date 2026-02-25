'use client';

import { useBotStore } from '@/stores/botStore';

export function InventorySkewGauge() {
    const { inventorySkew } = useBotStore();

    // inventorySkew: -100 (full short/USDT) to +100 (full long/asset)
    const clampedSkew = Math.max(-100, Math.min(100, inventorySkew));
    const isLong = clampedSkew >= 0;
    const absPct = Math.abs(clampedSkew);

    // Position of indicator on the bar (0-100%)
    const indicatorLeft = ((clampedSkew + 100) / 200) * 100;

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-semibold text-slate-200">
                    Inventory Skew
                </span>
                <span
                    className={`font-mono text-sm font-bold ${
                        isLong ? 'text-neon-green' : 'text-neon-red'
                    }`}
                >
                    {isLong ? '+' : ''}
                    {clampedSkew.toFixed(1)}%
                </span>
            </div>

            <div className="flex flex-col gap-2">
                {/* Labels */}
                <div className="flex justify-between">
                    <span className="font-mono text-[10px] text-neon-red">
                        ◀ SHORT / USDT Heavy
                    </span>
                    <span className="font-mono text-[10px] text-neon-green">
                        LONG / Asset Heavy ▶
                    </span>
                </div>

                {/* Bar track */}
                <div className="relative h-5 overflow-hidden rounded-full bg-slate-800">
                    {/* Left (red) fill */}
                    {!isLong && (
                        <div
                            className="absolute inset-y-0 left-0 bg-neon-red/60 transition-all duration-500"
                            style={{
                                width: `${50 - absPct / 2}%`,
                                right: '50%',
                            }}
                        />
                    )}

                    {/* Gradient bar background */}
                    <div
                        className="absolute inset-y-0 h-full w-full"
                        style={{
                            background:
                                'linear-gradient(to right, #FF4D4D22, #FF4D4D44 25%, #1e293b 50%, #00E59944 75%, #00E59922)',
                        }}
                    />

                    {/* Active fill */}
                    {!isLong && (
                        <div
                            className="absolute inset-y-0 bg-neon-red/40 transition-all duration-500"
                            style={{
                                right: '50%',
                                width: `${absPct / 2}%`,
                            }}
                        />
                    )}
                    {isLong && (
                        <div
                            className="absolute inset-y-0 bg-neon-green/40 transition-all duration-500"
                            style={{
                                left: '50%',
                                width: `${absPct / 2}%`,
                            }}
                        />
                    )}

                    {/* Center marker */}
                    <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-px bg-slate-400/50" />

                    {/* Indicator thumb */}
                    <div
                        className={`absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 shadow-md transition-all duration-500 ${
                            isLong ? 'bg-neon-green' : 'bg-neon-red'
                        }`}
                        style={{ left: `${indicatorLeft}%` }}
                    />
                </div>

                {/* Scale */}
                <div className="flex justify-between">
                    <span className="font-mono text-[10px] text-slate-600">
                        -100%
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                        Target: Neutral
                    </span>
                    <span className="font-mono text-[10px] text-slate-600">
                        +100%
                    </span>
                </div>
            </div>

            {/* Status description */}
            <div
                className={`rounded-md px-3 py-2 text-xs ${
                    absPct < 10
                        ? 'bg-slate-800/60 text-slate-300'
                        : isLong
                          ? 'bg-neon-green/10 text-neon-green'
                          : 'bg-neon-red/10 text-neon-red'
                }`}
            >
                {absPct < 10 ? (
                    <span>✓ Near delta neutral</span>
                ) : isLong ? (
                    <span>
                        ▲ Long bias — skewing asks tighter to reduce BTC
                        exposure
                    </span>
                ) : (
                    <span>
                        ▼ Short bias — skewing bids tighter to reduce USDT
                        exposure
                    </span>
                )}
            </div>
        </div>
    );
}
