use axum::{extract::State, Json};

use crate::state::AppState;

pub async fn reset_state(State(app_state): State<AppState>) -> Json<serde_json::Value> {
    let mut state = app_state.state.write().await;
    state.reset_session();
    Json(serde_json::json!({ "reset": true }))
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use rust_decimal_macros::dec;
    use tokio::sync::{broadcast, RwLock};

    use crate::{
        models::StrategyPreset,
        state::{AppState, EngineState},
    };

    use super::*;

    fn test_app_state() -> AppState {
        let (stream_tx, _) = broadcast::channel(8);
        AppState {
            state: Arc::new(RwLock::new(EngineState::new())),
            stream_tx,
            exchange_api_url: "http://127.0.0.1:3111".to_string(),
        }
    }

    #[tokio::test]
    async fn reset_state_clears_accumulated_state() {
        let app_state = test_app_state();
        {
            let mut state = app_state.state.write().await;
            if let Some(pair) = state.pairs.get_mut("BTC/USDT") {
                pair.inventory = dec!(5);
            }
            state.total_fills = 10;
            state.kill_switch_engaged = true;
            state.apply_strategy_preset(StrategyPreset::Aggressive);
        }

        let axum::Json(payload) =
            reset_state(axum::extract::State(app_state.clone())).await;

        assert_eq!(payload["reset"].as_bool(), Some(true));
        let state = app_state.state.read().await;
        assert_eq!(state.total_fills, 0);
        assert!(!state.kill_switch_engaged);
        assert_eq!(state.active_strategy, StrategyPreset::Balanced);
        assert_eq!(state.pairs["BTC/USDT"].inventory, dec!(0));
    }
}
