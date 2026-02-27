'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

import {
    InventoryGauge,
    KillSwitch,
    OrderBookVisualizer,
    PnlPerformanceChart,
    SpreadControls,
} from './feature-bento-widgets';

const cardBaseClassName =
    'bg-[#0F1623] border border-slate-800 rounded-lg p-8 hover:border-[#00E5FF]/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.1)] transition-all duration-300 hover:-translate-y-1 relative group';

const cardBorderGlow = (
    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
);

export function FeatureBentoSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

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
                    Built for Professional Market Makers
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, ease: 'easeInOut', delay: 0.1 }}
                        className={`lg:col-span-2 ${cardBaseClassName}`}
                    >
                        {cardBorderGlow}
                        <h3
                            className="text-xl font-semibold text-white mb-6"
                            style={{ fontFamily: 'Geist, sans-serif' }}
                        >
                            See Your Orders in Context
                        </h3>
                        <OrderBookVisualizer />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, ease: 'easeInOut', delay: 0.2 }}
                        className={cardBaseClassName}
                    >
                        {cardBorderGlow}
                        <h3
                            className="text-xl font-semibold text-white mb-4"
                            style={{ fontFamily: 'Geist, sans-serif' }}
                        >
                            Stay Delta-Neutral
                        </h3>
                        <InventoryGauge />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, ease: 'easeInOut', delay: 0.3 }}
                        className={cardBaseClassName}
                    >
                        {cardBorderGlow}
                        <h3
                            className="text-xl font-semibold text-white mb-4"
                            style={{ fontFamily: 'Geist, sans-serif' }}
                        >
                            Fully Configurable
                        </h3>
                        <SpreadControls />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, ease: 'easeInOut', delay: 0.4 }}
                        className={`lg:col-span-2 ${cardBaseClassName}`}
                    >
                        {cardBorderGlow}
                        <h3
                            className="text-xl font-semibold text-white mb-6"
                            style={{ fontFamily: 'Geist, sans-serif' }}
                        >
                            Outperform HODL Consistently
                        </h3>
                        <PnlPerformanceChart />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, ease: 'easeInOut', delay: 0.5 }}
                        className={cardBaseClassName}
                    >
                        {cardBorderGlow}
                        <h3
                            className="text-xl font-semibold text-white mb-4"
                            style={{ fontFamily: 'Geist, sans-serif' }}
                        >
                            Built-In Risk Controls
                        </h3>
                        <KillSwitch />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
