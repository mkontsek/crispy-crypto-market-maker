import { GlobalHeader } from '@/components/global-header';
import { OrderBookLadder } from '@/components/order-book-ladder';
import { StrategyControls } from '@/components/strategy-controls';
import { InventorySkewGauge } from '@/components/inventory-skew-gauge';
import { StrategyComparisonChart } from '@/components/strategy-comparison-chart';
import { StrategySelector } from '@/components/strategy-selector';
import { StrategyEditor } from '@/components/strategy-editor';

export default function DashboardPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950">
            <GlobalHeader />

            {/* Main bento grid */}
            <main className="flex flex-1 flex-col gap-4 p-4">
                {/* Top 3-column layout: 30% | 40% | 30% */}
                <div
                    className="grid grid-cols-[3fr_4fr_3fr] gap-4"
                    style={{ minHeight: 'calc(100vh - 14rem)' }}
                >
                    {/* Left column: Inventory Skew + Strategy Comparison */}
                    <div className="flex flex-col gap-4">
                        <InventorySkewGauge />
                        <div className="flex-1">
                            <StrategyComparisonChart />
                        </div>
                    </div>

                    {/* Center column: Order Book Ladder */}
                    <div className="flex flex-col">
                        <OrderBookLadder />
                    </div>

                    {/* Right column: Strategy Controls + Strategy Selector */}
                    <div className="flex flex-col gap-4 overflow-y-auto">
                        <StrategyControls />
                        <StrategySelector />
                    </div>
                </div>

                {/* Bottom row: Custom Strategy Editor */}
                <div>
                    <StrategyEditor />
                </div>
            </main>
        </div>
    );
}
