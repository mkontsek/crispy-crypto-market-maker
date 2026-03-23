use std::{sync::Arc, time::Duration};

use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use tokio::sync::{broadcast, RwLock};

use crate::{exchange::place_exchange_orders, models::ExchangeOrderResponse, state::EngineState};

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

pub async fn bot_tick_once(
    state: Arc<RwLock<EngineState>>,
    stream_tx: broadcast::Sender<String>,
    exchange_api_url: &str,
    http_client: &reqwest::Client,
) {
    // 1. Compute orders to place (requires write lock to update bid/ask).
    let orders = {
        let mut guard = state.write().await;
        guard.compute_orders()
    };

    // 2. Place orders on the exchange (async, no lock held).
    let exchange_fills = place_exchange_orders(http_client, exchange_api_url, orders).await;

    publish_tick_payload(state, stream_tx, exchange_fills).await;
}

async fn publish_tick_payload(
    state: Arc<RwLock<EngineState>>,
    stream_tx: broadcast::Sender<String>,
    exchange_fills: Vec<ExchangeOrderResponse>,
) {
    // 3. Apply fills and build the stream payload (write lock).
    let payload = {
        let mut guard = state.write().await;
        guard.build_payload(exchange_fills)
    };

    if let Ok(serialized) = serde_json::to_string(&payload) {
        let _ = stream_tx.send(serialized);
    }
}

pub fn spawn_bot_tick_loop(
    state: Arc<RwLock<EngineState>>,
    stream_tx: broadcast::Sender<String>,
    exchange_api_url: String,
) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(250));
        let http_client = reqwest::Client::new();

        loop {
            interval.tick().await;
            bot_tick_once(
                state.clone(),
                stream_tx.clone(),
                exchange_api_url.as_str(),
                &http_client,
            )
            .await;
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::EngineState;
    use rust_decimal_macros::dec;
    use tokio::time::{timeout, Duration};

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

    #[tokio::test]
    async fn bot_tick_once_broadcasts_payload() {
        let state = Arc::new(RwLock::new(EngineState::new()));
        {
            let mut guard = state.write().await;
            for cfg in &mut guard.config.pairs {
                cfg.enabled = false;
            }
        }

        let (tx, mut rx) = broadcast::channel(8);
        let client = reqwest::Client::new();

        bot_tick_once(state.clone(), tx.clone(), "http://127.0.0.1:1", &client).await;

        let message = timeout(Duration::from_secs(1), rx.recv())
            .await
            .expect("timed out waiting for broadcast")
            .expect("receiver failed to get payload");
        let parsed: serde_json::Value =
            serde_json::from_str(&message).expect("payload should be valid json");

        let quotes = parsed["quotes"]
            .as_array()
            .expect("quotes should be an array");
        assert_eq!(quotes.len(), 3);
        assert_eq!(parsed["killSwitchEngaged"].as_bool(), Some(false));
    }
}
