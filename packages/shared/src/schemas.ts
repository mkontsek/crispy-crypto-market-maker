import { z } from 'zod';

import { EXCHANGES, PAIRS } from './constants';

export const pairSchema = z.enum(PAIRS);
export const exchangeSchema = z.enum(EXCHANGES);
export const sideSchema = z.enum(['buy', 'sell']);
export const decimalStringSchema = z
  .string()
  .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/, 'Expected decimal string')
  .refine((value) => Number.isFinite(Number(value)), 'Expected finite decimal string');

function decimalMinSchema(min: number) {
  return decimalStringSchema.refine((value) => Number(value) >= min, {
    message: `Expected decimal >= ${min}`,
  });
}

const decimalNonNegativeSchema = decimalMinSchema(0);
const decimalPositiveSchema = decimalStringSchema.refine((value) => Number(value) > 0, {
  message: 'Expected decimal > 0',
});

export const quoteSnapshotSchema = z.object({
  pair: pairSchema,
  bid: decimalStringSchema,
  ask: decimalStringSchema,
  mid: decimalStringSchema,
  spreadBps: decimalStringSchema,
  inventorySkew: decimalStringSchema,
  quoteRefreshRate: decimalStringSchema,
  volatility: decimalStringSchema,
  paused: z.boolean(),
  updatedAt: z.string(),
});

export const fillSchema = z.object({
  id: z.string(),
  pair: pairSchema,
  side: sideSchema,
  price: decimalStringSchema,
  size: decimalStringSchema,
  midAtFill: decimalStringSchema,
  realizedSpread: decimalStringSchema,
  adverseSelection: z.boolean(),
  timestamp: z.string(),
});

export const inventorySnapshotSchema = z.object({
  pair: pairSchema,
  inventory: decimalStringSchema,
  normalizedSkew: decimalStringSchema,
  timestamp: z.string(),
});

export const pnlSnapshotSchema = z.object({
  timestamp: z.string(),
  totalPnl: decimalStringSchema,
  realizedSpread: decimalStringSchema,
  hedgingCosts: decimalStringSchema,
  adverseSelectionRate: decimalStringSchema,
  fillRate: decimalStringSchema,
});

export const exchangeHealthSchema = z.object({
  pair: pairSchema,
  exchange: exchangeSchema,
  tickLatencyMs: decimalStringSchema,
  feedStalenessMs: decimalStringSchema,
  connected: z.boolean(),
});

export const mmPairConfigSchema = z.object({
  pair: pairSchema,
  baseSpreadBps: decimalMinSchema(1),
  volatilityMultiplier: decimalNonNegativeSchema,
  maxInventory: decimalPositiveSchema,
  inventorySkewSensitivity: decimalNonNegativeSchema,
  quoteRefreshIntervalMs: z.number().min(50),
  enabled: z.boolean(),
  hedgingEnabled: z.boolean(),
  hedgeThreshold: decimalNonNegativeSchema,
  hedgeExchange: exchangeSchema,
});

export const mmConfigSchema = z.object({
  pairs: z.array(mmPairConfigSchema),
});

export const engineStreamSchema = z.object({
  timestamp: z.string(),
  quotes: z.array(quoteSnapshotSchema),
  fills: z.array(fillSchema),
  inventory: z.array(inventorySnapshotSchema),
  pnl: pnlSnapshotSchema,
  exchangeHealth: z.array(exchangeHealthSchema),
  config: mmConfigSchema,
});

export const pausePairRequestSchema = z.object({
  paused: z.boolean(),
});

export const hedgeRequestSchema = z.object({
  pair: pairSchema,
  targetExchange: exchangeSchema.optional(),
});
