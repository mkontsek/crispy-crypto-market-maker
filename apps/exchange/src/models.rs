use serde::{Deserialize, Serialize};

pub const PAIRS: [(&str, f64); 3] = [
    ("BTC/USDT", 62_000.0),
    ("ETH/USDT", 3_450.0),
    ("SOL/USDT", 140.0),
];

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairMarketData {
    pub pair: String,
    pub mid: i64,
    pub bid: i64,
    pub ask: i64,
    pub spread_bps: f64,
    pub volatility: f64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketDataPayload {
    pub timestamp: String,
    pub fake: bool,
    pub pairs: Vec<PairMarketData>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderRequest {
    pub pair: String,
    pub side: String,
    pub price: i64,
    pub size: i64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderResponse {
    pub pair: String,
    pub side: String,
    pub filled: bool,
    pub fill_price: i64,
    pub fill_size: i64,
    pub adverse_selection: bool,
}
