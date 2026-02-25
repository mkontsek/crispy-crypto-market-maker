'use client';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

const exchanges = [
    { name: 'Binance', color: '#F3BA2F' },
    { name: 'Coinbase', color: '#0052FF' },
    { name: 'Kraken', color: '#5741D9' },
    { name: 'OKX', color: '#000000' },
    { name: 'Bybit', color: '#F7A600' },
    { name: 'Bitfinex', color: '#16B157' },
];

export function ExchangesSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    return (
        <section
            ref={ref}
            className="py-16 px-6 border-t border-b border-slate-800"
        >
            <div className="max-w-7xl mx-auto">
                <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="text-center text-slate-400 text-sm font-medium mb-8 tracking-wider uppercase"
                    style={{ fontFamily: 'Geist, sans-serif' }}
                >
                    Supported Exchanges
                </motion.h3>

                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16">
                    {exchanges.map((exchange, index) => (
                        <motion.div
                            key={exchange.name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{
                                duration: 0.3,
                                ease: 'easeInOut',
                                delay: index * 0.1,
                            }}
                            className="group cursor-pointer"
                        >
                            <div
                                className="text-2xl font-bold transition-all duration-300 filter grayscale group-hover:grayscale-0"
                                style={{
                                    fontFamily: 'Geist, sans-serif',
                                    color: '#64748b',
                                }}
                            >
                                <span
                                    className="group-hover:text-opacity-100 transition-colors duration-300"
                                    style={{
                                        color: exchange.color,
                                        opacity: 0.5,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '0.5';
                                    }}
                                >
                                    {exchange.name}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
