import { GlobalHeader } from "@/components/GlobalHeader";
import { OrderBookLadder } from "@/components/OrderBookLadder";
import { StrategyControls } from "@/components/StrategyControls";
import { InventorySkewGauge } from "@/components/InventorySkewGauge";
import { StrategyComparisonChart } from "@/components/StrategyComparisonChart";
import { StrategySelector } from "@/components/StrategySelector";
import { StrategyEditor } from "@/components/StrategyEditor";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <GlobalHeader />

      {/* Main bento grid */}
      <main className="flex flex-1 flex-col gap-4 p-4">
        {/* Top 3-column layout: 30% | 40% | 30% */}
        <div className="dashboard-grid gap-4">
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
