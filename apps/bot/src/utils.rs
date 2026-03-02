pub const PRICE_SCALE: i64 = 10_000;
pub const SIZE_SCALE: i64 = 1_000_000;

pub fn to_price_fp(value: f64) -> i64 {
    (value * PRICE_SCALE as f64).round() as i64
}

pub fn from_price_fp(value: i64) -> f64 {
    value as f64 / PRICE_SCALE as f64
}

pub fn to_size_fp(value: f64) -> i64 {
    (value * SIZE_SCALE as f64).round() as i64
}

pub fn from_size_fp(value: i64) -> f64 {
    value as f64 / SIZE_SCALE as f64
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

pub fn normalize_inventory(inventory_fp: i64, max_inventory: f64) -> f64 {
    if max_inventory == 0.0 {
        0.0
    } else {
        (from_size_fp(inventory_fp) / max_inventory).clamp(-1.5, 1.5)
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
