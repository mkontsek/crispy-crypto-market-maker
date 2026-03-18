use rust_decimal_macros::dec;

use crate::models::{PairConfig, StrategyPreset};

/// Build per-pair configs for a given strategy preset.
pub fn strategy_pair_configs(preset: &StrategyPreset, pairs: &[String]) -> Vec<PairConfig> {
    pairs
        .iter()
        .map(|pair| match preset {
            StrategyPreset::Conservative => PairConfig {
                pair: pair.clone(),
                base_spread_bps: dec!(20),
                volatility_multiplier: dec!(1.5),
                max_inventory: dec!(4),
                inventory_skew_sensitivity: dec!(0.5),
                quote_refresh_interval_ms: 500,
                enabled: true,
                hedging_enabled: true,
                hedge_threshold: dec!(3.0),
                hedge_exchange: "Bybit".to_string(),
            },
            StrategyPreset::Balanced => PairConfig {
                pair: pair.clone(),
                base_spread_bps: dec!(10),
                volatility_multiplier: dec!(1.15),
                max_inventory: dec!(6),
                inventory_skew_sensitivity: dec!(0.35),
                quote_refresh_interval_ms: 250,
                enabled: true,
                hedging_enabled: true,
                hedge_threshold: dec!(4.5),
                hedge_exchange: "Bybit".to_string(),
            },
            StrategyPreset::Aggressive => PairConfig {
                pair: pair.clone(),
                base_spread_bps: dec!(5),
                volatility_multiplier: dec!(0.8),
                max_inventory: dec!(10),
                inventory_skew_sensitivity: dec!(0.2),
                quote_refresh_interval_ms: 100,
                enabled: true,
                hedging_enabled: false,
                hedge_threshold: dec!(6.0),
                hedge_exchange: "Bybit".to_string(),
            },
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn conservative_preset_has_wide_spread_and_hedging() {
        let pairs = vec!["BTC/USDT".to_string()];
        let configs = strategy_pair_configs(&StrategyPreset::Conservative, &pairs);
        assert_eq!(configs.len(), 1);
        assert_eq!(configs[0].base_spread_bps.to_string(), "20");
        assert!(configs[0].hedging_enabled);
    }

    #[test]
    fn aggressive_preset_has_tight_spread_and_no_hedging() {
        let pairs = vec!["ETH/USDT".to_string()];
        let configs = strategy_pair_configs(&StrategyPreset::Aggressive, &pairs);
        assert_eq!(configs.len(), 1);
        assert_eq!(configs[0].base_spread_bps.to_string(), "5");
        assert!(!configs[0].hedging_enabled);
    }

    #[test]
    fn balanced_preset_matches_defaults() {
        let pairs = vec!["SOL/USDT".to_string()];
        let configs = strategy_pair_configs(&StrategyPreset::Balanced, &pairs);
        assert_eq!(configs.len(), 1);
        assert_eq!(configs[0].base_spread_bps.to_string(), "10");
        assert!(configs[0].hedging_enabled);
    }
}
