import { HeroSection } from './components/hero-section';
import { HowItWorksSection } from './components/how-it-works-section';
import { FeatureBentoSection } from './components/feature-bento-section';
import { ExchangesSection } from './components/exchanges-section';
import { StatsSection } from './components/stats-section';
import { PricingSection } from './components/pricing-section';
import { Footer } from './components/footer';

export default function App() {
    return (
        <div
            className="min-h-screen bg-[#080C14]"
            style={{ fontFamily: 'Geist, sans-serif' }}
        >
            <HeroSection />
            <HowItWorksSection />
            <FeatureBentoSection />
            <ExchangesSection />
            <StatsSection />
            <PricingSection />
            <Footer />
        </div>
    );
}
