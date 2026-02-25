'use client';
import { motion, useInView } from 'motion/react';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function AnimatedOrderBook() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        let animationFrame: number;
        let time = 0;

        const animate = () => {
            time += 0.005;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw bid orders (green, left side)
            const bidCount = 30;
            for (let i = 0; i < bidCount; i++) {
                const y = (i / bidCount) * canvas.height;
                const width = Math.sin(time + i * 0.2) * 50 + 100 + i * 8;
                const opacity = 0.05 + Math.sin(time + i * 0.1) * 0.03;
                ctx.fillStyle = `rgba(0, 229, 153, ${opacity})`;
                ctx.fillRect(0, y, width, canvas.height / bidCount - 1);
            }

            // Draw ask orders (red, right side)
            const askCount = 30;
            for (let i = 0; i < askCount; i++) {
                const y = (i / askCount) * canvas.height;
                const width = Math.sin(time + i * 0.2) * 50 + 100 + i * 8;
                const opacity = 0.05 + Math.sin(time + i * 0.1) * 0.03;
                ctx.fillStyle = `rgba(255, 77, 77, ${opacity})`;
                ctx.fillRect(
                    canvas.width - width,
                    y,
                    width,
                    canvas.height / askCount - 1
                );
            }

            animationFrame = requestAnimationFrame(animate);
        };

        animate();

        return () => cancelAnimationFrame(animationFrame);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.8 }}
        />
    );
}

function CountUpNumber({
    value,
    suffix = '',
}: {
    value: number;
    suffix?: string;
}) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;

        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [isInView, value]);

    return (
        <span ref={ref}>
            {count.toLocaleString()}
            {suffix}
        </span>
    );
}

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Animated Background */}
            <AnimatedOrderBook />

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
                    style={{ fontFamily: 'Geist, sans-serif' }}
                >
                    Market Making.
                    <br />
                    Crispy Sharp.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.5,
                        ease: 'easeInOut',
                        delay: 0.1,
                    }}
                    className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto"
                    style={{ fontFamily: 'Geist, sans-serif' }}
                >
                    Deploy liquidity strategies on any CEX. Capture the spread.
                    Stay delta-neutral.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.5,
                        ease: 'easeInOut',
                        delay: 0.2,
                    }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                >
                    <Link href="/dashboard">
                        <Button
                            size="lg"
                            className="bg-[#00E5FF] text-[#080C14] hover:bg-[#00E5FF]/90 font-medium px-8 py-6 text-lg relative overflow-hidden group cursor-pointer"
                            style={{ fontFamily: 'Geist, sans-serif' }}
                        >
                            <span className="relative z-10">
                                Start Making Markets
                            </span>
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        </Button>
                    </Link>
                    <Button
                        size="lg"
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:border-[#00E5FF]/30 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all duration-300 px-8 py-6 text-lg"
                        style={{ fontFamily: 'Geist, sans-serif' }}
                    >
                        View Docs
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 0.5,
                        ease: 'easeInOut',
                        delay: 0.3,
                    }}
                    className="flex flex-col sm:flex-row gap-6 sm:gap-12 justify-center items-center text-sm font-mono"
                    style={{ fontFamily: 'Geist Mono, monospace' }}
                >
                    <div className="text-slate-400">
                        24h Volume Quoted:{' '}
                        <span className="text-[#00E5FF]">
                            $<CountUpNumber value={4821300} />
                        </span>
                    </div>
                    <div className="hidden sm:block text-slate-700">|</div>
                    <div className="text-slate-400">
                        Active Pairs:{' '}
                        <span className="text-[#00E5FF]">
                            <CountUpNumber value={12} />
                        </span>
                    </div>
                    <div className="hidden sm:block text-slate-700">|</div>
                    <div className="text-slate-400">
                        Avg Spread:{' '}
                        <span className="text-[#00E5FF]">
                            <CountUpNumber value={0} suffix=".08%" />
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
