use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

pub const PAIRS: [&str; 3] = ["BTC/USDT", "ETH/USDT", "SOL/USDT"];
pub const EXCHANGES: [&str; 3] = ["Binance", "Bybit", "OKX"];

/// Market data received from the exchange over its WebSocket feed.
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangePairData {
    pub pair: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub mid: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub volatility: Decimal,
}

/// Top-level payload broadcast by the exchange's WS feed.
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangeFeedPayload {
    pub pairs: Vec<ExchangePairData>,
}

/// Request sent to exchange to place an order.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangeOrderRequest {
    pub pair: String,
    pub side: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub size: Decimal,
}

/// Response from exchange after placing an order.
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangeOrderResponse {
    pub pair: String,
    pub side: String,
    pub filled: bool,
    #[serde(with = "rust_decimal::serde::str")]
    pub fill_price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub fill_size: Decimal,
    pub adverse_selection: bool,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairConfig {
    pub pair: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub base_spread_bps: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub volatility_multiplier: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub max_inventory: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub inventory_skew_sensitivity: Decimal,
    pub quote_refresh_interval_ms: u64,
    pub enabled: bool,
    pub hedging_enabled: bool,
    #[serde(with = "rust_decimal::serde::str")]
    pub hedge_threshold: Decimal,
    pub hedge_exchange: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct MMConfig {
    pub pairs: Vec<PairConfig>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteSnapshot {
    pub pair: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub bid: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub ask: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub mid: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub spread_bps: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub inventory_skew: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub quote_refresh_rate: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub volatility: Decimal,
    pub paused: bool,
    pub updated_at: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Fill {
    pub id: String,
    pub pair: String,
    pub side: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub size: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub mid_at_fill: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub realized_spread: Decimal,
    pub adverse_selection: bool,
    pub timestamp: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InventorySnapshot {
    pub pair: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub inventory: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub normalized_skew: Decimal,
    pub timestamp: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PnLSnapshot {
    pub timestamp: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_pnl: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub realized_spread: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub hedging_costs: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub adverse_selection_rate: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub fill_rate: Decimal,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangeHealth {
    pub pair: String,
    pub exchange: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub tick_latency_ms: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub feed_staleness_ms: Decimal,
    pub connected: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStreamPayload {
    pub timestamp: String,
    pub quotes: Vec<QuoteSnapshot>,
    pub fills: Vec<Fill>,
    pub inventory: Vec<InventorySnapshot>,
    pub pnl: PnLSnapshot,
    pub exchange_health: Vec<ExchangeHealth>,
    pub config: MMConfig,
}

#[derive(Clone, Deserialize)]
pub struct PauseRequest {
    pub paused: bool,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HedgeRequest {
    pub pair: String,
    pub target_exchange: Option<String>,
}
