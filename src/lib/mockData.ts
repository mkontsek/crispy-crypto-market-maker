export type OrderLevel = {
  price: number;
  size: number;
  total: number;
  isOwnOrder?: boolean;
};

export type StrategyType =
  | "pure-market-making"
  | "avellaneda-stoikov"
  | "cross-exchange-arb";

export type ChartDataPoint = {
  time: string;
  hodl: number;
  mm: number;
};

export const MOCK_MID_PRICE = 43_250.5;

export const MOCK_ASKS: OrderLevel[] = [
  { price: 43_270.0, size: 0.42, total: 0.42 },
  { price: 43_265.5, size: 0.85, total: 1.27 },
  { price: 43_262.0, size: 1.23, total: 2.5 },
  { price: 43_258.5, size: 0.67, total: 3.17 },
  { price: 43_256.0, size: 2.1, total: 5.27 },
  { price: 43_254.5, size: 0.33, total: 5.6 },
  { price: 43_253.0, size: 1.78, total: 7.38, isOwnOrder: true },
  { price: 43_252.0, size: 0.91, total: 8.29 },
  { price: 43_251.5, size: 0.55, total: 8.84 },
  { price: 43_251.0, size: 0.22, total: 9.06 },
];

export const MOCK_BIDS: OrderLevel[] = [
  { price: 43_250.0, size: 0.31, total: 0.31 },
  { price: 43_249.5, size: 0.74, total: 1.05 },
  { price: 43_248.0, size: 1.56, total: 2.61, isOwnOrder: true },
  { price: 43_246.5, size: 0.88, total: 3.49 },
  { price: 43_245.0, size: 2.34, total: 5.83 },
  { price: 43_243.5, size: 0.6, total: 6.43 },
  { price: 43_241.0, size: 1.12, total: 7.55 },
  { price: 43_238.5, size: 0.45, total: 8.0 },
  { price: 43_235.0, size: 1.89, total: 9.89 },
  { price: 43_230.0, size: 0.77, total: 10.66 },
];

export const MOCK_CHART_DATA: ChartDataPoint[] = Array.from(
  { length: 60 },
  (_, i) => {
    const t = i / 59;
    const noise = () => (Math.random() - 0.5) * 2;
    const hodl = -5 + Math.sin(t * Math.PI * 2) * 8 + t * 3 + noise();
    const mm = t * 14 + Math.sin(t * Math.PI * 4) * 1.5 + noise() * 0.3;
    const date = new Date(Date.now() - (59 - i) * 60_000);
    return {
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      hodl: parseFloat(hodl.toFixed(2)),
      mm: parseFloat(mm.toFixed(2)),
    };
  }
);

export const STRATEGY_DESCRIPTIONS: Record<StrategyType, string> = {
  "pure-market-making":
    "Places passive limit orders on both sides of the order book at a fixed spread. Profits from the bid-ask spread without taking directional risk. Best for stable, liquid markets.",
  "avellaneda-stoikov":
    "Academic model that dynamically adjusts quotes based on inventory risk and market volatility (σ). Uses a risk-aversion parameter (γ) to skew quotes and manage inventory exposure.",
  "cross-exchange-arb":
    "Simultaneously places maker orders on one exchange and hedges fills with taker orders on another. Captures spread while maintaining delta-neutral inventory across venues.",
};

export const EXAMPLE_STRATEGY_CODE = `// Inventory-Skew Adjusted Spread Strategy
// Dynamically widens/tightens spread based on inventory imbalance

interface StrategyParams {
  baseSpread: number;       // minimum spread in bps
  maxSkew: number;          // max spread adjustment from inventory (bps)
  targetInventory: number;  // ideal inventory ratio [0..1]
}

function computeQuotes(
  midPrice: number,
  inventory: number,
  totalEquity: number,
  params: StrategyParams
): { bidPrice: number; askPrice: number } {
  const inventoryRatio = inventory / totalEquity;
  const skew = (inventoryRatio - params.targetInventory) * params.maxSkew;

  const adjustedBidSpread = params.baseSpread + skew;
  const adjustedAskSpread = params.baseSpread - skew;

  const bidPrice = midPrice * (1 - adjustedBidSpread / 10_000);
  const askPrice = midPrice * (1 + adjustedAskSpread / 10_000);

  return { bidPrice, askPrice };
}

// Example usage:
const quotes = computeQuotes(43_250, 0.65, 1.0, {
  baseSpread: 10,   // 10 bps
  maxSkew: 5,       // up to 5 bps skew
  targetInventory: 0.5,
});

console.log("Bid:", quotes.bidPrice.toFixed(2));
console.log("Ask:", quotes.askPrice.toFixed(2));
`;
