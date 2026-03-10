use rust_decimal::Decimal;
use rust_decimal_macros::dec;

pub fn apply_ratio(value: Decimal, numerator: i64, denominator: i64) -> Decimal {
    value * Decimal::from(numerator) / Decimal::from(denominator)
}

pub fn quote_notional(price: Decimal, size: Decimal) -> Decimal {
    price * size
}

pub fn quote_notional_rate(
    price: Decimal,
    size: Decimal,
    numerator: i64,
    denominator: i64,
) -> Decimal {
    price * size * Decimal::from(numerator) / Decimal::from(denominator)
}

pub fn normalize_inventory(inventory: Decimal, max_inventory: Decimal) -> Decimal {
    if max_inventory.is_zero() {
        Decimal::ZERO
    } else {
        (inventory / max_inventory).clamp(dec!(-1.5), dec!(1.5))
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
