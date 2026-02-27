import { z } from 'zod';

import { EXCHANGES, PAIRS } from './constants';

export const pairSchema = z.enum(PAIRS);
export const exchangeSchema = z.enum(EXCHANGES);
export const sideSchema = z.enum(['buy', 'sell']);

export const quoteSnapshotSchema = z.object({
  pair: pairSchema,
  bid: z.number().int(),
  ask: z.number().int(),
  mid: z.number().int(),
  spreadBps: z.number(),
  inventorySkew: z.number().int(),
  quoteRefreshRate: z.number(),
  volatility: z.number(),
  paused: z.boolean(),
  updatedAt: z.string(),
});

export const fillSchema = z.object({
  id: z.string(),
  pair: pairSchema,
  side: sideSchema,
  price: z.number().int(),
  size: z.number().int(),
  midAtFill: z.number().int(),
  realizedSpread: z.number().int(),
  adverseSelection: z.boolean(),
  timestamp: z.string(),
});

export const inventorySnapshotSchema = z.object({
  pair: pairSchema,
  inventory: z.number().int(),
  normalizedSkew: z.number(),
  timestamp: z.string(),
});

export const pnlSnapshotSchema = z.object({
  timestamp: z.string(),
  totalPnl: z.number().int(),
  realizedSpread: z.number().int(),
  hedgingCosts: z.number().int(),
  adverseSelectionRate: z.number(),
  fillRate: z.number(),
});

export const exchangeHealthSchema = z.object({
  pair: pairSchema,
  exchange: exchangeSchema,
  tickLatencyMs: z.number(),
  feedStalenessMs: z.number(),
  connected: z.boolean(),
});

export const mmPairConfigSchema = z.object({
  pair: pairSchema,
  baseSpreadBps: z.number().min(1),
  volatilityMultiplier: z.number().min(0),
  maxInventory: z.number().positive(),
  inventorySkewSensitivity: z.number().min(0),
  quoteRefreshIntervalMs: z.number().min(50),
  enabled: z.boolean(),
  hedgingEnabled: z.boolean(),
  hedgeThreshold: z.number().min(0),
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
