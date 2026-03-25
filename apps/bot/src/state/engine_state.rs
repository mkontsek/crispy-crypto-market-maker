use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use std::collections::HashMap;

use crate::models::{
    ExchangeFeedPayload, ExchangeOrderRequest, MMConfig, OrderSide, StrategyPreset, PAIRS,
};
use crate::state::strategy::strategy_pair_configs;
use crate::state::PairState;

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
    /// When true, no orders are placed and all pairs are kept paused.
    pub kill_switch_engaged: bool,
    /// Currently active strategy preset name.
    pub active_strategy: StrategyPreset,
}

impl EngineState {
    pub fn new() -> Self {
        let mut pairs = HashMap::new();
        pairs.insert("BTC/USDT".to_string(), PairState::new(dec!(62000)));
        pairs.insert("ETH/USDT".to_string(), PairState::new(dec!(3450)));
        pairs.insert("SOL/USDT".to_string(), PairState::new(dec!(140)));

        let pair_names: Vec<String> = PAIRS.iter().map(|p| (*p).to_string()).collect();
        let config = MMConfig {
            pairs: strategy_pair_configs(&StrategyPreset::Balanced, &pair_names),
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
            kill_switch_engaged: false,
            active_strategy: StrategyPreset::Balanced,
        }
    }

    /// Apply a strategy preset, updating all pair configs accordingly.
    pub fn apply_strategy_preset(&mut self, preset: StrategyPreset) {
        let pair_names: Vec<String> = self.config.pairs.iter().map(|p| p.pair.clone()).collect();
        let pair_configs = strategy_pair_configs(&preset, &pair_names);
        self.config.pairs = pair_configs;
        for cfg in &self.config.pairs {
            if let Some(pair_state) = self.pairs.get_mut(&cfg.pair) {
                pair_state.paused = !cfg.enabled;
            }
        }
        self.active_strategy = preset;
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
    /// Updates bid/ask/spread in `PairState` based on current exchange prices + MM config.
    pub fn compute_orders(&mut self) -> Vec<ExchangeOrderRequest> {
        if self.kill_switch_engaged {
            return Vec::new();
        }

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
                side: OrderSide::Buy,
                price: pair.bid,
                size: order_size,
            });
            orders.push(ExchangeOrderRequest {
                pair: cfg.pair.clone(),
                side: OrderSide::Sell,
                price: pair.ask,
                size: order_size,
            });
        }

        orders
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ExchangeFeedPayload, ExchangePairData, OrderSide};
    use rust_decimal_macros::dec;

    #[test]
    fn pair_state_new_sets_initial_mid() {
        let state = PairState::new(dec!(100));
        assert_eq!(state.mid, dec!(100));
        assert_eq!(state.bid, dec!(100));
        assert_eq!(state.ask, dec!(100));
        assert!(!state.paused);
        assert_eq!(state.inventory, Decimal::ZERO);
    }

    #[test]
    fn engine_state_new_has_three_pairs() {
        let state = EngineState::new();
        assert_eq!(state.pairs.len(), 3);
        assert!(state.pairs.contains_key("BTC/USDT"));
        assert!(state.pairs.contains_key("ETH/USDT"));
        assert!(state.pairs.contains_key("SOL/USDT"));
        assert!(!state.exchange_connected);
        assert_eq!(state.total_fills, 0);
        assert_eq!(state.total_quotes, 0);
    }

    #[test]
    fn update_from_exchange_marks_connected_and_updates_mid() {
        let mut state = EngineState::new();
        assert!(!state.exchange_connected);
        state.update_from_exchange(ExchangeFeedPayload {
            pairs: vec![ExchangePairData {
                pair: "BTC/USDT".to_string(),
                mid: dec!(65000),
                volatility: dec!(1.5),
            }],
        });
        assert!(state.exchange_connected);
        assert_eq!(state.pairs["BTC/USDT"].mid, dec!(65000));
        assert_eq!(state.pairs["BTC/USDT"].volatility, dec!(1.5));
    }

    #[test]
    fn update_from_exchange_ignores_unknown_pair() {
        let mut state = EngineState::new();
        state.update_from_exchange(ExchangeFeedPayload {
            pairs: vec![ExchangePairData {
                pair: "UNKNOWN/USDT".to_string(),
                mid: dec!(999),
                volatility: dec!(1),
            }],
        });
        // Unknown pair should not be inserted
        assert!(!state.pairs.contains_key("UNKNOWN/USDT"));
    }

    #[test]
    fn compute_orders_returns_buy_and_sell_per_enabled_pair() {
        let mut state = EngineState::new();
        state.update_from_exchange(ExchangeFeedPayload {
            pairs: vec![
                ExchangePairData {
                    pair: "BTC/USDT".to_string(),
                    mid: dec!(62000),
                    volatility: dec!(1),
                },
                ExchangePairData {
                    pair: "ETH/USDT".to_string(),
                    mid: dec!(3450),
                    volatility: dec!(1),
                },
                ExchangePairData {
                    pair: "SOL/USDT".to_string(),
                    mid: dec!(140),
                    volatility: dec!(1),
                },
            ],
        });
        let orders = state.compute_orders();
        // 3 pairs × 2 sides = 6 orders
        assert_eq!(orders.len(), 6);
        let btc_orders: Vec<_> = orders.iter().filter(|o| o.pair == "BTC/USDT").collect();
        assert_eq!(btc_orders.len(), 2);
        assert!(btc_orders.iter().any(|o| o.side == OrderSide::Buy));
        assert!(btc_orders.iter().any(|o| o.side == OrderSide::Sell));
    }

    #[test]
    fn compute_orders_bid_is_below_ask() {
        let mut state = EngineState::new();
        state.update_from_exchange(ExchangeFeedPayload {
            pairs: vec![ExchangePairData {
                pair: "BTC/USDT".to_string(),
                mid: dec!(62000),
                volatility: dec!(1),
            }],
        });
        let orders = state.compute_orders();
        let buy = orders
            .iter()
            .find(|o| o.pair == "BTC/USDT" && o.side == OrderSide::Buy)
            .expect("no buy order for BTC/USDT");
        let sell = orders
            .iter()
            .find(|o| o.pair == "BTC/USDT" && o.side == OrderSide::Sell)
            .expect("no sell order for BTC/USDT");
        assert!(buy.price < sell.price, "bid must be below ask");
    }

    #[test]
    fn compute_orders_skips_disabled_pair() {
        let mut state = EngineState::new();
        // Disable ETH/USDT
        for cfg in &mut state.config.pairs {
            if cfg.pair == "ETH/USDT" {
                cfg.enabled = false;
            }
        }
        state.update_from_exchange(ExchangeFeedPayload {
            pairs: vec![
                ExchangePairData {
                    pair: "BTC/USDT".to_string(),
                    mid: dec!(62000),
                    volatility: dec!(1),
                },
                ExchangePairData {
                    pair: "ETH/USDT".to_string(),
                    mid: dec!(3450),
                    volatility: dec!(1),
                },
                ExchangePairData {
                    pair: "SOL/USDT".to_string(),
                    mid: dec!(140),
                    volatility: dec!(1),
                },
            ],
        });
        let orders = state.compute_orders();
        assert!(
            orders.iter().all(|o| o.pair != "ETH/USDT"),
            "disabled pair should produce no orders"
        );
    }

    #[test]
    fn compute_orders_returns_empty_when_kill_switch_engaged() {
        let mut state = EngineState::new();
        state.kill_switch_engaged = true;
        state.update_from_exchange(ExchangeFeedPayload {
            pairs: vec![ExchangePairData {
                pair: "BTC/USDT".to_string(),
                mid: dec!(62000),
                volatility: dec!(1),
            }],
        });
        let orders = state.compute_orders();
        assert!(orders.is_empty(), "kill switch engaged should produce no orders");
    }
}
