use axum::extract::State;
use axum::Json;
use crate::state::AppState;

pub async fn health(State(app_state): State<AppState>) -> Json<serde_json::Value> {
    let state = app_state.state.read().await;
    Json(serde_json::json!({
        "status": "ok",
        "exchangeConnected": state.exchange_connected,
        "trackedPairs": state.pairs.len(),
        "fills": state.total_fills,
        "quotes": state.total_quotes,
    }))
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use tokio::sync::{broadcast, RwLock};

    use crate::state::{AppState, EngineState, PairState};

    use super::health;

    fn test_app_state() -> AppState {
        let (stream_tx, _) = broadcast::channel(8);
        AppState {
            state: Arc::new(RwLock::new(EngineState::new())),
            stream_tx,
            exchange_api_url: "http://127.0.0.1:8083".to_string(),
        }
    }

    #[tokio::test]
    async fn health_returns_default_engine_snapshot() {
        let app_state = test_app_state();

        let axum::Json(payload) = health(axum::extract::State(app_state)).await;

        assert_eq!(payload["status"].as_str(), Some("ok"));
        assert_eq!(payload["exchangeConnected"].as_bool(), Some(false));
        assert_eq!(payload["trackedPairs"].as_u64(), Some(3));
        assert_eq!(payload["fills"].as_u64(), Some(0));
        assert_eq!(payload["quotes"].as_u64(), Some(0));
    }

    #[tokio::test]
    async fn health_returns_updated_counters_and_connectivity() {
        let app_state = test_app_state();
        {
            let mut state = app_state.state.write().await;
            state.exchange_connected = true;
            state.total_fills = 7;
            state.total_quotes = 19;
            state.pairs.clear();
            state
                .pairs
                .insert("TEST/USDT".to_string(), PairState::new(rust_decimal_macros::dec!(100)));
        }

        let axum::Json(payload) = health(axum::extract::State(app_state)).await;

        assert_eq!(payload["status"].as_str(), Some("ok"));
        assert_eq!(payload["exchangeConnected"].as_bool(), Some(true));
        assert_eq!(payload["trackedPairs"].as_u64(), Some(1));
        assert_eq!(payload["fills"].as_u64(), Some(7));
        assert_eq!(payload["quotes"].as_u64(), Some(19));
    }
}
