use axum::{
    extract::{Path, State},
    Json,
};

use crate::{models::PauseRequest, state::AppState};

pub async fn pause_pair(
    Path(pair): Path<String>,
    State(app_state): State<AppState>,
    Json(payload): Json<PauseRequest>,
) -> Json<serde_json::Value> {
    let mut state = app_state.state.write().await;
    if let Some(pair_state) = state.pairs.get_mut(&pair) {
        pair_state.paused = payload.paused;
        return Json(serde_json::json!({
            "pair": pair,
            "paused": pair_state.paused,
        }));
    }

    Json(serde_json::json!({
        "error": format!("unknown pair: {pair}"),
    }))
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use rust_decimal_macros::dec;
    use tokio::sync::{broadcast, RwLock};

    use crate::state::{AppState, EngineState, PairState};

    use super::pause_pair;

    fn test_app_state() -> AppState {
        let (stream_tx, _) = broadcast::channel(8);
        AppState {
            state: Arc::new(RwLock::new(EngineState::new())),
            stream_tx,
            exchange_api_url: "http://127.0.0.1:8083".to_string(),
        }
    }

    #[tokio::test]
    async fn pause_pair_sets_paused_for_known_pair() {
        let app_state = test_app_state();
        {
            let mut state = app_state.state.write().await;
            state
                .pairs
                .insert("TESTPAIR".to_string(), PairState::new(dec!(1000)));
        }

        let axum::Json(payload) = pause_pair(
            axum::extract::Path("TESTPAIR".to_string()),
            axum::extract::State(app_state.clone()),
            axum::Json(crate::models::PauseRequest { paused: true }),
        )
        .await;

        assert_eq!(payload["pair"].as_str(), Some("TESTPAIR"));
        assert_eq!(payload["paused"].as_bool(), Some(true));
        let state = app_state.state.read().await;
        assert!(state.pairs["TESTPAIR"].paused);
    }

    #[tokio::test]
    async fn pause_pair_returns_error_for_unknown_pair() {
        let app_state = test_app_state();

        let axum::Json(payload) = pause_pair(
            axum::extract::Path("UNKNOWN".to_string()),
            axum::extract::State(app_state),
            axum::Json(crate::models::PauseRequest { paused: true }),
        )
        .await;

        assert!(payload["error"].as_str().is_some());
    }
}
