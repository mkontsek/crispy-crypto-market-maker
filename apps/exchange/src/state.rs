use std::collections::HashMap;

use rand::{rng, RngExt};
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

use crate::models::{
    default_pairs, MarketDataPayload, OrderRequest, OrderResponse, PairMarketData,
};
use crate::utils::{apply_bps, chrono_string};

pub struct PairMarket {
    pub mid: Decimal,
    pub bid: Decimal,
    pub ask: Decimal,
    pub spread_bps: Decimal,
    pub volatility: Decimal,
}

impl PairMarket {
    pub fn new(mid: Decimal) -> Self {
        Self {
            mid,
            bid: apply_bps(mid, -3),
            ask: apply_bps(mid, 3),
            spread_bps: dec!(6),
            volatility: Decimal::ONE,
        }
    }
}

pub struct ExchangeState {
    pub pairs: HashMap<String, PairMarket>,
    pub fake: bool,
}

impl ExchangeState {
    pub fn new() -> Self {
        let mut pairs = HashMap::new();
        for (pair, initial_price) in default_pairs() {
            pairs.insert(pair.to_string(), PairMarket::new(initial_price));
        }
        Self { pairs, fake: true }
    }

    pub fn tick(&mut self) -> MarketDataPayload {
        let mut rng = rng();
        let now = chrono_string();
        let mut pair_data = Vec::new();

        for (pair_name, market) in &mut self.pairs {
            // Random walk price simulation (only in fake mode; a real exchange would
            // derive mid from the actual order book)
            if self.fake {
                market.volatility = Decimal::from(rng.random_range(600..1600)) / dec!(1000);
                market.mid = apply_bps(market.mid, rng.random_range(-8..=8));
            }

            let spread_abs = market.mid * market.spread_bps / dec!(10_000) / dec!(2);
            market.bid = market.mid - spread_abs;
            market.ask = market.mid + spread_abs;

            pair_data.push(PairMarketData {
                pair: pair_name.clone(),
                mid: market.mid,
                bid: market.bid,
                ask: market.ask,
                spread_bps: market.spread_bps,
                volatility: market.volatility,
            });
        }

        MarketDataPayload {
            timestamp: now,
            fake: self.fake,
            pairs: pair_data,
        }
    }

    /// Attempt to match an incoming order. Returns a fill result.
    /// In fake mode, fills are probability-based. In real mode this would
    /// forward the order to the upstream exchange and return its response.
    pub fn place_order(&self, req: &OrderRequest) -> OrderResponse {
        let mut rng = rng();

        let volatility = self
            .pairs
            .get(&req.pair)
            .map_or(Decimal::ONE, |m| m.volatility);

        let fill_probability = ((dec!(0.16) + volatility / dec!(15)).clamp(dec!(0.12), dec!(0.35))
            * dec!(10_000))
        .round()
        .to_u32()
        .expect("fill probability out of range");
        let filled = self.fake && rng.random_ratio(fill_probability, 10_000);
        let adverse_selection = filled && rng.random_ratio(32, 100);

        OrderResponse {
            pair: req.pair.clone(),
            side: req.side.clone(),
            filled,
            fill_price: req.price,
            fill_size: req.size,
            adverse_selection,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::OrderRequest;
    use rust_decimal_macros::dec;

    #[test]
    fn pair_market_new_has_bid_below_mid_and_ask_above() {
        let market = PairMarket::new(dec!(1000));
        assert_eq!(market.mid, dec!(1000));
        assert!(market.bid < market.mid, "bid should be below mid");
        assert!(market.ask > market.mid, "ask should be above mid");
    }

    #[test]
    fn exchange_state_new_has_three_pairs_and_fake_flag() {
        let state = ExchangeState::new();
        assert_eq!(state.pairs.len(), 3);
        assert!(state.pairs.contains_key("BTC/USDT"));
        assert!(state.pairs.contains_key("ETH/USDT"));
        assert!(state.pairs.contains_key("SOL/USDT"));
        assert!(state.fake, "exchange should be in fake mode by default");
    }

    #[test]
    fn place_order_echoes_pair_side_price_and_size() {
        let state = ExchangeState::new();
        let req = OrderRequest {
            pair: "BTC/USDT".to_string(),
            side: "buy".to_string(),
            price: dec!(62000),
            size: dec!(0.5),
        };
        let resp = state.place_order(&req);
        assert_eq!(resp.pair, "BTC/USDT");
        assert_eq!(resp.side, "buy");
        assert_eq!(resp.fill_price, dec!(62000));
        assert_eq!(resp.fill_size, dec!(0.5));
    }

    #[test]
    fn place_order_adverse_selection_only_when_filled() {
        let state = ExchangeState::new();
        let req = OrderRequest {
            pair: "BTC/USDT".to_string(),
            side: "sell".to_string(),
            price: dec!(62100),
            size: dec!(1),
        };
        // Run multiple times to cover random paths; the invariant must always hold.
        for _ in 0..200 {
            let resp = state.place_order(&req);
            if resp.adverse_selection {
                assert!(
                    resp.filled,
                    "adverse_selection implies the order was filled"
                );
            }
        }
    }

    #[test]
    fn tick_returns_payload_with_all_pairs() {
        let mut state = ExchangeState::new();
        let payload = state.tick();
        assert_eq!(payload.pairs.len(), 3);
        assert!(payload.fake);
        assert!(!payload.timestamp.is_empty());
    }
}
