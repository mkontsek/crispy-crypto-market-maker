use std::collections::HashMap;

use rand::{Rng, thread_rng};

use crate::models::{MarketDataPayload, OrderRequest, OrderResponse, PAIRS, PairMarketData};
use crate::utils::{apply_bps, chrono_string, to_price_fp};

pub struct PairMarket {
    pub mid: i64,
    pub bid: i64,
    pub ask: i64,
    pub spread_bps: f64,
    pub volatility: f64,
}

impl PairMarket {
    pub fn new(mid: f64) -> Self {
        let mid_fp = to_price_fp(mid);
        Self {
            mid: mid_fp,
            bid: apply_bps(mid_fp, -3),
            ask: apply_bps(mid_fp, 3),
            spread_bps: 6.0,
            volatility: 1.0,
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
        for (pair, initial_price) in PAIRS {
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
                market.volatility = rng.gen_range(0.6..1.6);
                market.mid = apply_bps(market.mid, rng.gen_range(-8..=8));
            }

            let spread_abs = (market.mid as f64 * market.spread_bps / 10_000.0 / 2.0) as i64;
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
        let mut rng = thread_rng();

        let volatility = self
            .pairs
            .get(&req.pair)
            .map(|m| m.volatility)
            .unwrap_or(1.0);

        let fill_probability = (0.16 + volatility / 15.0).clamp(0.12, 0.35);
        let filled = self.fake && rng.gen_bool(fill_probability);
        let adverse_selection = filled && rng.gen_bool(0.32);

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
