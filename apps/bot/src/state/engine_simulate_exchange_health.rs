use rand::RngExt;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

use super::EngineState;
use crate::models::{ExchangeHealth, EXCHANGES};

impl EngineState {
    /// Simulate exchange connectivity metrics (bot's perspective of the exchange).
    pub(super) fn simulate_exchange_health(
        &self,
        pair: &str,
        rng: &mut impl RngExt,
    ) -> Vec<ExchangeHealth> {
        EXCHANGES
            .iter()
            .map(|exchange| {
                let feed_staleness_ms = if self.exchange_connected {
                    Decimal::from(rng.random_range(50..1200)) / dec!(10)
                } else {
                    Decimal::from(rng.random_range(1800..5000)) / dec!(10)
                };
                ExchangeHealth {
                    pair: pair.to_string(),
                    exchange: exchange.to_string(),
                    tick_latency_ms: Decimal::from(rng.random_range(40..260)) / dec!(10),
                    feed_staleness_ms,
                    connected: feed_staleness_ms < dec!(180),
                }
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use rust_decimal::Decimal;
    use rust_decimal_macros::dec;

    use crate::models::{MMConfig, PairConfig, StrategyPreset, EXCHANGES};
    use crate::state::{EngineState, PairState};

    /// Build a minimal `EngineState` with a single pair for testing.
    fn test_engine_state(pair: &str, mid: Decimal) -> EngineState {
        let mut pairs = HashMap::new();
        pairs.insert(pair.to_string(), PairState::new(mid));

        let config = MMConfig {
            pairs: vec![PairConfig {
                pair: pair.to_string(),
                base_spread_bps: dec!(10),
                volatility_multiplier: dec!(1.15),
                max_inventory: dec!(6),
                inventory_skew_sensitivity: dec!(0.35),
                quote_refresh_interval_ms: 250,
                enabled: true,
                hedging_enabled: false,
                hedge_threshold: dec!(4.5),
                hedge_exchange: "Bybit".to_string(),
            }],
        };

        EngineState {
            config,
            pairs,
            exchange_connected: true,
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

    #[test]
    fn simulate_exchange_health_returns_one_entry_per_exchange() {
        let state = test_engine_state("BTC/USDT", dec!(62000));
        let mut rng = rand::rng();

        let health = state.simulate_exchange_health("BTC/USDT", &mut rng);
        assert_eq!(health.len(), EXCHANGES.len());

        let exchange_names: Vec<&str> = health.iter().map(|h| h.exchange.as_str()).collect();
        for expected in EXCHANGES {
            assert!(exchange_names.contains(&expected));
        }
    }

    #[test]
    fn simulate_exchange_health_uses_pair_name() {
        let state = test_engine_state("BTC/USDT", dec!(62000));
        let mut rng = rand::rng();

        let health = state.simulate_exchange_health("SOL/USDT", &mut rng);
        for h in &health {
            assert_eq!(h.pair, "SOL/USDT");
        }
    }

    #[test]
    fn simulate_exchange_health_connected_has_lower_staleness() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        state.exchange_connected = true;
        let mut rng = rand::rng();

        // Connected: staleness range 50..1200 / 10 = 5.0..120.0
        let health = state.simulate_exchange_health("BTC/USDT", &mut rng);
        for h in &health {
            assert!(h.feed_staleness_ms >= dec!(5));
            assert!(h.feed_staleness_ms < dec!(120));
        }
    }

    #[test]
    fn simulate_exchange_health_disconnected_has_higher_staleness() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        state.exchange_connected = false;
        let mut rng = rand::rng();

        // Disconnected: staleness range 1800..5000 / 10 = 180.0..500.0
        let health = state.simulate_exchange_health("BTC/USDT", &mut rng);
        for h in &health {
            assert!(h.feed_staleness_ms >= dec!(180));
            assert!(h.feed_staleness_ms < dec!(500));
        }
    }
}
