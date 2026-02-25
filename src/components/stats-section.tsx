'use client';
import { motion, useInView } from 'motion/react';
import { useRef, useEffect, useState } from 'react';

function AnimatedStat({
    value,
    suffix = '',
    prefix = '',
}: {
    value: string;
    suffix?: string;
    prefix?: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isInView) {
            setTimeout(() => setVisible(true), 100);
        }
    }, [isInView]);

    return (
        <span
            ref={ref}
            className={`transition-all duration-500 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
            {prefix}
            {value}
            {suffix}
        </span>
    );
}

const stats = [
    { label: 'Liquidity Quoted', value: '1.2B', prefix: '$', suffix: '+' },
    { label: 'Average Spread Captured', value: '0.07', suffix: '%' },
    { label: 'Uptime (WebSocket)', value: '99.9', suffix: '%' },
    {
        label: 'Order Placement Latency',
        value: '5',
        prefix: '< ',
        suffix: 'ms',
    },
];

export function StatsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    return (
        <section ref={ref} className="py-16 px-6 bg-[#0A0F1A]">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{
                                duration: 0.4,
                                ease: 'easeInOut',
                                delay: index * 0.1,
                            }}
                            className="text-center"
                        >
                            <div
                                className="text-4xl md:text-5xl font-bold text-[#00E5FF] mb-2"
                                style={{ fontFamily: 'Geist Mono, monospace' }}
                            >
                                <AnimatedStat
                                    value={stat.value}
                                    prefix={stat.prefix}
                                    suffix={stat.suffix}
                                />
                            </div>
                            <div
                                className="text-sm text-slate-400"
                                style={{ fontFamily: 'Geist, sans-serif' }}
                            >
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
