const RATE_DENOM_BPS: i64 = 10_000;

use rust_decimal::Decimal;

pub fn apply_bps(value: Decimal, bps_delta: i64) -> Decimal {
    let multiplier = RATE_DENOM_BPS + bps_delta;
    value * Decimal::from(multiplier) / Decimal::from(RATE_DENOM_BPS)
}

pub fn chrono_string() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    now.to_string()
}
