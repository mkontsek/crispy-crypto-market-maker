'use client';

import { AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const pnlData = [
    { time: '0h', mm: 100, hold: 100 },
    { time: '4h', mm: 100.8, hold: 100.2 },
    { time: '8h', mm: 101.5, hold: 99.8 },
    { time: '12h', mm: 102.3, hold: 100.5 },
    { time: '16h', mm: 103.1, hold: 99.2 },
    { time: '20h', mm: 104.2, hold: 100.8 },
    { time: '24h', mm: 105.5, hold: 101.2 },
];

const bids = [
    { price: 42150.5, size: 2.5, total: 2.5 },
    { price: 42150.0, size: 1.8, total: 4.3 },
    { price: 42149.5, size: 3.2, total: 7.5 },
    { price: 42149.0, size: 1.5, total: 9.0 },
    { price: 42148.5, size: 2.1, total: 11.1 },
];

const asks = [
    { price: 42151.0, size: 1.9, total: 1.9 },
    { price: 42151.5, size: 2.3, total: 4.2 },
    { price: 42152.0, size: 1.6, total: 5.8 },
    { price: 42152.5, size: 2.8, total: 8.6 },
    { price: 42153.0, size: 1.4, total: 10.0 },
];

export function OrderBookVisualizer() {
    return (
        <div className="space-y-2 font-mono text-sm">
            {[...asks].reverse().map((ask, i) => (
                <div key={i} className="flex justify-between items-center">
                    <span className="text-[#FF4D4D] w-24">{ask.price.toFixed(1)}</span>
                    <div className="flex-1 relative h-6 mx-4">
                        <div
                            className="absolute right-0 h-full bg-[#FF4D4D]/20 transition-all duration-500"
                            style={{ width: `${(ask.total / 10) * 100}%` }}
                        />
                    </div>
                    <span className="text-slate-400 w-16 text-right">{ask.size.toFixed(1)}</span>
                </div>
            ))}

            <div className="flex justify-center py-2">
                <div className="px-4 py-1 bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded text-[#00E5FF] text-xs">
                    Your orders ↔ Spread: $0.50 (0.001%)
                </div>
            </div>

            {bids.map((bid, i) => (
                <div key={i} className="flex justify-between items-center">
                    <span className="text-[#00E599] w-24">{bid.price.toFixed(1)}</span>
                    <div className="flex-1 relative h-6 mx-4">
                        <div
                            className="absolute left-0 h-full bg-[#00E599]/20 transition-all duration-500"
                            style={{ width: `${(bid.total / 11) * 100}%` }}
                        />
                    </div>
                    <span className="text-slate-400 w-16 text-right">{bid.size.toFixed(1)}</span>
                </div>
            ))}
        </div>
    );
}

export function InventoryGauge() {
    const [rotation, setRotation] = useState(-90);

    useEffect(() => {
        const timer = setTimeout(() => setRotation(0), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full py-8">
            <svg width="200" height="120" viewBox="0 0 200 120">
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="rgb(30, 41, 59)"
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                <path
                    d="M 20 100 A 80 80 0 0 1 100 20"
                    fill="none"
                    stroke="rgb(0, 229, 153)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    opacity="0.5"
                />
                <path
                    d="M 100 20 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="rgb(255, 77, 77)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    opacity="0.5"
                />
                <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="30"
                    stroke="rgb(0, 229, 255)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{
                        transformOrigin: '100px 100px',
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 1s ease-out',
                    }}
                />
                <circle cx="100" cy="100" r="6" fill="rgb(0, 229, 255)" />
            </svg>
            <div className="mt-4 text-center font-mono">
                <div className="text-2xl text-white font-bold">50 / 50</div>
                <div className="text-xs text-slate-400 mt-1">BTC / USD</div>
            </div>
        </div>
    );
}

export function SpreadControls() {
    const [spread, setSpread] = useState([0.08]);
    const [orderSize, setOrderSize] = useState([1000]);

    return (
        <div className="space-y-8 py-6">
            <div>
                <div className="flex justify-between mb-3">
                    <label className="text-sm text-slate-400 font-medium">Min Spread</label>
                    <span className="text-[#00E5FF] font-mono text-sm">{spread[0]}%</span>
                </div>
                <Slider
                    value={spread}
                    onValueChange={setSpread}
                    min={0.01}
                    max={1}
                    step={0.01}
                    className="[&_[role=slider]]:bg-[#00E5FF] [&_[role=slider]]:border-[#00E5FF]"
                />
            </div>
            <div>
                <div className="flex justify-between mb-3">
                    <label className="text-sm text-slate-400 font-medium">Order Size</label>
                    <span className="text-[#00E5FF] font-mono text-sm">${orderSize[0]}</span>
                </div>
                <Slider
                    value={orderSize}
                    onValueChange={setOrderSize}
                    min={100}
                    max={10000}
                    step={100}
                    className="[&_[role=slider]]:bg-[#00E5FF] [&_[role=slider]]:border-[#00E5FF]"
                />
            </div>
        </div>
    );
}

export function PnlPerformanceChart() {
    return (
        <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={pnlData}>
                <defs>
                    <linearGradient id="colorMm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="time"
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                />
                <YAxis
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#0F1623',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontFamily: 'Geist Mono, monospace',
                    }}
                    labelStyle={{ color: '#64748b' }}
                    itemStyle={{ color: '#00E5FF' }}
                />
                <Area
                    type="monotone"
                    dataKey="hold"
                    stroke="#64748b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorHold)"
                    name="HODL"
                />
                <Area
                    type="monotone"
                    dataKey="mm"
                    stroke="#00E5FF"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorMm)"
                    name="MM Strategy"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function KillSwitch() {
    const [armed, setArmed] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="relative">
                <Button
                    size="lg"
                    variant="destructive"
                    className="bg-[#FF4D4D] hover:bg-[#FF4D4D]/80 text-white font-bold px-12 py-6 text-lg rounded-lg shadow-[0_0_30px_rgba(255,77,77,0.3)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(255,77,77,0.5)]"
                    onMouseEnter={() => setArmed(true)}
                    onMouseLeave={() => setArmed(false)}
                >
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    CANCEL ALL
                </Button>
                {armed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#FF4D4D] text-white px-3 py-1 rounded text-xs font-mono"
                    >
                        Emergency stop armed
                    </motion.div>
                )}
            </div>
            <p className="text-slate-500 text-xs text-center font-mono">
                Instantly cancels all open orders
                <br />
                across all connected exchanges
            </p>
        </div>
    );
}
