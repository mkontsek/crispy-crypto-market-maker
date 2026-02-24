"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useBotStore } from "@/stores/botStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle } from "lucide-react";

const KILL_CONFIRM_TIMEOUT_MS = 3_000;

export function StrategyControls() {
  const {
    minSpread,
    setMinSpread,
    orderSize,
    setOrderSize,
    orderSizeMode,
    setOrderSizeMode,
    rebalanceThreshold,
    setRebalanceThreshold,
    cancelAllAndFlatten,
  } = useBotStore();

  const [killConfirm, setKillConfirm] = useState(false);
  const killTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (killTimerRef.current) clearTimeout(killTimerRef.current);
    };
  }, []);

  function handleKillClick() {
    if (killConfirm) {
      if (killTimerRef.current) clearTimeout(killTimerRef.current);
      cancelAllAndFlatten();
      setKillConfirm(false);
    } else {
      setKillConfirm(true);
      killTimerRef.current = setTimeout(() => setKillConfirm(false), KILL_CONFIRM_TIMEOUT_MS);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="text-sm font-semibold text-slate-200">
          Strategy &amp; Risk
        </span>
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
          Controls
        </span>
      </div>

      {/* Min Spread */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-slate-400">Min Spread</Label>
          <span className="font-mono text-xs text-electric-blue">
            {minSpread.toFixed(2)}%
          </span>
        </div>
        <Slider
          min={0.01}
          max={2.0}
          step={0.01}
          value={[minSpread]}
          onValueChange={([v]) => setMinSpread(v)}
          className="[&_[data-slot=slider-range]]:bg-electric-blue [&_[data-slot=slider-thumb]]:border-electric-blue"
        />
        <div className="flex justify-between">
          <span className="font-mono text-[10px] text-slate-600">0.01%</span>
          <span className="font-mono text-[10px] text-slate-600">2.00%</span>
        </div>
      </div>

      {/* Order Size */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-slate-400">Order Size</Label>
        <div className="flex gap-2">
          <div className="flex rounded-md border border-slate-700 text-xs overflow-hidden">
            <button
              className={`px-3 py-1.5 font-mono transition-colors ${
                orderSizeMode === "fixed"
                  ? "bg-electric-blue/20 text-electric-blue"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
              onClick={() => setOrderSizeMode("fixed")}
            >
              Fixed
            </button>
            <button
              className={`px-3 py-1.5 font-mono transition-colors ${
                orderSizeMode === "percent"
                  ? "bg-electric-blue/20 text-electric-blue"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
              onClick={() => setOrderSizeMode("percent")}
            >
              % Equity
            </button>
          </div>
          <Input
            type="number"
            value={orderSize}
            onChange={(e) => setOrderSize(Number(e.target.value))}
            className="h-8 border-slate-700 bg-slate-950 font-mono text-xs text-slate-200"
          />
        </div>
      </div>

      {/* Rebalance Threshold */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-slate-400">Rebalance Threshold</Label>
          <span className="font-mono text-xs text-slate-300">
            {rebalanceThreshold}%
          </span>
        </div>
        <Input
          type="number"
          min={1}
          max={50}
          step={0.5}
          value={rebalanceThreshold}
          onChange={(e) => setRebalanceThreshold(Number(e.target.value))}
          className="h-8 border-slate-700 bg-slate-950 font-mono text-xs text-slate-200"
        />
      </div>

      {/* Kill Switch */}
      <div className="mt-2 flex flex-col gap-2 rounded-lg border border-neon-red/20 bg-neon-red/5 p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-neon-red" />
          <span className="text-xs font-semibold text-neon-red">Kill Switch</span>
        </div>
        <Button
          className={`w-full font-mono text-xs font-bold tracking-widest transition-all ${
            killConfirm
              ? "animate-pulse border-neon-red bg-neon-red text-slate-950 hover:bg-neon-red/90"
              : "border-neon-red/50 bg-neon-red/10 text-neon-red hover:bg-neon-red/20"
          }`}
          variant="outline"
          onClick={handleKillClick}
        >
          {killConfirm ? "⚠ CONFIRM: CANCEL ALL & FLATTEN" : "CANCEL ALL & FLATTEN"}
        </Button>
        {killConfirm && (
          <p className="text-center font-mono text-[10px] text-neon-red/70">
            Click again within 3s to confirm
          </p>
        )}
      </div>
    </div>
  );
}
