use axum::{extract::State, http::StatusCode, Json};
use rust_decimal::Decimal;

use crate::{
    db,
    models::{ExchangeOrderRequest, ExchangeOrderResponse, HedgeRequest, OrderSide},
    state::AppState,
    utils::apply_ratio,
};

use super::update_pair_after_hedge;

async fn submit_hedge_order(
    client: &reqwest::Client,
    exchange_api_url: &str,
    order: &ExchangeOrderRequest,
) -> Result<ExchangeOrderResponse, String> {
    let response = client
        .post(format!("{exchange_api_url}/orders"))
        .json(order)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let response = response.error_for_status().map_err(|e| e.to_string())?;
    response
        .json::<ExchangeOrderResponse>()
        .await
        .map_err(|e| e.to_string())
}

pub async fn manual_hedge(
    State(app_state): State<AppState>,
    Json(payload): Json<HedgeRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let (inventory_before, mid) = {
        let state = app_state.state.read().await;
        let Some(pair_state) = state.pairs.get(&payload.pair) else {
            return Err((
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({ "error": "unknown pair" })),
            ));
        };
        (pair_state.inventory, pair_state.mid)
    };

    let target_inventory = apply_ratio(inventory_before, 25, 100);
    let hedge_size = (inventory_before - target_inventory).abs();
    if hedge_size.is_zero() {
        return Ok(Json(serde_json::json!({
            "pair": payload.pair,
            "targetExchange": payload.target_exchange,
            "inventoryBefore": inventory_before,
            "inventoryAfter": inventory_before,
            "hedgingCost": Decimal::ZERO,
            "hedgeOrder": serde_json::Value::Null,
        })));
    }

    let hedge_side = if inventory_before.is_sign_positive() {
        OrderSide::Sell
    } else {
        OrderSide::Buy
    };

    // naive hedge size calculation - we should consider exchange-specific lot sizes and minimum order sizes
    let hedge_order = ExchangeOrderRequest {
        pair: payload.pair.clone(),
        side: hedge_side,
        price: mid,
        size: hedge_size,
    };

    let order_response = match submit_hedge_order(
        &reqwest::Client::new(),
        &app_state.exchange_api_url,
        &hedge_order,
    )
    .await
    {
        Ok(resp) => resp,
        Err(error) => {
            return Err((
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({
                    "error": "failed to submit hedge order",
                    "details": error,
                })),
            ));
        }
    };

    let (inventory_after, hedge_cost) = {
        let mut state = app_state.state.write().await;

        let (inventory_after, hedge_cost) =
            match update_pair_after_hedge(&mut state, &payload.pair, &order_response) {
                Ok(values) => values,
                Err(response) => {
                    return Err((StatusCode::NOT_FOUND, response));
                }
            };

        state.hedging_costs += hedge_cost;

        (inventory_after, hedge_cost)
    };

    if let Some(pool) = &app_state.db_pool {
        db::write_system_log(
            pool,
            &db::bot_id(),
            "info",
            &format!(
                "manual hedge: {} {} {}",
                payload.pair, order_response.side.as_str(), hedge_size
            ),
        )
        .await;
    }

    Ok(Json(serde_json::json!({
        "pair": payload.pair,
        "targetExchange": payload.target_exchange,
        "inventoryBefore": inventory_before,
        "inventoryAfter": inventory_after,
        "hedgingCost": hedge_cost,
        "hedgeOrder": order_response,
    })))
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use axum::{extract::State as AxumState, routing::post, Json as AxumJson, Router};
    use rust_decimal_macros::dec;
    use tokio::{
        net::TcpListener,
        sync::{broadcast, RwLock},
        task::JoinHandle,
        time::{sleep, Duration},
    };

    use crate::{
        models::{ExchangeOrderRequest, ExchangeOrderResponse},
        state::{AppState, EngineState},
    };

    use super::manual_hedge;

    fn test_app_state(exchange_api_url: String) -> AppState {
        let (stream_tx, _) = broadcast::channel(8);
        AppState {
            state: Arc::new(RwLock::new(EngineState::new())),
            stream_tx,
            exchange_api_url,
            db_pool: None,
        }
    }

    async fn mock_place_order(
        AxumState(filled): AxumState<bool>,
        AxumJson(payload): AxumJson<ExchangeOrderRequest>,
    ) -> AxumJson<ExchangeOrderResponse> {
        AxumJson(ExchangeOrderResponse {
            pair: payload.pair,
            side: payload.side,
            filled,
            fill_price: payload.price,
            fill_size: payload.size,
            adverse_selection: false,
        })
    }

    async fn spawn_mock_exchange_api(filled: bool) -> (String, JoinHandle<()>) {
        let listener = TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind mock exchange listener");
        let address = listener
            .local_addr()
            .expect("read mock exchange listener address");
        let app = Router::new()
            .route("/orders", post(mock_place_order))
            .with_state(filled);
        let server = tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });

        sleep(Duration::from_millis(20)).await;

        (format!("http://{address}"), server)
    }

    #[tokio::test]
    async fn manual_hedge_reduces_inventory_for_known_pair_when_order_fills() {
        let (exchange_api_url, exchange_server) = spawn_mock_exchange_api(true).await;
        let app_state = test_app_state(exchange_api_url);
        {
            let mut state = app_state.state.write().await;
            state
                .pairs
                .get_mut("BTC/USDT")
                .expect("BTC/USDT should exist in EngineState::new()")
                .inventory = dec!(8);
        }

        let result = manual_hedge(
            axum::extract::State(app_state.clone()),
            axum::Json(crate::models::HedgeRequest {
                pair: "BTC/USDT".to_string(),
                target_exchange: Some("Bybit".to_string()),
            }),
        )
        .await;

        let axum::Json(payload) = result.expect("manual hedge should succeed");
        assert_eq!(payload["pair"].as_str(), Some("BTC/USDT"));
        assert_eq!(payload["hedgeOrder"]["filled"].as_bool(), Some(true));
        let state = app_state.state.read().await;
        assert_eq!(state.pairs["BTC/USDT"].inventory, dec!(2));

        exchange_server.abort();
        let _ = exchange_server.await;
    }

    #[tokio::test]
    async fn manual_hedge_keeps_inventory_when_order_not_filled() {
        let (exchange_api_url, exchange_server) = spawn_mock_exchange_api(false).await;
        let app_state = test_app_state(exchange_api_url);
        {
            let mut state = app_state.state.write().await;
            state
                .pairs
                .get_mut("BTC/USDT")
                .expect("BTC/USDT should exist in EngineState::new()")
                .inventory = dec!(8);
        }

        let result = manual_hedge(
            axum::extract::State(app_state.clone()),
            axum::Json(crate::models::HedgeRequest {
                pair: "BTC/USDT".to_string(),
                target_exchange: Some("Bybit".to_string()),
            }),
        )
        .await;

        let axum::Json(payload) = result.expect("manual hedge should succeed");
        assert_eq!(payload["pair"].as_str(), Some("BTC/USDT"));
        assert_eq!(payload["hedgeOrder"]["filled"].as_bool(), Some(false));
        let state = app_state.state.read().await;
        assert_eq!(state.pairs["BTC/USDT"].inventory, dec!(8));

        exchange_server.abort();
        let _ = exchange_server.await;
    }

    #[tokio::test]
    async fn manual_hedge_returns_error_for_unknown_pair() {
        let app_state = test_app_state("http://127.0.0.1:3111".to_string());

        let result = manual_hedge(
            axum::extract::State(app_state),
            axum::Json(crate::models::HedgeRequest {
                pair: "UNKNOWN".to_string(),
                target_exchange: None,
            }),
        )
        .await;

        let (status, axum::Json(payload)) = result.expect_err("should return error for unknown pair");
        assert_eq!(status, axum::http::StatusCode::NOT_FOUND);
        assert_eq!(payload["error"].as_str(), Some("unknown pair"));
    }
}
