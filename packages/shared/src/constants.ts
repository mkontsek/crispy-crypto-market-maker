export const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'] as const;
export const EXCHANGES = ['Binance', 'Bybit', 'OKX'] as const;
export const PRICE_SCALE = 10_000;
export const SIZE_SCALE = 1_000_000;

export const DEFAULT_ENGINE_WS_URL = 'ws://127.0.0.1:8080/stream';
export const DEFAULT_ENGINE_HTTP_URL = 'http://127.0.0.1:8081';
