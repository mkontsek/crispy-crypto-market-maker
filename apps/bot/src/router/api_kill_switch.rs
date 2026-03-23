use axum::{extract::State, Json};

use crate::{models::KillSwitchRequest, state::AppState};

pub async fn kill_switch(
    State(app_state): State<AppState>,
    Json(payload): Json<KillSwitchRequest>,
) -> Json<serde_json::Value> {
    let mut state = app_state.state.write().await;
    state.kill_switch_engaged = payload.engaged;
    for pair in state.pairs.values_mut() {
        pair.paused = payload.engaged;
    }
    Json(serde_json::json!({
        "killSwitchEngaged": state.kill_switch_engaged,
    }))
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use tokio::sync::{broadcast, RwLock};

    use crate::state::{AppState, EngineState};

    use super::*;

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
    async fn kill_switch_engage_pauses_all_pairs() {
        let app_state = test_app_state();

        let axum::Json(payload) = kill_switch(
            axum::extract::State(app_state.clone()),
            axum::Json(KillSwitchRequest { engaged: true }),
        )
        .await;

        assert_eq!(payload["killSwitchEngaged"].as_bool(), Some(true));
        let state = app_state.state.read().await;
        assert!(state.kill_switch_engaged);
        for pair in state.pairs.values() {
            assert!(pair.paused, "all pairs should be paused when kill switch is engaged");
        }
    }

    #[tokio::test]
    async fn kill_switch_disengage_resumes_all_pairs() {
        let app_state = test_app_state();
        {
            let mut state = app_state.state.write().await;
            state.kill_switch_engaged = true;
            for pair in state.pairs.values_mut() {
                pair.paused = true;
            }
        }

        let axum::Json(payload) = kill_switch(
            axum::extract::State(app_state.clone()),
            axum::Json(KillSwitchRequest { engaged: false }),
        )
        .await;

        assert_eq!(payload["killSwitchEngaged"].as_bool(), Some(false));
        let state = app_state.state.read().await;
        assert!(!state.kill_switch_engaged);
        for pair in state.pairs.values() {
            assert!(!pair.paused, "all pairs should be unpaused when kill switch is disengaged");
        }
    }
}
