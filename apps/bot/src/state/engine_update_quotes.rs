use rand::RngExt;
use tracing::error;

use super::EngineState;
use crate::models::{ExchangeHealth, InventorySnapshot, PairConfig, QuoteSnapshot};
use crate::utils::{apply_ratio, normalize_inventory, quote_notional_rate};

impl EngineState {
    /// Update quotes and inventory snapshots, and simulate exchange health metrics.
    pub(super) fn update_quotes_and_inventory(
        &mut self,
        pair_configs: &[PairConfig],
        now: u64,
        rng: &mut impl RngExt,
    ) -> (Vec<QuoteSnapshot>, Vec<InventorySnapshot>, Vec<ExchangeHealth>) {
        let mut quotes = Vec::new();
        let mut inventory = Vec::new();
        let mut exchange_health = Vec::new();

        for cfg in pair_configs {
            let Some(pair) = self.pairs.get_mut(&cfg.pair) else {
                continue;
            };

            if !cfg.enabled {
                pair.paused = true;
            }

            if pair.paused {
                quotes.push(QuoteSnapshot {
                    pair: cfg.pair.clone(),
                    bid: pair.bid,
                    ask: pair.ask,
                    mid: pair.mid,
                    spread_bps: pair.spread_bps,
                    inventory_skew: pair.inventory_skew,
                    quote_refresh_rate: pair.quote_refresh_rate,
                    volatility: pair.volatility,
                    paused: true,
                    updated_at: now,
                });
                inventory.push(InventorySnapshot {
                    pair: cfg.pair.clone(),
                    inventory: pair.inventory,
                    normalized_skew: normalize_inventory(pair.inventory, cfg.max_inventory),
                    timestamp: now,
                });
                continue;
            }

            if pair.inventory.abs() > cfg.max_inventory {
                pair.paused = true;
                error!("inventory limit breached for {}", cfg.pair);
            }

            if cfg.hedging_enabled && pair.inventory.abs() > cfg.hedge_threshold {
                let hedging_cost = quote_notional_rate(pair.mid, pair.inventory.abs(), 1, 10_000);
                self.hedging_costs += hedging_cost;
                pair.inventory = apply_ratio(pair.inventory, 55, 100);
            }

            quotes.push(QuoteSnapshot {
                pair: cfg.pair.clone(),
                bid: pair.bid,
                ask: pair.ask,
                mid: pair.mid,
                spread_bps: pair.spread_bps,
                inventory_skew: pair.inventory_skew,
                quote_refresh_rate: pair.quote_refresh_rate,
                volatility: pair.volatility,
                paused: pair.paused,
                updated_at: now,
            });

            inventory.push(InventorySnapshot {
                pair: cfg.pair.clone(),
                inventory: pair.inventory,
                normalized_skew: normalize_inventory(pair.inventory, cfg.max_inventory),
                timestamp: now,
            });

            exchange_health.extend(self.simulate_exchange_health(&cfg.pair, rng));
        }

        (quotes, inventory, exchange_health)
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use rust_decimal::Decimal;
    use rust_decimal_macros::dec;

    use crate::models::{MMConfig, PairConfig, StrategyPreset};
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

    // ── update_quotes_and_inventory ─────────────────────────────────────

    #[test]
    fn update_quotes_produces_snapshot_for_active_pair() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        let configs = state.config.pairs.clone();
        let mut rng = rand::rng();
        let expected_exchange_count = crate::models::EXCHANGES.len();

        let (quotes, inventory, health) =
            state.update_quotes_and_inventory(&configs, 0, &mut rng);

        assert_eq!(quotes.len(), 1);
        assert_eq!(quotes[0].pair, "BTC/USDT");
        assert!(!quotes[0].paused);

        assert_eq!(inventory.len(), 1);
        assert_eq!(inventory[0].pair, "BTC/USDT");

        assert_eq!(health.len(), expected_exchange_count);
    }

    #[test]
    fn update_quotes_paused_pair_skips_health_and_marks_paused() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        state
            .pairs
            .get_mut("BTC/USDT")
            .expect("BTC/USDT pair should exist")
            .paused = true;
        let configs = state.config.pairs.clone();
        let mut rng = rand::rng();

        let (quotes, inventory, health) =
            state.update_quotes_and_inventory(&configs, 0, &mut rng);

        assert_eq!(quotes.len(), 1);
        assert!(quotes[0].paused);
        assert_eq!(inventory.len(), 1);
        // Paused pairs don't generate exchange health entries
        assert!(health.is_empty());
    }

    #[test]
    fn update_quotes_disabled_config_pauses_pair() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        state.config.pairs[0].enabled = false;
        let configs = state.config.pairs.clone();
        let mut rng = rand::rng();

        let (quotes, _, _) = state.update_quotes_and_inventory(&configs, 0, &mut rng);

        assert!(quotes[0].paused);
        assert!(state.pairs["BTC/USDT"].paused);
    }

    #[test]
    fn update_quotes_inventory_breach_pauses_pair() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        // max_inventory is 6; set inventory to 7 to breach
        state
            .pairs
            .get_mut("BTC/USDT")
            .expect("BTC/USDT pair should exist")
            .inventory = dec!(7);
        let configs = state.config.pairs.clone();
        let mut rng = rand::rng();

        let (quotes, _, _) = state.update_quotes_and_inventory(&configs, 0, &mut rng);

        assert!(state.pairs["BTC/USDT"].paused);
        assert!(quotes[0].paused);
    }

    #[test]
    fn update_quotes_hedging_reduces_inventory_and_adds_cost() {
        let mut state = test_engine_state("BTC/USDT", dec!(100));
        state.config.pairs[0].hedging_enabled = true;
        state.config.pairs[0].hedge_threshold = dec!(2);
        // Inventory exceeds hedge threshold but not max_inventory
        state
            .pairs
            .get_mut("BTC/USDT")
            .expect("BTC/USDT pair should exist")
            .inventory = dec!(3);
        let configs = state.config.pairs.clone();
        let mut rng = rand::rng();

        let old_hedging_costs = state.hedging_costs;
        state.update_quotes_and_inventory(&configs, 0, &mut rng);

        // Hedging cost should have increased
        assert!(state.hedging_costs > old_hedging_costs);
        // Inventory reduced to 55% of 3 = 1.65
        assert_eq!(state.pairs["BTC/USDT"].inventory, dec!(1.65));
    }

    #[test]
    fn update_quotes_skips_unknown_pair_in_config() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        // Add a config entry for a pair that doesn't exist in state.pairs
        state.config.pairs.push(PairConfig {
            pair: "DOGE/USDT".to_string(),
            base_spread_bps: dec!(10),
            volatility_multiplier: dec!(1),
            max_inventory: dec!(6),
            inventory_skew_sensitivity: dec!(0.35),
            quote_refresh_interval_ms: 250,
            enabled: true,
            hedging_enabled: false,
            hedge_threshold: dec!(4.5),
            hedge_exchange: "Bybit".to_string(),
        });
        let configs = state.config.pairs.clone();
        let mut rng = rand::rng();

        let (quotes, inventory, _) = state.update_quotes_and_inventory(&configs, 0, &mut rng);

        // Only the existing BTC/USDT pair produces snapshots
        assert_eq!(quotes.len(), 1);
        assert_eq!(inventory.len(), 1);
    }
}
