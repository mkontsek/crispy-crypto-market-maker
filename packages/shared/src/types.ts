import type { z } from 'zod';

import {
  botIdSchema,
  engineStreamSchema,
  exchangeTopologySchema,
  exchangeHealthSchema,
  fillSchema,
  geoLocationSchema,
  hedgeRequestSchema,
  inventorySnapshotSchema,
  killSwitchRequestSchema,
  mmConfigSchema,
  mmPairConfigSchema,
  pausePairRequestSchema,
  pnlSnapshotSchema,
  quoteSnapshotSchema,
  runtimeTopologySchema,
  topologyBotSchema,
} from './schemas';

export type BotId = z.infer<typeof botIdSchema>;
export type QuoteSnapshot = z.infer<typeof quoteSnapshotSchema>;
export type Fill = z.infer<typeof fillSchema>;
export type InventorySnapshot = z.infer<typeof inventorySnapshotSchema>;
export type PnLSnapshot = z.infer<typeof pnlSnapshotSchema>;
export type ExchangeHealth = z.infer<typeof exchangeHealthSchema>;
export type MMPairConfig = z.infer<typeof mmPairConfigSchema>;
export type MMConfig = z.infer<typeof mmConfigSchema>;
export type EngineStreamPayload = z.infer<typeof engineStreamSchema>;
export type PausePairRequest = z.infer<typeof pausePairRequestSchema>;
export type HedgeRequest = z.infer<typeof hedgeRequestSchema>;
export type KillSwitchRequest = z.infer<typeof killSwitchRequestSchema>;
export type GeoLocation = z.infer<typeof geoLocationSchema>;
export type TopologyBot = z.infer<typeof topologyBotSchema>;
export type RuntimeTopology = z.infer<typeof runtimeTopologySchema>;
export type ExchangeTopology = z.infer<typeof exchangeTopologySchema>;
