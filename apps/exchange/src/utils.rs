pub const PRICE_SCALE: i64 = 10_000;
const RATE_DENOM_BPS: i64 = 10_000;

use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;

pub fn to_price_fp(value: Decimal) -> i64 {
    (value * Decimal::from(PRICE_SCALE))
        .round()
        .to_i64()
        .expect("price conversion overflow")
}

pub fn from_price_fp(value: i64) -> Decimal {
    Decimal::from(value) / Decimal::from(PRICE_SCALE)
}

pub fn apply_bps(value_fp: i64, bps_delta: i64) -> i64 {
    let multiplier = RATE_DENOM_BPS + bps_delta;
    ((value_fp as i128 * multiplier as i128) / RATE_DENOM_BPS as i128) as i64
}

pub fn chrono_string() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    now.to_string()
}
