import { z } from 'zod';

import { EXCHANGES, PAIRS, STRATEGIES } from './constants';

export const pairSchema = z.enum(PAIRS);
export const exchangeSchema = z.enum(EXCHANGES);
export const strategySchema = z.enum(STRATEGIES);
export const sideSchema = z.enum(['buy', 'sell']);
export const endpointUrlSchema = z.url();
const timestampSchema = z.union([z.string(), z.number()]).transform(String);
export const botIdSchema = z
    .string()
    .trim()
    .regex(/^bot-[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected bot id like "bot-1"');

function isLocalHostname(hostname: string) {
    const normalized = hostname.toLowerCase();
    return (
        normalized === 'localhost' ||
        normalized === '127.0.0.1' ||
        normalized === '::1' ||
        normalized.endsWith('.localhost')
    );
}

function requiresSecureProtocol(value: string) {
    return !isLocalHostname(new URL(value).hostname);
}

export const wsEndpointUrlSchema = endpointUrlSchema.refine((value) => {
    const protocol = new URL(value).protocol;
    if (requiresSecureProtocol(value)) {
        return protocol === 'wss:';
    }
    return protocol === 'ws:' || protocol === 'wss:';
}, 'Expected wss:// URL (ws:// allowed for localhost)');
export const httpEndpointUrlSchema = endpointUrlSchema.refine((value) => {
    const protocol = new URL(value).protocol;
    if (requiresSecureProtocol(value)) {
        return protocol === 'https:';
    }
    return protocol === 'http:' || protocol === 'https:';
}, 'Expected https:// URL (http:// allowed for localhost)');
export const decimalStringSchema = z
    .string()
    .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/, 'Expected decimal string')
    .refine(
        (value) => Number.isFinite(Number(value)),
        'Expected finite decimal string'
    );

function decimalMinSchema(min: number) {
    return decimalStringSchema.refine((value) => Number(value) >= min, {
        message: `Expected decimal >= ${min}`,
    });
}

const decimalNonNegativeSchema = decimalMinSchema(0);
const decimalPositiveSchema = decimalStringSchema.refine(
    (value) => Number(value) > 0,
    {
        message: 'Expected decimal > 0',
    }
);

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
    updatedAt: timestampSchema,
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
    timestamp: timestampSchema,
});

export const inventorySnapshotSchema = z.object({
    pair: pairSchema,
    inventory: decimalStringSchema,
    normalizedSkew: decimalStringSchema,
    timestamp: timestampSchema,
});

export const pnlSnapshotSchema = z.object({
    timestamp: timestampSchema,
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
    timestamp: timestampSchema,
    quotes: z.array(quoteSnapshotSchema),
    fills: z.array(fillSchema),
    inventory: z.array(inventorySnapshotSchema),
    pnl: pnlSnapshotSchema,
    exchangeHealth: z.array(exchangeHealthSchema),
    config: mmConfigSchema,
    killSwitchEngaged: z.boolean().default(false),
    strategy: strategySchema.default('balanced'),
});

export const pausePairRequestSchema = z.object({
    paused: z.boolean(),
});

export const hedgeRequestSchema = z.object({
    pair: pairSchema,
    targetExchange: exchangeSchema.optional(),
});

export const killSwitchRequestSchema = z.object({
    engaged: z.boolean(),
});

export const setStrategyRequestSchema = z.object({
    strategy: strategySchema,
});

export const geoLocationSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().optional(),
});

export const topologyBotSchema = z.object({
    id: botIdSchema,
    name: z.string().min(1),
    wsUrl: wsEndpointUrlSchema,
    httpUrl: httpEndpointUrlSchema,
    location: geoLocationSchema.optional(),
});

export const runtimeTopologySchema = z
    .object({
        exchangeWsUrl: wsEndpointUrlSchema,
        exchangeHttpUrl: httpEndpointUrlSchema,
        exchangeLocation: geoLocationSchema.optional(),
        dashboardLocation: geoLocationSchema.optional(),
        bots: z.array(topologyBotSchema).min(1),
    })
    .refine(
        (value) => {
            const ids = new Set(value.bots.map((bot) => bot.id));
            return ids.size === value.bots.length;
        },
        {
            message: 'Expected unique bot IDs',
            path: ['bots'],
        }
    );

export const exchangeTopologySchema = z.object({
    exchangeWsUrl: wsEndpointUrlSchema,
    exchangeHttpUrl: httpEndpointUrlSchema,
});
