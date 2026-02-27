use std::collections::HashMap;

use crate::models::{
    ExchangeFeedPayload, ExchangeOrderRequest, MMConfig, PAIRS, PairConfig,
};
use crate::utils::{from_price_fp, from_size_fp, to_price_fp, to_size_fp};

mod payload;

#[derive(Clone)]
pub struct PairState {
    pub mid: i64,
    pub bid: i64,
    pub ask: i64,
    pub spread_bps: f64,
    pub inventory: i64,
    pub inventory_skew: i64,
    pub quote_refresh_rate: f64,
    pub volatility: f64,
    pub paused: bool,
}

impl PairState {
    pub fn new(mid: f64) -> Self {
        let mid_fp = to_price_fp(mid);
        Self {
            mid: mid_fp,
            bid: mid_fp,
            ask: mid_fp,
            spread_bps: 10.0,
            inventory: 0,
            inventory_skew: 0,
            quote_refresh_rate: 4.0,
            volatility: 1.0,
            paused: false,
        }
    }
}

pub struct EngineState {
    pub config: MMConfig,
    pub pairs: HashMap<String, PairState>,
    /// Whether the bot is currently connected to the exchange.
    pub exchange_connected: bool,
    pub total_realized_spread: i64,
    pub hedging_costs: i64,
    pub total_quotes: u64,
    pub total_fills: u64,
    pub adverse_fills: u64,
    pub fill_seq: u64,
}

impl EngineState {
    pub fn new() -> Self {
        let mut pairs = HashMap::new();
        pairs.insert("BTC/USDT".to_string(), PairState::new(62_000.0));
        pairs.insert("ETH/USDT".to_string(), PairState::new(3_450.0));
        pairs.insert("SOL/USDT".to_string(), PairState::new(140.0));

        let config = MMConfig {
            pairs: PAIRS
                .iter()
                .map(|pair| PairConfig {
                    pair: (*pair).to_string(),
                    base_spread_bps: 10.0,
                    volatility_multiplier: 1.15,
                    max_inventory: 6.0,
                    inventory_skew_sensitivity: 0.35,
                    quote_refresh_interval_ms: 250,
                    enabled: true,
                    hedging_enabled: true,
                    hedge_threshold: 4.5,
                    hedge_exchange: "Bybit".to_string(),
                })
                .collect(),
        };

        Self {
            config,
            pairs,
            exchange_connected: false,
            total_realized_spread: 0,
            hedging_costs: 0,
            total_quotes: 0,
            total_fills: 0,
            adverse_fills: 0,
            fill_seq: 0,
        }
    }

    /// Called by the exchange WebSocket listener whenever new market data arrives.
    /// Updates mid prices and volatility for each pair from the exchange feed.
    pub fn update_from_exchange(&mut self, feed: ExchangeFeedPayload) {
        self.exchange_connected = true;
        for pair_data in feed.pairs {
            if let Some(pair) = self.pairs.get_mut(&pair_data.pair) {
                pair.mid = pair_data.mid;
                pair.volatility = pair_data.volatility;
            }
        }
    }

    /// Compute MM quotes and return the list of orders to place on the exchange.
    /// Updates bid/ask/spread in PairState based on current exchange prices + MM config.
    pub fn compute_orders(&mut self) -> Vec<ExchangeOrderRequest> {
        let mut orders = Vec::new();

        for cfg in self.config.pairs.clone() {
            let Some(pair) = self.pairs.get_mut(&cfg.pair) else {
                continue;
            };

            if !cfg.enabled {
                pair.paused = true;
            }

            if pair.paused {
                continue;
            }

            let spread_bps =
                cfg.base_spread_bps * (1.0 + cfg.volatility_multiplier * pair.volatility / 10.0);
            let spread_abs = to_price_fp(from_price_fp(pair.mid) * spread_bps / 10_000.0);

            pair.inventory_skew =
                to_price_fp(-from_size_fp(pair.inventory) * cfg.inventory_skew_sensitivity);
            pair.bid = pair.mid - spread_abs / 2 + pair.inventory_skew;
            pair.ask = pair.mid + spread_abs / 2 + pair.inventory_skew;
            pair.spread_bps = spread_bps;
            pair.quote_refresh_rate = 1_000.0 / cfg.quote_refresh_interval_ms as f64;
            self.total_quotes = self.total_quotes.saturating_add(1);

            // Standard order size sent to exchange each tick.
            let order_size = to_size_fp(0.5);
            orders.push(ExchangeOrderRequest {
                pair: cfg.pair.clone(),
                side: "buy".to_string(),
                price: pair.bid,
                size: order_size,
            });
            orders.push(ExchangeOrderRequest {
                pair: cfg.pair.clone(),
                side: "sell".to_string(),
                price: pair.ask,
                size: order_size,
            });
        }

        orders
    }

}
