import type {
    ExchangeHealth,
    Fill,
    InventorySnapshot,
    MMConfig,
    PnLSnapshot,
    QuoteSnapshot,
} from '@crispy/shared';

type QuoteHistoryEntry = QuoteSnapshot & {
    status: 'filled' | 'expired';
    timestamp: string;
};

type StickyBotCache = {
    quotes: QuoteSnapshot[];
    fills: Fill[];
    pnl: PnLSnapshot[];
    inventory: InventorySnapshot[];
    health: ExchangeHealth[];
    quoteHistory: QuoteHistoryEntry[];
    config: MMConfig | null;
};

type StickyState<T> = {
    value: T;
    usingCache: boolean;
    hasSeen: boolean;
};

type StickyInput = {
    botId: string;
    rawQuotes: QuoteSnapshot[];
    rawFills: Fill[];
    rawPnl: PnLSnapshot[];
    rawInventory: InventorySnapshot[];
    rawHealth: ExchangeHealth[];
    rawQuoteHistory: QuoteHistoryEntry[];
    rawConfig: MMConfig | null;
    streamStale: boolean;
};

export type StickyBotSections = {
    quotes: QuoteSnapshot[];
    fills: Fill[];
    pnl: PnLSnapshot[];
    inventory: InventorySnapshot[];
    health: ExchangeHealth[];
    quoteHistory: QuoteHistoryEntry[];
    config: MMConfig | null;
    stale: {
        liveQuotes: boolean;
        risk: boolean;
        inventory: boolean;
        pnlPerformance: boolean;
        exposure: boolean;
        fillMetrics: boolean;
        pnlCurve: boolean;
        quoteHistory: boolean;
        config: boolean;
        exchangeHealth: boolean;
    };
};

const cacheByBotId = new Map<string, StickyBotCache>();

function getCache(botId: string): StickyBotCache {
    const existing = cacheByBotId.get(botId);
    if (existing) {
        return existing;
    }
    const created: StickyBotCache = {
        quotes: [],
        fills: [],
        pnl: [],
        inventory: [],
        health: [],
        quoteHistory: [],
        config: null,
    };
    cacheByBotId.set(botId, created);
    return created;
}

function resolveStickyList<T>(current: T[], cached: T[]): StickyState<T[]> {
    if (current.length > 0) {
        return { value: current, usingCache: false, hasSeen: true };
    }

    if (cached.length > 0) {
        return { value: cached, usingCache: true, hasSeen: true };
    }

    return { value: current, usingCache: false, hasSeen: false };
}

function resolveStickyValue<T>(current: T | null, cached: T | null): StickyState<T | null> {
    if (current !== null) {
        return { value: current, usingCache: false, hasSeen: true };
    }

    if (cached !== null) {
        return { value: cached, usingCache: true, hasSeen: true };
    }

    return { value: null, usingCache: false, hasSeen: false };
}

export function resolveStickyBotSections(input: StickyInput): StickyBotSections {
    const cache = getCache(input.botId);

    const quotesState = resolveStickyList(input.rawQuotes, cache.quotes);
    const fillsState = resolveStickyList(input.rawFills, cache.fills);
    const pnlState = resolveStickyList(input.rawPnl, cache.pnl);
    const inventoryState = resolveStickyList(input.rawInventory, cache.inventory);
    const healthState = resolveStickyList(input.rawHealth, cache.health);
    const quoteHistoryState = resolveStickyList(
        input.rawQuoteHistory,
        cache.quoteHistory
    );
    const configState = resolveStickyValue(input.rawConfig, cache.config);

    if (input.rawQuotes.length > 0) {
        cache.quotes = input.rawQuotes;
    }
    if (input.rawFills.length > 0) {
        cache.fills = input.rawFills;
    }
    if (input.rawPnl.length > 0) {
        cache.pnl = input.rawPnl;
    }
    if (input.rawInventory.length > 0) {
        cache.inventory = input.rawInventory;
    }
    if (input.rawHealth.length > 0) {
        cache.health = input.rawHealth;
    }
    if (input.rawQuoteHistory.length > 0) {
        cache.quoteHistory = input.rawQuoteHistory;
    }
    if (input.rawConfig !== null) {
        cache.config = input.rawConfig;
    }

    const liveQuotes =
        quotesState.usingCache || (input.streamStale && quotesState.hasSeen);
    const risk =
        quotesState.usingCache ||
        fillsState.usingCache ||
        pnlState.usingCache ||
        inventoryState.usingCache ||
        healthState.usingCache ||
        configState.usingCache ||
        (input.streamStale &&
            (quotesState.hasSeen ||
                inventoryState.hasSeen ||
                healthState.hasSeen ||
                pnlState.hasSeen));
    const inventory =
        inventoryState.usingCache ||
        quotesState.usingCache ||
        (input.streamStale && (inventoryState.hasSeen || quotesState.hasSeen));
    const pnlPerformance =
        pnlState.usingCache ||
        fillsState.usingCache ||
        (input.streamStale && (pnlState.hasSeen || fillsState.hasSeen));
    const exposure =
        inventoryState.usingCache ||
        quotesState.usingCache ||
        configState.usingCache ||
        (input.streamStale &&
            (inventoryState.hasSeen || quotesState.hasSeen || configState.hasSeen));
    const fillMetrics =
        fillsState.usingCache ||
        quoteHistoryState.usingCache ||
        (input.streamStale && (fillsState.hasSeen || quoteHistoryState.hasSeen));
    const pnlCurve = pnlState.usingCache || (input.streamStale && pnlState.hasSeen);
    const quoteHistory =
        quoteHistoryState.usingCache ||
        (input.streamStale && quoteHistoryState.hasSeen);
    const config = configState.usingCache || (input.streamStale && configState.hasSeen);
    const exchangeHealth =
        healthState.usingCache || (input.streamStale && healthState.hasSeen);

    return {
        quotes: quotesState.value,
        fills: fillsState.value,
        pnl: pnlState.value,
        inventory: inventoryState.value,
        health: healthState.value,
        quoteHistory: quoteHistoryState.value,
        config: configState.value,
        stale: {
            liveQuotes,
            risk,
            inventory,
            pnlPerformance,
            exposure,
            fillMetrics,
            pnlCurve,
            quoteHistory,
            config,
            exchangeHealth,
        },
    };
}
