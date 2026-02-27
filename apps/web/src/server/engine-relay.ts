import {
  DEFAULT_ENGINE_WS_URL,
  engineStreamSchema,
  type EngineStreamPayload,
  type ExchangeHealth,
  type Fill,
  type InventorySnapshot,
  type MMConfig,
  type PnLSnapshot,
  type QuoteSnapshot,
} from '@crispy/shared';
import WebSocket from 'ws';

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
};

const relayState: RelayState = {
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
};

const listeners = new Set<(payload: EngineStreamPayload) => void>();
let socket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let started = false;
const engineWsUrl = process.env.ENGINE_WS_URL ?? DEFAULT_ENGINE_WS_URL;

function cap<T>(values: T[], size: number): T[] {
  return values.length > size ? values.slice(0, size) : values;
}

function ingestPayload(payload: EngineStreamPayload) {
  relayState.connected = true;
  relayState.lastUpdated = payload.timestamp;
  relayState.quotes = payload.quotes;
  relayState.inventory = payload.inventory;
  relayState.exchangeHealth = payload.exchangeHealth;
  relayState.config = payload.config;

  relayState.fills = cap([...payload.fills, ...relayState.fills], 500);
  relayState.pnlHistory = cap([payload.pnl, ...relayState.pnlHistory], 500);

  for (const snapshot of payload.inventory) {
    const history = relayState.inventoryHistory[snapshot.pair] ?? [];
    relayState.inventoryHistory[snapshot.pair] = cap([snapshot, ...history], 500);
  }

  const filledPairs = new Set(payload.fills.map((fill) => fill.pair));
  const quoteEvents: QuoteHistoryEntry[] = payload.quotes.map((quote) => ({
    ...quote,
    status: filledPairs.has(quote.pair) ? 'filled' : 'expired',
    timestamp: payload.timestamp,
  }));
  relayState.quoteHistory = cap([...quoteEvents, ...relayState.quoteHistory], 1_000);

  for (const listener of listeners) {
    listener(payload);
  }
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 1_000);
}

function connect() {
  socket = new WebSocket(engineWsUrl);

  socket.on('open', () => {
    relayState.connected = true;
  });

  socket.on('message', (data) => {
    const raw = data.toString();
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (error) {
      console.error('engine relay received invalid json', error);
      return;
    }

    const parsed = engineStreamSchema.safeParse(json);
    if (!parsed.success) {
      console.error('engine relay payload failed schema validation', parsed.error.flatten());
      return;
    }

    ingestPayload(parsed.data);
  });

  socket.on('close', () => {
    relayState.connected = false;
    scheduleReconnect();
  });

  socket.on('error', (error) => {
    console.error('engine relay websocket error', error);
    relayState.connected = false;
    socket?.close();
  });
}

export function ensureEngineRelayRunning() {
  if (started) {
    return;
  }

  started = true;
  connect();
}

export function subscribeToEngineStream(
  listener: (payload: EngineStreamPayload) => void
) {
  ensureEngineRelayRunning();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRelaySnapshot(): RelayState {
  ensureEngineRelayRunning();
  return {
    connected: relayState.connected,
    lastUpdated: relayState.lastUpdated,
    quotes: [...relayState.quotes],
    fills: [...relayState.fills],
    inventory: [...relayState.inventory],
    inventoryHistory: { ...relayState.inventoryHistory },
    pnlHistory: [...relayState.pnlHistory],
    exchangeHealth: [...relayState.exchangeHealth],
    quoteHistory: [...relayState.quoteHistory],
    config: relayState.config,
  };
}
