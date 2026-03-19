use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

use crate::{db, models::PauseRequest, state::AppState};

pub async fn pause_pair(
    Path(pair): Path<String>,
    State(app_state): State<AppState>,
    Json(payload): Json<PauseRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let result = {
        let mut state = app_state.state.write().await;
        if let Some(pair_state) = state.pairs.get_mut(&pair) {
            pair_state.paused = payload.paused;
            Ok(pair_state.paused)
        } else {
            Err(format!("unknown pair: {pair}"))
        }
    };

    match result {
        Ok(paused) => {
            if let Some(pool) = &app_state.db_pool {
                let action = if paused { "paused" } else { "unpaused" };
                db::write_system_log(
                    pool,
                    &db::bot_id(),
                    "info",
                    &format!("pair {pair} {action}"),
                )
                .await;
            }
            Ok(Json(serde_json::json!({ "pair": pair, "paused": paused })))
        }
        Err(msg) => Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": msg })),
        )),
    }
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
            exchange_api_url: "http://127.0.0.1:3111".to_string(),
            db_pool: None,
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

        let result = pause_pair(
            axum::extract::Path("TESTPAIR".to_string()),
            axum::extract::State(app_state.clone()),
            axum::Json(crate::models::PauseRequest { paused: true }),
        )
        .await;

        let axum::Json(payload) = result.expect("pause_pair should succeed for known pair");
        assert_eq!(payload["pair"].as_str(), Some("TESTPAIR"));
        assert_eq!(payload["paused"].as_bool(), Some(true));
        let state = app_state.state.read().await;
        assert!(state.pairs["TESTPAIR"].paused);
    }

    #[tokio::test]
    async fn pause_pair_returns_error_for_unknown_pair() {
        let app_state = test_app_state();

        let result = pause_pair(
            axum::extract::Path("UNKNOWN".to_string()),
            axum::extract::State(app_state),
            axum::Json(crate::models::PauseRequest { paused: true }),
        )
        .await;

        let (status, axum::Json(payload)) = result.expect_err("should return error for unknown pair");
        assert_eq!(status, axum::http::StatusCode::NOT_FOUND);
        assert!(payload["error"].as_str().is_some());
    }
}
