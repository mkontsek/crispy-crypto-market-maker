use serde::{Deserialize, Serialize};

pub const PAIRS: [&str; 3] = ["BTC/USDT", "ETH/USDT", "SOL/USDT"];
pub const EXCHANGES: [&str; 3] = ["Binance", "Bybit", "OKX"];

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairConfig {
    pub pair: String,
    pub base_spread_bps: f64,
    pub volatility_multiplier: f64,
    pub max_inventory: f64,
    pub inventory_skew_sensitivity: f64,
    pub quote_refresh_interval_ms: u64,
    pub enabled: bool,
    pub hedging_enabled: bool,
    pub hedge_threshold: f64,
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
    pub spread_bps: f64,
    pub inventory_skew: i64,
    pub quote_refresh_rate: f64,
    pub volatility: f64,
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
    pub normalized_skew: f64,
    pub timestamp: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PnLSnapshot {
    pub timestamp: String,
    pub total_pnl: i64,
    pub realized_spread: i64,
    pub hedging_costs: i64,
    pub adverse_selection_rate: f64,
    pub fill_rate: f64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangeHealth {
    pub pair: String,
    pub exchange: String,
    pub tick_latency_ms: f64,
    pub feed_staleness_ms: f64,
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
