use axum::{extract::State, Json};

use crate::{models::SetStrategyRequest, state::AppState};

pub async fn set_strategy(
    State(app_state): State<AppState>,
    Json(payload): Json<SetStrategyRequest>,
) -> Json<serde_json::Value> {
    let mut state = app_state.state.write().await;
    let strategy_name = payload.strategy.as_str().to_string();
    state.apply_strategy_preset(payload.strategy);
    Json(serde_json::json!({ "strategy": strategy_name }))
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

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
            db_pool: None,
        }
    }

    #[tokio::test]
    async fn set_strategy_conservative_updates_config() {
        let app_state = test_app_state();

        let axum::Json(payload) = set_strategy(
            axum::extract::State(app_state.clone()),
            axum::Json(SetStrategyRequest {
                strategy: StrategyPreset::Conservative,
            }),
        )
        .await;

        assert_eq!(payload["strategy"].as_str(), Some("conservative"));

        let state = app_state.state.read().await;
        assert_eq!(state.active_strategy, StrategyPreset::Conservative);
        let btc = state.config.pairs.iter().find(|p| p.pair == "BTC/USDT").unwrap();
        assert_eq!(btc.base_spread_bps.to_string(), "20");
    }

    #[tokio::test]
    async fn set_strategy_aggressive_updates_config() {
        let app_state = test_app_state();

        let axum::Json(payload) = set_strategy(
            axum::extract::State(app_state.clone()),
            axum::Json(SetStrategyRequest {
                strategy: StrategyPreset::Aggressive,
            }),
        )
        .await;

        assert_eq!(payload["strategy"].as_str(), Some("aggressive"));

        let state = app_state.state.read().await;
        assert_eq!(state.active_strategy, StrategyPreset::Aggressive);
        let btc = state.config.pairs.iter().find(|p| p.pair == "BTC/USDT").unwrap();
        assert_eq!(btc.base_spread_bps.to_string(), "5");
        assert!(!btc.hedging_enabled);
    }

    #[tokio::test]
    async fn set_strategy_balanced_restores_defaults() {
        let app_state = test_app_state();
        {
            let mut state = app_state.state.write().await;
            state.apply_strategy_preset(StrategyPreset::Aggressive);
        }

        let axum::Json(payload) = set_strategy(
            axum::extract::State(app_state.clone()),
            axum::Json(SetStrategyRequest {
                strategy: StrategyPreset::Balanced,
            }),
        )
        .await;

        assert_eq!(payload["strategy"].as_str(), Some("balanced"));

        let state = app_state.state.read().await;
        assert_eq!(state.active_strategy, StrategyPreset::Balanced);
        let btc = state.config.pairs.iter().find(|p| p.pair == "BTC/USDT").unwrap();
        assert_eq!(btc.base_spread_bps.to_string(), "10");
    }
}
