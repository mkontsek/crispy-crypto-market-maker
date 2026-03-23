use rust_decimal::Decimal;

use crate::models::StrategyPreset;

use super::EngineState;

impl EngineState {
    /// Resets all accumulated session state back to startup defaults.
    /// Clears per-pair inventory, all stat counters, disengages the kill switch,
    /// and restores the balanced strategy preset.
    pub fn reset_session(&mut self) {
        for pair in self.pairs.values_mut() {
            pair.inventory = Decimal::ZERO;
            pair.inventory_skew = Decimal::ZERO;
        }
        self.total_realized_spread = Decimal::ZERO;
        self.hedging_costs = Decimal::ZERO;
        self.total_quotes = 0;
        self.total_fills = 0;
        self.adverse_fills = 0;
        self.fill_seq = 0;
        self.kill_switch_engaged = false;
        // apply_strategy_preset also restores each pair's paused state based on the config.
        self.apply_strategy_preset(StrategyPreset::Balanced);
    }
}

#[cfg(test)]
mod tests {
    use rust_decimal::Decimal;
    use rust_decimal_macros::dec;

    use crate::{models::StrategyPreset, state::EngineState};

    #[test]
    fn reset_session_clears_inventory_and_stats() {
        let mut state = EngineState::new();
        if let Some(pair) = state.pairs.get_mut("BTC/USDT") {
            pair.inventory = dec!(5);
            pair.inventory_skew = dec!(1.5);
        }
        state.total_realized_spread = dec!(200);
        state.hedging_costs = dec!(10);
        state.total_quotes = 100;
        state.total_fills = 20;
        state.adverse_fills = 3;
        state.fill_seq = 20;
        state.kill_switch_engaged = true;
        state.apply_strategy_preset(StrategyPreset::Aggressive);

        state.reset_session();

        assert_eq!(state.total_realized_spread, Decimal::ZERO);
        assert_eq!(state.hedging_costs, Decimal::ZERO);
        assert_eq!(state.total_quotes, 0);
        assert_eq!(state.total_fills, 0);
        assert_eq!(state.adverse_fills, 0);
        assert_eq!(state.fill_seq, 0);
        assert!(!state.kill_switch_engaged);
        assert_eq!(state.active_strategy, StrategyPreset::Balanced);
        let btc = state.pairs.get("BTC/USDT").unwrap();
        assert_eq!(btc.inventory, Decimal::ZERO);
        assert_eq!(btc.inventory_skew, Decimal::ZERO);
        assert!(!btc.paused);
    }

    #[test]
    fn reset_session_resets_all_pairs() {
        let mut state = EngineState::new();
        for pair in state.pairs.values_mut() {
            pair.inventory = dec!(3);
            pair.inventory_skew = dec!(0.5);
            pair.paused = true;
        }

        state.reset_session();

        for pair in state.pairs.values() {
            assert_eq!(pair.inventory, Decimal::ZERO);
            assert_eq!(pair.inventory_skew, Decimal::ZERO);
            assert!(!pair.paused);
        }
    }
}
