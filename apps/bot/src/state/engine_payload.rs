use crispy_shared::unix_ms;
use rust_decimal::Decimal;

use super::EngineState;
use crate::models::{
    EngineStreamPayload, ExchangeOrderResponse, PnLSnapshot,
};

impl EngineState {
    /// Process fill responses from the exchange and build the stream payload.
    pub fn build_payload(
        &mut self,
        exchange_fills: Vec<ExchangeOrderResponse>,
    ) -> EngineStreamPayload {
        let mut rng = rand::rng();
        let now = unix_ms();

        let fills = self.process_exchange_fills(exchange_fills, now);

        let pair_configs = self.config.pairs.clone();
        let (quotes, inventory, exchange_health) =
            self.update_quotes_and_inventory(&pair_configs, now, &mut rng);

        let fill_rate = if self.total_quotes == 0 {
            Decimal::ZERO
        } else {
            Decimal::from(self.total_fills) / Decimal::from(self.total_quotes)
        };

        let adverse_selection_rate = if self.total_fills == 0 {
            Decimal::ZERO
        } else {
            Decimal::from(self.adverse_fills) / Decimal::from(self.total_fills)
        };

        let pnl = PnLSnapshot {
            timestamp: now,
            total_pnl: self.total_realized_spread - self.hedging_costs,
            realized_spread: self.total_realized_spread,
            hedging_costs: self.hedging_costs,
            adverse_selection_rate,
            fill_rate,
        };

        EngineStreamPayload {
            timestamp: now,
            quotes,
            fills,
            inventory,
            pnl,
            exchange_health,
            config: self.config.clone(),
            kill_switch_engaged: self.kill_switch_engaged,
            strategy: self.active_strategy.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use rust_decimal::Decimal;
    use rust_decimal_macros::dec;

    use crate::models::{ExchangeOrderResponse, MMConfig, PairConfig, StrategyPreset};
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

    fn make_fill_response(pair: &str, side: crate::models::OrderSide, price: Decimal, size: Decimal) -> ExchangeOrderResponse {
        ExchangeOrderResponse {
            pair: pair.to_string(),
            side,
            filled: true,
            fill_price: price,
            fill_size: size,
            adverse_selection: false,
        }
    }

    // ── build_payload (integration) ─────────────────────────────────────

    #[test]
    fn build_payload_no_fills_returns_empty_fills() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        let payload = state.build_payload(vec![]);

        assert!(payload.fills.is_empty());
        assert_eq!(payload.quotes.len(), 1);
        assert_eq!(payload.inventory.len(), 1);
        assert!(!payload.kill_switch_engaged);
        assert_eq!(payload.strategy, StrategyPreset::Balanced);
    }

    #[test]
    fn build_payload_with_fills_populates_pnl() {
        let mut state = test_engine_state("BTC/USDT", dec!(100));
        state.total_quotes = 10;
        let resp = make_fill_response("BTC/USDT", crate::models::OrderSide::Sell, dec!(105), dec!(2));

        let payload = state.build_payload(vec![resp]);

        assert_eq!(payload.fills.len(), 1);
        // realized_spread = (105 - 100) * 2 = 10
        assert_eq!(payload.pnl.realized_spread, dec!(10));
        assert_eq!(payload.pnl.total_pnl, dec!(10));
        // fill_rate = 1 fill / 10 quotes = 0.1
        assert_eq!(payload.pnl.fill_rate, dec!(0.1));
        // no adverse fills
        assert_eq!(payload.pnl.adverse_selection_rate, dec!(0));
    }

    #[test]
    fn build_payload_adverse_fills_tracked_in_pnl() {
        let mut state = test_engine_state("BTC/USDT", dec!(100));
        state.total_quotes = 4;

        let mut r1 = make_fill_response("BTC/USDT", crate::models::OrderSide::Sell, dec!(101), dec!(1));
        r1.adverse_selection = true;
        let r2 = make_fill_response("BTC/USDT", crate::models::OrderSide::Sell, dec!(102), dec!(1));

        let payload = state.build_payload(vec![r1, r2]);

        assert_eq!(payload.fills.len(), 2);
        // 1 adverse out of 2 total fills = 0.5
        assert_eq!(payload.pnl.adverse_selection_rate, dec!(0.5));
        // fill_rate = 2/4 = 0.5
        assert_eq!(payload.pnl.fill_rate, dec!(0.5));
    }

    #[test]
    fn build_payload_includes_config_and_strategy() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        state.active_strategy = StrategyPreset::Aggressive;

        let payload = state.build_payload(vec![]);

        assert_eq!(payload.strategy, StrategyPreset::Aggressive);
        assert_eq!(payload.config.pairs.len(), 1);
        assert_eq!(payload.config.pairs[0].pair, "BTC/USDT");
    }

    #[test]
    fn build_payload_kill_switch_propagated() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        state.kill_switch_engaged = true;

        let payload = state.build_payload(vec![]);
        assert!(payload.kill_switch_engaged);
    }

    #[test]
    fn build_payload_zero_quotes_yields_zero_fill_rate() {
        let mut state = test_engine_state("BTC/USDT", dec!(100));
        assert_eq!(state.total_quotes, 0);

        let resp = make_fill_response("BTC/USDT", crate::models::OrderSide::Sell, dec!(101), dec!(1));
        let payload = state.build_payload(vec![resp]);

        // Avoid division by zero: fill_rate should be 0
        assert_eq!(payload.pnl.fill_rate, dec!(0));
    }
}
