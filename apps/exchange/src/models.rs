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
    #[serde(with = "rust_decimal::serde::str")]
    pub mid: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub bid: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub ask: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub spread_bps: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
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
    #[serde(with = "rust_decimal::serde::str")]
    pub price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub size: Decimal,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderResponse {
    pub pair: String,
    pub side: String,
    pub filled: bool,
    #[serde(with = "rust_decimal::serde::str")]
    pub fill_price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub fill_size: Decimal,
    pub adverse_selection: bool,
}
