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
