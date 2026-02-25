'use client';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const plans = [
    {
        name: 'Starter',
        price: 'Free',
        period: '',
        features: [
            { label: '1 Trading Pair', included: true },
            { label: '1 Exchange', included: true },
            { label: 'Basic Strategies', included: true },
            { label: 'Community Support', included: true },
            { label: 'Advanced Strategies', included: false },
        ],
        cta: 'Get Started',
        recommended: false,
    },
    {
        name: 'Pro',
        price: '$79',
        period: '/mo',
        features: [
            { label: '10 Trading Pairs', included: true },
            { label: 'All Exchanges', included: true },
            { label: 'Advanced Strategies', included: true },
            { label: 'Auto-Hedge', included: true },
            { label: 'Priority Support', included: true },
        ],
        cta: 'Start Free Trial',
        recommended: true,
    },
    {
        name: 'Institutional',
        price: 'Custom',
        period: '',
        features: [
            { label: 'Unlimited Pairs', included: true },
            { label: 'All Exchanges', included: true },
            { label: 'Custom Strategies', included: true },
            { label: 'White-Glove Onboarding', included: true },
            { label: 'Dedicated Support', included: true },
        ],
        cta: 'Contact Sales',
        recommended: false,
    },
];

export function PricingSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <section ref={ref} className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="text-4xl md:text-5xl font-bold text-white text-center mb-4"
                    style={{ fontFamily: 'Geist, sans-serif' }}
                >
                    Simple, Transparent Pricing
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                        duration: 0.4,
                        ease: 'easeInOut',
                        delay: 0.1,
                    }}
                    className="text-slate-400 text-center mb-16 max-w-2xl mx-auto"
                    style={{ fontFamily: 'Geist, sans-serif' }}
                >
                    Choose the plan that fits your trading volume. All plans
                    include encryption, WebSocket feeds, and real-time
                    monitoring.
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{
                                duration: 0.4,
                                ease: 'easeInOut',
                                delay: 0.1 + index * 0.1,
                            }}
                            className={`relative bg-[#0F1623] border rounded-lg p-8 transition-all duration-300 hover:-translate-y-1 ${
                                plan.recommended
                                    ? 'border-[#00E5FF] shadow-[0_0_40px_rgba(0,229,255,0.15)]'
                                    : 'border-slate-800 hover:border-[#00E5FF]/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.1)]'
                            }`}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <div className="bg-[#00E5FF] text-[#080C14] px-4 py-1 rounded-full text-sm font-semibold">
                                        Recommended
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3
                                    className="text-2xl font-bold text-white mb-2"
                                    style={{ fontFamily: 'Geist, sans-serif' }}
                                >
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span
                                        className="text-5xl font-bold text-white"
                                        style={{
                                            fontFamily: 'Geist Mono, monospace',
                                        }}
                                    >
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span
                                            className="text-slate-400"
                                            style={{
                                                fontFamily: 'Geist, sans-serif',
                                            }}
                                        >
                                            {plan.period}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button
                                className={`w-full mb-8 ${
                                    plan.recommended
                                        ? 'bg-[#00E5FF] text-[#080C14] hover:bg-[#00E5FF]/90'
                                        : 'bg-slate-800 text-white hover:bg-slate-700'
                                }`}
                                size="lg"
                                style={{ fontFamily: 'Geist, sans-serif' }}
                            >
                                {plan.cta}
                            </Button>

                            <ul className="space-y-4">
                                {plan.features.map((feature, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-3"
                                    >
                                        <Check
                                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                                feature.included
                                                    ? 'text-[#00E599]'
                                                    : 'text-slate-600'
                                            }`}
                                        />
                                        <span
                                            className={`${feature.included ? 'text-slate-300' : 'text-slate-600'}`}
                                            style={{
                                                fontFamily: 'Geist, sans-serif',
                                            }}
                                        >
                                            {feature.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
