use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

pub const PAIRS: [&str; 3] = ["BTC/USDT", "ETH/USDT", "SOL/USDT"];
pub const EXCHANGES: [&str; 3] = ["Binance", "Bybit", "OKX"];

/// Market data received from the exchange over its WebSocket feed.
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangePairData {
    pub pair: String,
    pub mid: i64,
    #[serde(with = "rust_decimal::serde::float")]
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
    pub price: i64,
    pub size: i64,
}

/// Response from exchange after placing an order.
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangeOrderResponse {
    pub pair: String,
    pub side: String,
    pub filled: bool,
    pub fill_price: i64,
    pub fill_size: i64,
    pub adverse_selection: bool,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairConfig {
    pub pair: String,
    #[serde(with = "rust_decimal::serde::float")]
    pub base_spread_bps: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub volatility_multiplier: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub max_inventory: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub inventory_skew_sensitivity: Decimal,
    pub quote_refresh_interval_ms: u64,
    pub enabled: bool,
    pub hedging_enabled: bool,
    #[serde(with = "rust_decimal::serde::float")]
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
    pub bid: i64,
    pub ask: i64,
    pub mid: i64,
    #[serde(with = "rust_decimal::serde::float")]
    pub spread_bps: Decimal,
    pub inventory_skew: i64,
    #[serde(with = "rust_decimal::serde::float")]
    pub quote_refresh_rate: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
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
    pub price: i64,
    pub size: i64,
    pub mid_at_fill: i64,
    pub realized_spread: i64,
    pub adverse_selection: bool,
    pub timestamp: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InventorySnapshot {
    pub pair: String,
    pub inventory: i64,
    #[serde(with = "rust_decimal::serde::float")]
    pub normalized_skew: Decimal,
    pub timestamp: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PnLSnapshot {
    pub timestamp: String,
    pub total_pnl: i64,
    pub realized_spread: i64,
    pub hedging_costs: i64,
    #[serde(with = "rust_decimal::serde::float")]
    pub adverse_selection_rate: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub fill_rate: Decimal,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangeHealth {
    pub pair: String,
    pub exchange: String,
    #[serde(with = "rust_decimal::serde::float")]
    pub tick_latency_ms: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
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
