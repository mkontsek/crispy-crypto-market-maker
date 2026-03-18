export const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'] as const;
export const EXCHANGES = ['Binance', 'Bybit', 'OKX'] as const;
export const STRATEGIES = ['conservative', 'balanced', 'aggressive'] as const;
export const DEFAULT_BOT_ID = 'bot-1';

/** Bot WebSocket stream (consumed by the Next.js BFF). */
export const DEFAULT_ENGINE_WS_URL = 'ws://127.0.0.1:3110/stream';
/** Bot HTTP command API (consumed by the Next.js BFF). */
export const DEFAULT_ENGINE_HTTP_URL = 'http://127.0.0.1:3110';

/** Exchange WebSocket feed (consumed by the bot). */
export const DEFAULT_EXCHANGE_WS_URL = 'ws://127.0.0.1:3111/feed';
/** Exchange HTTP order API (consumed by the bot). */
export const DEFAULT_EXCHANGE_HTTP_URL = 'http://127.0.0.1:3111';
