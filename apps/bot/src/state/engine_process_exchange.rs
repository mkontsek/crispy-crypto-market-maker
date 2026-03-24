use super::EngineState;
use crate::models::{ExchangeOrderResponse, Fill};
use crate::utils::quote_notional;
use uuid::Uuid;

impl EngineState {
    pub(super) fn process_exchange_fills(
        &mut self,
        exchange_fills: Vec<ExchangeOrderResponse>,
        now: &str,
    ) -> Vec<Fill> {
        let mut fills = Vec::new();

        for fill_resp in exchange_fills {
            if !fill_resp.filled {
                continue;
            }
            let Some(pair) = self.pairs.get_mut(&fill_resp.pair) else {
                continue;
            };

            let taker_buy = fill_resp.side == "sell";
            let fill_price = fill_resp.fill_price;
            let fill_size = fill_resp.fill_size;
            let realized_spread = if taker_buy {
                fill_price - pair.mid
            } else {
                pair.mid - fill_price
            };

            if taker_buy {
                pair.inventory -= fill_size;
            } else {
                pair.inventory += fill_size;
            }

            if fill_resp.adverse_selection {
                self.adverse_fills = self.adverse_fills.saturating_add(1);
            }

            self.fill_seq = self.fill_seq.saturating_add(1);
            self.total_fills = self.total_fills.saturating_add(1);
            self.total_realized_spread += quote_notional(realized_spread, fill_size);

            fills.push(Fill {
                id: Uuid::new_v4().to_string(),
                pair: fill_resp.pair.clone(),
                side: if taker_buy { "sell" } else { "buy" }.to_string(),
                price: fill_price,
                size: fill_size,
                mid: pair.mid,
                realized_spread,
                adverse_selection: fill_resp.adverse_selection,
                timestamp: now.to_string(),
            });
        }

        fills
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use rust_decimal::Decimal;
    use rust_decimal_macros::dec;

    use crate::models::{ExchangeOrderResponse, MMConfig, PairConfig, StrategyPreset};
    use crate::state::{EngineState, PairState};

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

    fn make_fill_response(
        pair: &str,
        side: &str,
        price: Decimal,
        size: Decimal,
    ) -> ExchangeOrderResponse {
        ExchangeOrderResponse {
            pair: pair.to_string(),
            side: side.to_string(),
            filled: true,
            fill_price: price,
            fill_size: size,
            adverse_selection: false,
        }
    }

    #[test]
    fn process_fills_skips_unfilled_responses() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        let unfilled = ExchangeOrderResponse {
            pair: "BTC/USDT".to_string(),
            side: "sell".to_string(),
            filled: false,
            fill_price: dec!(62010),
            fill_size: dec!(0.1),
            adverse_selection: false,
        };

        let fills = state.process_exchange_fills(vec![unfilled], "t0");
        assert!(fills.is_empty());
        assert_eq!(state.total_fills, 0);
    }

    #[test]
    fn process_fills_skips_unknown_pair() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        let resp = make_fill_response("UNKNOWN/PAIR", "sell", dec!(100), dec!(1));

        let fills = state.process_exchange_fills(vec![resp], "t0");
        assert!(fills.is_empty());
        assert_eq!(state.total_fills, 0);
    }

    #[test]
    fn process_fills_sell_side_reduces_inventory() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        let resp = make_fill_response("BTC/USDT", "sell", dec!(62010), dec!(0.5));

        let fills = state.process_exchange_fills(vec![resp], "t1");

        assert_eq!(fills.len(), 1);
        assert_eq!(fills[0].side, "sell");
        assert_eq!(fills[0].price, dec!(62010));
        assert_eq!(fills[0].size, dec!(0.5));
        assert_eq!(state.pairs["BTC/USDT"].inventory, dec!(-0.5));
        assert_eq!(state.total_fills, 1);
        assert_eq!(state.fill_seq, 1);
        assert!(!fills[0].id.is_empty());
    }

    #[test]
    fn process_fills_buy_side_increases_inventory() {
        let mut state = test_engine_state("ETH/USDT", dec!(3450));
        let resp = make_fill_response("ETH/USDT", "buy", dec!(3440), dec!(2));

        let fills = state.process_exchange_fills(vec![resp], "t2");

        assert_eq!(fills.len(), 1);
        assert_eq!(fills[0].side, "buy");
        assert_eq!(state.pairs["ETH/USDT"].inventory, dec!(2));
    }

    #[test]
    fn process_fills_realized_spread_computed_correctly() {
        let mid = dec!(100);
        let mut state = test_engine_state("BTC/USDT", mid);

        let sell_resp = make_fill_response("BTC/USDT", "sell", dec!(102), dec!(1));
        let fills = state.process_exchange_fills(vec![sell_resp], "t3");
        assert_eq!(fills[0].realized_spread, dec!(2));

        state.pairs.get_mut("BTC/USDT").unwrap().inventory = Decimal::ZERO;

        let buy_resp = make_fill_response("BTC/USDT", "buy", dec!(98), dec!(1));
        let fills = state.process_exchange_fills(vec![buy_resp], "t4");
        assert_eq!(fills[0].realized_spread, dec!(2));
    }

    #[test]
    fn process_fills_tracks_adverse_selection() {
        let mut state = test_engine_state("BTC/USDT", dec!(62000));
        let mut resp = make_fill_response("BTC/USDT", "sell", dec!(62010), dec!(0.1));
        resp.adverse_selection = true;

        state.process_exchange_fills(vec![resp], "t5");
        assert_eq!(state.adverse_fills, 1);
    }

    #[test]
    fn process_fills_accumulates_total_realized_spread() {
        let mut state = test_engine_state("BTC/USDT", dec!(100));

        let r1 = make_fill_response("BTC/USDT", "sell", dec!(102), dec!(1));
        let r2 = make_fill_response("BTC/USDT", "sell", dec!(105), dec!(2));

        state.process_exchange_fills(vec![r1, r2], "t6");
        assert_eq!(state.total_realized_spread, dec!(12));
        assert_eq!(state.total_fills, 2);
        assert_eq!(state.fill_seq, 2);
    }

    #[test]
    fn process_fills_multiple_fills_have_sequential_ids() {
        let mut state = test_engine_state("BTC/USDT", dec!(100));
        let r1 = make_fill_response("BTC/USDT", "sell", dec!(101), dec!(1));
        let r2 = make_fill_response("BTC/USDT", "buy", dec!(99), dec!(1));

        let fills = state.process_exchange_fills(vec![r1, r2], "t7");
        assert_ne!(fills[0].id, fills[1].id);
        assert!(!fills[0].id.is_empty());
        assert!(!fills[1].id.is_empty());
    }
}
