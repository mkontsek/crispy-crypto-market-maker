use axum::{
    extract::State,
    Json,
};
use rust_decimal_macros::dec;

use crate::{
    models::MMConfig,
    state::{AppState, PairState},
};

pub async fn update_config(
    State(app_state): State<AppState>,
    Json(payload): Json<MMConfig>,
) -> Json<MMConfig> {
    let mut state = app_state.state.write().await;
    let pairs = payload.pairs.clone();
    state.config = payload.clone();
    for cfg in pairs {
        state
            .pairs
            .entry(cfg.pair.clone())
            .or_insert_with(|| PairState::new(dec!(1000)));
        if let Some(pair_state) = state.pairs.get_mut(&cfg.pair) {
            pair_state.paused = !cfg.enabled;
        }
    }
    Json(payload)
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use tokio::sync::{broadcast, RwLock};

    use crate::state::{AppState, EngineState};

    use super::update_config;

    fn test_app_state() -> AppState {
        let (stream_tx, _) = broadcast::channel(8);
        AppState {
            state: Arc::new(RwLock::new(EngineState::new())),
            stream_tx,
            exchange_api_url: "http://127.0.0.1:8083".to_string(),
        }
    }

    #[tokio::test]
    async fn update_config_creates_pair_state_and_stores_config() {
        let app_state = test_app_state();
        let config: crate::models::MMConfig = serde_json::from_value(serde_json::json!({
            "pairs": [{
                "pair": "TESTPAIR",
                "baseSpreadBps": "10",
                "volatilityMultiplier": "1.15",
                "maxInventory": "6",
                "inventorySkewSensitivity": "0.35",
                "quoteRefreshIntervalMs": 250,
                "enabled": false,
                "hedgingEnabled": true,
                "hedgeThreshold": "4.5",
                "hedgeExchange": "Bybit"
            }]
        }))
        .unwrap();

        let axum::Json(payload) =
            update_config(axum::extract::State(app_state.clone()), axum::Json(config)).await;

        assert_eq!(payload.pairs[0].pair, "TESTPAIR");
        let state = app_state.state.read().await;
        let pair_state = state.pairs.get("TESTPAIR").expect("TESTPAIR should exist");
        assert!(pair_state.paused);
        assert_eq!(state.config.pairs.len(), 1);
    }

    #[tokio::test]
    async fn update_config_unpauses_pair_when_enabled() {
        let app_state = test_app_state();
        let config: crate::models::MMConfig = serde_json::from_value(serde_json::json!({
            "pairs": [{
                "pair": "ETH/USDT",
                "baseSpreadBps": "5",
                "volatilityMultiplier": "1.0",
                "maxInventory": "10",
                "inventorySkewSensitivity": "0.5",
                "quoteRefreshIntervalMs": 500,
                "enabled": true,
                "hedgingEnabled": false,
                "hedgeThreshold": "2.0",
                "hedgeExchange": "Bybit"
            }]
        }))
        .unwrap();

        let _ = update_config(axum::extract::State(app_state.clone()), axum::Json(config)).await;

        let state = app_state.state.read().await;
        let pair_state = state.pairs.get("ETH/USDT").expect("ETH/USDT should exist");
        assert!(!pair_state.paused);
    }
}
