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

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    #[test]
    fn apply_ratio_scales_value() {
        assert_eq!(apply_ratio(dec!(100), 1, 2), dec!(50));
        assert_eq!(apply_ratio(dec!(100), 3, 4), dec!(75));
        assert_eq!(apply_ratio(dec!(0), 5, 6), dec!(0));
    }

    #[test]
    fn quote_notional_multiplies_price_and_size() {
        assert_eq!(quote_notional(dec!(100), dec!(2)), dec!(200));
        assert_eq!(quote_notional(dec!(62000), dec!(0.5)), dec!(31000.0));
    }

    #[test]
    fn quote_notional_rate_applies_rate() {
        assert_eq!(quote_notional_rate(dec!(100), dec!(1), 1, 100), dec!(1));
        assert_eq!(quote_notional_rate(dec!(100), dec!(2), 5, 10), dec!(100));
    }

    #[test]
    fn normalize_inventory_clamps_to_range() {
        assert_eq!(normalize_inventory(dec!(3), dec!(6)), dec!(0.5));
        assert_eq!(normalize_inventory(dec!(-3), dec!(6)), dec!(-0.5));
        assert_eq!(normalize_inventory(dec!(12), dec!(6)), dec!(1.5));
        assert_eq!(normalize_inventory(dec!(-12), dec!(6)), dec!(-1.5));
    }

    #[test]
    fn normalize_inventory_zero_max_returns_zero() {
        assert_eq!(normalize_inventory(dec!(5), dec!(0)), dec!(0));
    }

    #[test]
    fn chrono_string_is_non_empty_and_numeric() {
        let ts = chrono_string();
        assert!(!ts.is_empty());
        assert!(ts.parse::<u128>().is_ok(), "timestamp is not numeric: {ts}");
    }
}
