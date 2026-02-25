'use client';

import { MOCK_ASKS, MOCK_BIDS, MOCK_MID_PRICE } from '@/lib/mockData';

const MAX_TOTAL = Math.max(
    ...MOCK_ASKS.map((a) => a.total),
    ...MOCK_BIDS.map((b) => b.total)
);

function DepthBar({ total, side }: { total: number; side: 'bid' | 'ask' }) {
    const pct = (total / MAX_TOTAL) * 100;
    return (
        <div
            className="absolute inset-y-0 right-0 z-0 opacity-20"
            style={{ width: `${pct}%` }}
        >
            <div
                className={`h-full w-full ${
                    side === 'bid' ? 'bg-neon-green' : 'bg-neon-red'
                }`}
            />
        </div>
    );
}

function OwnOrderFlag({ side }: { side: 'bid' | 'ask' }) {
    return (
        <span
            className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-sm px-1 py-0.5 font-mono text-[9px] font-bold text-slate-950 ${
                side === 'bid'
                    ? '-left-8 bg-electric-blue'
                    : '-right-8 bg-electric-blue'
            }`}
        >
            MY
        </span>
    );
}

export function OrderBookLadder() {
    const spread = MOCK_ASKS[MOCK_ASKS.length - 1].price - MOCK_BIDS[0].price;
    const spreadBps = ((spread / MOCK_MID_PRICE) * 10_000).toFixed(1);

    return (
        <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <span className="text-sm font-semibold text-slate-200">
                    Order Book
                </span>
                <span className="font-mono text-xs text-slate-400">
                    BTC / USDT
                </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-3 border-b border-slate-800 px-4 py-1.5">
                <span className="text-left font-mono text-[11px] text-slate-500">
                    Price (USDT)
                </span>
                <span className="text-center font-mono text-[11px] text-slate-500">
                    Size (BTC)
                </span>
                <span className="text-right font-mono text-[11px] text-slate-500">
                    Total
                </span>
            </div>

            <div className="flex-1 overflow-hidden px-2">
                {/* Asks (reversed so highest ask at top) */}
                <div className="flex flex-col-reverse">
                    {MOCK_ASKS.map((ask) => (
                        <div
                            key={ask.price}
                            className="relative grid grid-cols-3 items-center px-2 py-[3px] hover:bg-slate-800/50"
                        >
                            <DepthBar total={ask.total} side="ask" />
                            {ask.isOwnOrder && <OwnOrderFlag side="ask" />}
                            <span className="relative z-10 font-mono text-xs font-medium text-neon-red">
                                {ask.price.toLocaleString('en-US', {
                                    minimumFractionDigits: 1,
                                })}
                            </span>
                            <span className="relative z-10 text-center font-mono text-xs text-slate-300">
                                {ask.size.toFixed(4)}
                            </span>
                            <span className="relative z-10 text-right font-mono text-xs text-slate-500">
                                {ask.total.toFixed(4)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Mid price + spread zone */}
                <div className="relative my-0.5 flex items-center gap-3 border-y border-slate-700 bg-slate-800/60 px-4 py-2">
                    <div className="absolute inset-x-0 top-0 h-px bg-slate-600" />
                    <span className="font-mono text-base font-bold text-slate-100">
                        $
                        {MOCK_MID_PRICE.toLocaleString('en-US', {
                            minimumFractionDigits: 1,
                        })}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                        Spread:{' '}
                        <span className="text-slate-300">
                            ${spread.toFixed(2)} / {spreadBps} bps
                        </span>
                    </span>
                </div>

                {/* Bids */}
                <div className="flex flex-col">
                    {MOCK_BIDS.map((bid) => (
                        <div
                            key={bid.price}
                            className="relative grid grid-cols-3 items-center px-2 py-[3px] hover:bg-slate-800/50"
                        >
                            <DepthBar total={bid.total} side="bid" />
                            {bid.isOwnOrder && <OwnOrderFlag side="bid" />}
                            <span className="relative z-10 font-mono text-xs font-medium text-neon-green">
                                {bid.price.toLocaleString('en-US', {
                                    minimumFractionDigits: 1,
                                })}
                            </span>
                            <span className="relative z-10 text-center font-mono text-xs text-slate-300">
                                {bid.size.toFixed(4)}
                            </span>
                            <span className="relative z-10 text-right font-mono text-xs text-slate-500">
                                {bid.total.toFixed(4)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
