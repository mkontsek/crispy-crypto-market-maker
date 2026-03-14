use rust_decimal::Decimal;
use rust_decimal_macros::dec;

#[derive(Clone)]
pub struct PairState {
    pub mid: Decimal,
    pub bid: Decimal,
    pub ask: Decimal,
    pub spread_bps: Decimal,
    pub inventory: Decimal,
    pub inventory_skew: Decimal,
    pub quote_refresh_rate: Decimal,
    pub volatility: Decimal,
    pub paused: bool,
}

impl PairState {
    pub fn new(mid: Decimal) -> Self {
        Self {
            mid,
            bid: mid,
            ask: mid,
            spread_bps: dec!(10),
            inventory: Decimal::ZERO,
            inventory_skew: Decimal::ZERO,
            quote_refresh_rate: dec!(4),
            volatility: Decimal::ONE,
            paused: false,
        }
    }
}