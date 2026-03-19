export const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'] as const;
export const EXCHANGES = ['Binance', 'Bybit', 'OKX'] as const;
export const STRATEGIES = ['conservative', 'balanced', 'aggressive'] as const;
export const DEFAULT_BOT_ID = 'bot-1';

/** Bot WebSocket stream – localhost dev default (consumed by the Next.js BFF). */
export const DEFAULT_ENGINE_WS_URL = 'ws://127.0.0.1:3110/stream';
/** Bot HTTP command API – localhost dev default (consumed by the Next.js BFF). */
export const DEFAULT_ENGINE_HTTP_URL = 'http://127.0.0.1:3110';

/** Bot WebSocket stream – production default (consumed by the Next.js BFF). */
export const PROD_ENGINE_WS_URL = 'wss://bot-joe.sabercrown.com/stream';
/** Bot HTTP command API – production default (consumed by the Next.js BFF). */
export const PROD_ENGINE_HTTP_URL = 'https://bot-joe.sabercrown.com';

/** Exchange WebSocket feed – localhost dev default (consumed by the bot). */
export const DEFAULT_EXCHANGE_WS_URL = 'ws://127.0.0.1:3111/feed';
/** Exchange HTTP order API – localhost dev default (consumed by the bot). */
export const DEFAULT_EXCHANGE_HTTP_URL = 'http://127.0.0.1:3111';

/** Exchange WebSocket feed – production default (consumed by the bot). */
export const PROD_EXCHANGE_WS_URL = 'wss://exchange-nancy.sabercrown.com/feed';
/** Exchange HTTP order API – production default (consumed by the bot). */
export const PROD_EXCHANGE_HTTP_URL = 'https://exchange-nancy.sabercrown.com';
