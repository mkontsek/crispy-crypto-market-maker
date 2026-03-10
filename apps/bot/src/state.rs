use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use std::collections::HashMap;

use crate::models::{ExchangeFeedPayload, ExchangeOrderRequest, MMConfig, PairConfig, PAIRS};

mod payload;

#[derive(Clone)]
pub struct PairState {
    pub mid: Decimal,
    pub bid: Decimal,
    pub ask: Decimal,
    pub spread_bps: Decimal,
    pub inventory: Decimal,
    pub inventory_skew: Decimal,
    pub quote_refresh_rate: Decimal,
    pub volatility: Decimal,
    pub paused: bool,
}

impl PairState {
    pub fn new(mid: Decimal) -> Self {
        Self {
            mid,
            bid: mid,
            ask: mid,
            spread_bps: dec!(10),
            inventory: Decimal::ZERO,
            inventory_skew: Decimal::ZERO,
            quote_refresh_rate: dec!(4),
            volatility: Decimal::ONE,
            paused: false,
        }
    }
}

pub struct EngineState {
    pub config: MMConfig,
    pub pairs: HashMap<String, PairState>,
    /// Whether the bot is currently connected to the exchange.
    pub exchange_connected: bool,
    pub total_realized_spread: Decimal,
    pub hedging_costs: Decimal,
    pub total_quotes: u64,
    pub total_fills: u64,
    pub adverse_fills: u64,
    pub fill_seq: u64,
}

impl EngineState {
    pub fn new() -> Self {
        let mut pairs = HashMap::new();
        pairs.insert("BTC/USDT".to_string(), PairState::new(dec!(62000)));
        pairs.insert("ETH/USDT".to_string(), PairState::new(dec!(3450)));
        pairs.insert("SOL/USDT".to_string(), PairState::new(dec!(140)));

        let config = MMConfig {
            pairs: PAIRS
                .iter()
                .map(|pair| PairConfig {
                    pair: (*pair).to_string(),
                    base_spread_bps: dec!(10),
                    volatility_multiplier: dec!(1.15),
                    max_inventory: dec!(6),
                    inventory_skew_sensitivity: dec!(0.35),
                    quote_refresh_interval_ms: 250,
                    enabled: true,
                    hedging_enabled: true,
                    hedge_threshold: dec!(4.5),
                    hedge_exchange: "Bybit".to_string(),
                })
                .collect(),
        };

        Self {
            config,
            pairs,
            exchange_connected: false,
            total_realized_spread: Decimal::ZERO,
            hedging_costs: Decimal::ZERO,
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

            let spread_bps = cfg.base_spread_bps
                * (Decimal::ONE + cfg.volatility_multiplier * pair.volatility / dec!(10));
            let spread_abs = pair.mid * spread_bps / dec!(10_000);

            pair.inventory_skew = -pair.inventory * cfg.inventory_skew_sensitivity;
            pair.bid = pair.mid - spread_abs / dec!(2) + pair.inventory_skew;
            pair.ask = pair.mid + spread_abs / dec!(2) + pair.inventory_skew;
            pair.spread_bps = spread_bps;
            pair.quote_refresh_rate =
                Decimal::from(1_000_u64) / Decimal::from(cfg.quote_refresh_interval_ms);
            self.total_quotes = self.total_quotes.saturating_add(1);

            // Standard order size sent to exchange each tick.
            let order_size = dec!(0.5);
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
