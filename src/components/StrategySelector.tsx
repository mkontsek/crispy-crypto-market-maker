"use client";

import { useBotStore } from "@/stores/botStore";
import { STRATEGY_DESCRIPTIONS, type StrategyType } from "@/lib/mockData";

const STRATEGIES: { id: StrategyType; label: string; tag: string }[] = [
  {
    id: "pure-market-making",
    label: "Pure Market Making",
    tag: "PMM",
  },
  {
    id: "avellaneda-stoikov",
    label: "Avellaneda-Stoikov",
    tag: "A-S",
  },
  {
    id: "cross-exchange-arb",
    label: "Cross-Exchange Arb",
    tag: "ARB",
  },
];

export function StrategySelector() {
  const { selectedStrategy, setSelectedStrategy } = useBotStore();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="text-sm font-semibold text-slate-200">Strategy</span>
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
          Selector
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {STRATEGIES.map((s) => {
          const isSelected = selectedStrategy === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedStrategy(s.id)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                isSelected
                  ? "border-electric-blue/50 bg-electric-blue/10"
                  : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
              }`}
            >
              <span
                className={`flex h-7 w-9 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold ${
                  isSelected
                    ? "bg-electric-blue text-slate-950"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {s.tag}
              </span>
              <span
                className={`text-xs font-medium ${
                  isSelected ? "text-slate-100" : "text-slate-300"
                }`}
              >
                {s.label}
              </span>
              {isSelected && (
                <span className="ml-auto text-electric-blue">●</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Description */}
      <div className="rounded-lg bg-slate-800/60 p-3">
        <p className="text-xs leading-relaxed text-slate-400">
          {STRATEGY_DESCRIPTIONS[selectedStrategy]}
        </p>
      </div>
    </div>
  );
}
