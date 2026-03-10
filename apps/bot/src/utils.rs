use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

pub const PRICE_SCALE: i64 = 10_000;
pub const SIZE_SCALE: i64 = 1_000_000;

pub fn to_price_fp(value: Decimal) -> i64 {
    (value * Decimal::from(PRICE_SCALE))
        .round()
        .to_i64()
        .expect("price conversion overflow")
}

pub fn from_price_fp(value: i64) -> Decimal {
    Decimal::from(value) / Decimal::from(PRICE_SCALE)
}

pub fn to_size_fp(value: Decimal) -> i64 {
    (value * Decimal::from(SIZE_SCALE))
        .round()
        .to_i64()
        .expect("size conversion overflow")
}

pub fn from_size_fp(value: i64) -> Decimal {
    Decimal::from(value) / Decimal::from(SIZE_SCALE)
}

pub fn apply_ratio(value_fp: i64, numerator: i64, denominator: i64) -> i64 {
    ((value_fp as i128 * numerator as i128) / denominator as i128) as i64
}

pub fn quote_notional_fp(price_fp: i64, size_fp: i64) -> i64 {
    ((price_fp as i128 * size_fp as i128) / SIZE_SCALE as i128) as i64
}

pub fn quote_notional_rate_fp(
    price_fp: i64,
    size_fp: i64,
    numerator: i64,
    denominator: i64,
) -> i64 {
    ((price_fp as i128 * size_fp as i128 * numerator as i128)
        / (SIZE_SCALE as i128 * denominator as i128)) as i64
}

pub fn normalize_inventory(inventory_fp: i64, max_inventory: Decimal) -> Decimal {
    if max_inventory.is_zero() {
        Decimal::ZERO
    } else {
        (from_size_fp(inventory_fp) / max_inventory).clamp(dec!(-1.5), dec!(1.5))
    }
}

pub fn chrono_string() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    now.to_string()
}
