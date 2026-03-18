import {
    engineStreamSchema,
    type BotId,
    type EngineStreamPayload,
    type ExchangeHealth,
    type Fill,
    type InventorySnapshot,
    type MMConfig,
    type PnLSnapshot,
    type QuoteSnapshot,
} from '@crispy/shared';
import WebSocket from 'ws';

import { persistPayload } from '@/server/db-writer';
import {
    getRuntimeTopology,
    resolveBotTopology,
} from '@/server/runtime-topology';

export type QuoteHistoryEntry = QuoteSnapshot & {
    status: 'filled' | 'expired';
    timestamp: string;
};

type RelayState = {
    connected: boolean;
    lastUpdated: string | null;
    quotes: QuoteSnapshot[];
    fills: Fill[];
    inventory: InventorySnapshot[];
    inventoryHistory: Record<string, InventorySnapshot[]>;
    pnlHistory: PnLSnapshot[];
    exchangeHealth: ExchangeHealth[];
    quoteHistory: QuoteHistoryEntry[];
    config: MMConfig | null;
    killSwitchEngaged: boolean;
    strategy: string;
};

type BotRelay = {
    state: RelayState;
    listeners: Set<(payload: EngineStreamPayload) => void>;
    socket: WebSocket | null;
    reconnectTimer: NodeJS.Timeout | null;
    started: boolean;
    wsUrl: string | null;
};

function createRelayState(): RelayState {
    return {
        connected: false,
        lastUpdated: null,
        quotes: [],
        fills: [],
        inventory: [],
        inventoryHistory: {},
        pnlHistory: [],
        exchangeHealth: [],
        quoteHistory: [],
        config: null,
        killSwitchEngaged: false,
        strategy: 'balanced',
    };
}

function createRelay(): BotRelay {
    return {
        state: createRelayState(),
        listeners: new Set<(payload: EngineStreamPayload) => void>(),
        socket: null,
        reconnectTimer: null,
        started: false,
        wsUrl: null,
    };
}

const relays = new Map<BotId, BotRelay>();

function getRelay(botId: BotId): BotRelay {
    const existing = relays.get(botId);
    if (existing) {
        return existing;
    }
    const relay = createRelay();
    relays.set(botId, relay);
    return relay;
}

function cap<T>(values: T[], size: number): T[] {
    return values.length > size ? values.slice(0, size) : values;
}

function ingestPayload(botId: BotId, payload: EngineStreamPayload) {
    const relay = getRelay(botId);
    relay.state.connected = true;
    relay.state.lastUpdated = payload.timestamp;
    relay.state.quotes = payload.quotes;
    relay.state.inventory = payload.inventory;
    relay.state.exchangeHealth = payload.exchangeHealth;
    relay.state.config = payload.config;
    relay.state.killSwitchEngaged = payload.killSwitchEngaged;
    relay.state.strategy = payload.strategy;

    relay.state.fills = cap([...payload.fills, ...relay.state.fills], 500);
    relay.state.pnlHistory = cap([payload.pnl, ...relay.state.pnlHistory], 500);

    for (const snapshot of payload.inventory) {
        const history = relay.state.inventoryHistory[snapshot.pair] ?? [];
        relay.state.inventoryHistory[snapshot.pair] = cap(
            [snapshot, ...history],
            500
        );
    }

    const filledPairs = new Set(payload.fills.map((fill) => fill.pair));
    const quoteEvents: QuoteHistoryEntry[] = payload.quotes.map((quote) => ({
        ...quote,
        status: filledPairs.has(quote.pair) ? 'filled' : 'expired',
        timestamp: payload.timestamp,
    }));
    relay.state.quoteHistory = cap(
        [...quoteEvents, ...relay.state.quoteHistory],
        1_000
    );

    for (const listener of relay.listeners) {
        listener(payload);
    }

    persistPayload(botId, payload);
}

function scheduleReconnect(botId: BotId) {
    const relay = getRelay(botId);
    if (relay.reconnectTimer) {
        return;
    }

    relay.reconnectTimer = setTimeout(() => {
        relay.reconnectTimer = null;
        connect(botId);
    }, 1_000);
}

function connect(botId: BotId) {
    const relay = getRelay(botId);
    if (!relay.wsUrl || relay.socket) {
        return;
    }

    const ws = new WebSocket(relay.wsUrl);
    relay.socket = ws;

    ws.on('open', () => {
        if (relay.socket !== ws) {
            return;
        }
        relay.state.connected = true;
    });

    ws.on('message', (data) => {
        const raw = data.toString();
        let json: unknown;
        try {
            json = JSON.parse(raw);
        } catch (error) {
            console.error(
                `engine relay (${botId}) received invalid json`,
                error
            );
            return;
        }

        const parsed = engineStreamSchema.safeParse(json);
        if (!parsed.success) {
            console.error(
                `engine relay (${botId}) payload failed schema validation`,
                parsed.error.flatten()
            );
            return;
        }

        ingestPayload(botId, parsed.data);
    });

    ws.on('close', () => {
        if (relay.socket !== ws) {
            return;
        }
        relay.socket = null;
        relay.state.connected = false;
        scheduleReconnect(botId);
    });

    ws.on('error', (error) => {
        if (relay.socket !== ws) {
            return;
        }
        console.error(`engine relay (${botId}) websocket error`, error);
        relay.state.connected = false;
        ws.close();
    });
}

function stopRelay(relay: BotRelay) {
    if (relay.reconnectTimer) {
        clearTimeout(relay.reconnectTimer);
        relay.reconnectTimer = null;
    }

    if (relay.socket) {
        const socket = relay.socket;
        relay.socket = null;
        socket.close();
    }
}

function pruneInactiveRelays() {
    const activeBotIds = new Set(
        getRuntimeTopology().bots.map((bot) => bot.id)
    );
    for (const [botId, relay] of relays) {
        if (activeBotIds.has(botId)) {
            continue;
        }
        stopRelay(relay);
        relays.delete(botId);
    }
}

function syncBotRelay(botId: BotId) {
    const relay = getRelay(botId);
    const topology = resolveBotTopology(botId);

    if (!relay.started) {
        relay.started = true;
        relay.wsUrl = topology.wsUrl;
        connect(botId);
        return;
    }

    if (relay.wsUrl === topology.wsUrl) {
        return;
    }

    relay.wsUrl = topology.wsUrl;
    relay.state.connected = false;
    stopRelay(relay);
    connect(botId);
}

export function subscribeToEngineStream(
    botId: BotId,
    listener: (payload: EngineStreamPayload) => void
) {
    pruneInactiveRelays();
    syncBotRelay(botId);
    const relay = getRelay(botId);
    relay.listeners.add(listener);
    return () => {
        relay.listeners.delete(listener);
    };
}

export function getRelaySnapshot(botId: BotId): RelayState {
    pruneInactiveRelays();
    syncBotRelay(botId);
    const state = getRelay(botId).state;

    return {
        connected: state.connected,
        lastUpdated: state.lastUpdated,
        quotes: [...state.quotes],
        fills: [...state.fills],
        inventory: [...state.inventory],
        inventoryHistory: { ...state.inventoryHistory },
        pnlHistory: [...state.pnlHistory],
        exchangeHealth: [...state.exchangeHealth],
        quoteHistory: [...state.quoteHistory],
        config: state.config,
        killSwitchEngaged: state.killSwitchEngaged,
        strategy: state.strategy,
    };
}

export function ensureEngineRelaysRunning() {
    pruneInactiveRelays();
    for (const bot of getRuntimeTopology().bots) {
        syncBotRelay(bot.id);
    }
}
