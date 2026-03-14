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

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    #[test]
    fn apply_bps_increases_value() {
        assert_eq!(apply_bps(dec!(10000), 100), dec!(10100));
    }

    #[test]
    fn apply_bps_decreases_value() {
        assert_eq!(apply_bps(dec!(10000), -100), dec!(9900));
    }

    #[test]
    fn apply_bps_zero_delta_is_identity() {
        assert_eq!(apply_bps(dec!(5000), 0), dec!(5000));
    }

    #[test]
    fn chrono_string_is_non_empty_and_numeric() {
        let ts = chrono_string();
        assert!(!ts.is_empty());
        assert!(ts.parse::<u128>().is_ok(), "timestamp is not numeric: {ts}");
    }
}
