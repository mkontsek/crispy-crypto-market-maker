'use client';
import { motion, useInView } from 'motion/react';
import { Plug, Sliders, Zap } from 'lucide-react';
import { useRef } from 'react';

const steps = [
    {
        number: '01',
        icon: Plug,
        label: 'Connect Exchange',
        description:
            'Link your API keys. Binance, Kraken, OKX, Bybit. Keys are encrypted at rest.',
    },
    {
        number: '02',
        icon: Sliders,
        label: 'Configure Strategy',
        description:
            'Set spread %, order size, refresh rate, and inventory skew targets.',
    },
    {
        number: '03',
        icon: Zap,
        label: 'Deploy & Collect',
        description:
            'Bot goes live. Captures spread 24/7 while you monitor PnL in real time.',
    },
];

export function HowItWorksSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    return (
        <section ref={ref} className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="text-4xl md:text-5xl font-bold text-white text-center mb-16"
                    style={{ fontFamily: 'Geist, sans-serif' }}
                >
                    How It Works
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{
                                duration: 0.4,
                                ease: 'easeInOut',
                                delay: index * 0.1,
                            }}
                            className="relative group"
                        >
                            <div className="bg-[#0F1623] border border-slate-800 rounded-lg p-8 transition-all duration-300 hover:border-[#00E5FF]/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.1)] hover:-translate-y-1">
                                {/* Top glow border */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="flex items-start gap-4 mb-6">
                                    <div className="text-[#00E5FF]/30 text-2xl font-mono font-bold">
                                        {step.number}
                                    </div>
                                    <div className="p-3 bg-[#00E5FF]/10 rounded-lg text-[#00E5FF]">
                                        <step.icon className="w-6 h-6" />
                                    </div>
                                </div>

                                <h3
                                    className="text-xl font-semibold text-white mb-3"
                                    style={{ fontFamily: 'Geist, sans-serif' }}
                                >
                                    {step.label}
                                </h3>
                                <p
                                    className="text-slate-400 leading-relaxed"
                                    style={{ fontFamily: 'Geist, sans-serif' }}
                                >
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
