"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { MOCK_CHART_DATA } from "@/lib/mockData";

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl">
      <p className="mb-1 font-mono text-[11px] text-slate-400">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-mono text-xs" style={{ color: p.color }}>
          {p.name}: {p.value >= 0 ? "+" : ""}
          {p.value.toFixed(2)}%
        </p>
      ))}
    </div>
  );
}

export function StrategyComparisonChart() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="text-sm font-semibold text-slate-200">
          Strategy Comparison
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
            <span className="inline-block h-0.5 w-4 bg-electric-blue" />
            $HODL
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
            <span className="inline-block h-0.5 w-4 bg-neon-green" />
            $MM
          </span>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={MOCK_CHART_DATA}
            margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              interval={11}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v >= 0 ? "+" : ""}${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 2" />
            <Line
              type="monotone"
              dataKey="hodl"
              name="$HODL"
              stroke="#3B82F6"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "#3B82F6" }}
            />
            <Line
              type="monotone"
              dataKey="mm"
              name="$MM"
              stroke="#00E599"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: "#00E599" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
