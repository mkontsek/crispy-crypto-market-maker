use axum::{
    extract::State,
    Json,
};

use crate::{
    models::HedgeRequest,
    state::AppState,
    utils::{apply_ratio, quote_notional_rate},
};

pub async fn manual_hedge(
    State(app_state): State<AppState>,
    Json(payload): Json<HedgeRequest>,
) -> Json<serde_json::Value> {
    let mut state = app_state.state.write().await;
    if let Some(pair_state) = state.pairs.get_mut(&payload.pair) {
        let pre = pair_state.inventory;
        let mid = pair_state.mid;
        pair_state.inventory = apply_ratio(pair_state.inventory, 25, 100);
        let inventory_after = pair_state.inventory;
        let hedge_cost = quote_notional_rate(mid, pre.abs(), 8, 100_000);
        state.hedging_costs += hedge_cost;

        return Json(serde_json::json!({
            "pair": payload.pair,
            "targetExchange": payload.target_exchange,
            "inventoryBefore": pre,
            "inventoryAfter": inventory_after,
            "hedgingCost": hedge_cost,
        }));
    }

    Json(serde_json::json!({ "error": "unknown pair" }))
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use rust_decimal_macros::dec;
    use tokio::sync::{broadcast, RwLock};

    use crate::state::{AppState, EngineState};

    use super::manual_hedge;

    fn test_app_state() -> AppState {
        let (stream_tx, _) = broadcast::channel(8);
        AppState {
            state: Arc::new(RwLock::new(EngineState::new())),
            stream_tx,
            exchange_api_url: "http://127.0.0.1:8083".to_string(),
        }
    }

    #[tokio::test]
    async fn manual_hedge_reduces_inventory_for_known_pair() {
        let app_state = test_app_state();
        {
            let mut state = app_state.state.write().await;
            state
                .pairs
                .get_mut("BTC/USDT")
                .expect("BTC/USDT should exist in EngineState::new()")
                .inventory = dec!(8);
        }

        let axum::Json(payload) = manual_hedge(
            axum::extract::State(app_state.clone()),
            axum::Json(crate::models::HedgeRequest {
                pair: "BTC/USDT".to_string(),
                target_exchange: Some("Bybit".to_string()),
            }),
        )
        .await;

        assert_eq!(payload["pair"].as_str(), Some("BTC/USDT"));
        let state = app_state.state.read().await;
        assert_eq!(state.pairs["BTC/USDT"].inventory, dec!(2));
    }

    #[tokio::test]
    async fn manual_hedge_returns_error_for_unknown_pair() {
        let app_state = test_app_state();

        let axum::Json(payload) = manual_hedge(
            axum::extract::State(app_state),
            axum::Json(crate::models::HedgeRequest {
                pair: "UNKNOWN".to_string(),
                target_exchange: None,
            }),
        )
        .await;

        assert_eq!(payload["error"].as_str(), Some("unknown pair"));
    }
}
