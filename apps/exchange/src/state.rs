use std::collections::HashMap;

use rand::{thread_rng, Rng};
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

use crate::models::{
    default_pairs, MarketDataPayload, OrderRequest, OrderResponse, PairMarketData,
};
use crate::utils::{apply_bps, chrono_string, from_price_fp, to_price_fp};

pub struct PairMarket {
    pub mid: i64,
    pub bid: i64,
    pub ask: i64,
    pub spread_bps: Decimal,
    pub volatility: Decimal,
}

impl PairMarket {
    pub fn new(mid: Decimal) -> Self {
        let mid_fp = to_price_fp(mid);
        Self {
            mid: mid_fp,
            bid: apply_bps(mid_fp, -3),
            ask: apply_bps(mid_fp, 3),
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
        let mut rng = thread_rng();
        let now = chrono_string();
        let mut pair_data = Vec::new();

        for (pair_name, market) in &mut self.pairs {
            // Random walk price simulation (only in fake mode; a real exchange would
            // derive mid from the actual order book)
            if self.fake {
                market.volatility = Decimal::from(rng.gen_range(600..1600)) / dec!(1000);
                market.mid = apply_bps(market.mid, rng.gen_range(-8..=8));
            }

            let spread_abs =
                to_price_fp(from_price_fp(market.mid) * market.spread_bps / dec!(10_000) / dec!(2));
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
        // Test1
        // Test1
        // Test1// Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1 Clippy too-many-lines-threshold
        // Test1
        // Test1
        // Test1// Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1 Clippy too-many-lines-threshold
        // Test1
        // Test1
        // Test1// Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1 Clippy too-many-lines-threshold
        // Test1
        // Test1
        // Test1// Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1 Clippy too-many-lines-threshold
        // Test1
        // Test1
        // Test1// Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1 Clippy too-many-lines-threshold
        // Test1
        // Test1
        // Test1// Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1
        // Test1 Clippy too-many-lines-threshold
    }

    /// Attempt to match an incoming order. Returns a fill result.
    /// In fake mode, fills are probability-based. In real mode this would
    /// forward the order to the upstream exchange and return its response.
    pub fn place_order(&self, req: &OrderRequest) -> OrderResponse {
        let mut rng = thread_rng();

        let volatility = self
            .pairs
            .get(&req.pair)
            .map(|m| m.volatility)
            .unwrap_or(Decimal::ONE);

        let fill_probability = ((dec!(0.16) + volatility / dec!(15)).clamp(dec!(0.12), dec!(0.35))
            * dec!(10_000))
        .round()
        .to_u32()
        .expect("fill probability out of range");
        let filled = self.fake && rng.gen_ratio(fill_probability, 10_000);
        let adverse_selection = filled && rng.gen_ratio(32, 100);

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
