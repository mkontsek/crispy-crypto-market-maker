import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { StrategyType } from "@/lib/mockData";

type TradingMode = "simulation" | "live";
type EditorStatus = "idle" | "running" | "stopped";

type BotState = {
  mode: TradingMode;
  minSpread: number;
  orderSize: number;
  orderSizeMode: "fixed" | "percent";
  rebalanceThreshold: number;
  selectedStrategy: StrategyType;
  editorStatus: EditorStatus;
  inventorySkew: number;
  pnl24h: number;
  pnlPercent24h: number;
  inventory: number;
  wsLatency: number;
  wsConnected: boolean;
};

type BotActions = {
  setMode: (mode: TradingMode) => void;
  setMinSpread: (value: number) => void;
  setOrderSize: (value: number) => void;
  setOrderSizeMode: (mode: "fixed" | "percent") => void;
  setRebalanceThreshold: (value: number) => void;
  setSelectedStrategy: (strategy: StrategyType) => void;
  setEditorStatus: (status: EditorStatus) => void;
  cancelAllAndFlatten: () => void;
};

export const useBotStore = create<BotState & BotActions>()(
  immer((set) => ({
    mode: "simulation",
    minSpread: 0.1,
    orderSize: 1000,
    orderSizeMode: "fixed",
    rebalanceThreshold: 5,
    selectedStrategy: "pure-market-making",
    editorStatus: "idle",
    inventorySkew: 18,
    pnl24h: 12_450.22,
    pnlPercent24h: 1.4,
    inventory: 1_240_500.2,
    wsLatency: 14,
    wsConnected: true,

    setMode: (mode) =>
      set((state) => {
        state.mode = mode;
      }),
    setMinSpread: (value) =>
      set((state) => {
        state.minSpread = value;
      }),
    setOrderSize: (value) =>
      set((state) => {
        state.orderSize = value;
      }),
    setOrderSizeMode: (mode) =>
      set((state) => {
        state.orderSizeMode = mode;
      }),
    setRebalanceThreshold: (value) =>
      set((state) => {
        state.rebalanceThreshold = value;
      }),
    setSelectedStrategy: (strategy) =>
      set((state) => {
        state.selectedStrategy = strategy;
      }),
    setEditorStatus: (status) =>
      set((state) => {
        state.editorStatus = status;
      }),
    cancelAllAndFlatten: () =>
      set((state) => {
        state.inventorySkew = 0;
        state.editorStatus = "stopped";
      }),
  }))
);
