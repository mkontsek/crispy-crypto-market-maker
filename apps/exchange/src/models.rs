use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};

pub fn default_pairs() -> [(&'static str, Decimal); 3] {
    [
        ("BTC/USDT", dec!(62000)),
        ("ETH/USDT", dec!(3450)),
        ("SOL/USDT", dec!(140)),
    ]
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairMarketData {
    pub pair: String,
    pub mid: i64,
    pub bid: i64,
    pub ask: i64,
    #[serde(with = "rust_decimal::serde::float")]
    pub spread_bps: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub volatility: Decimal,
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
