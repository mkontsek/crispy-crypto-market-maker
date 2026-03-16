use axum::{
    routing::{get, post},
    Router,
};

use crate::{
    router::{
        api_geo::geo, api_health::health, api_manual_hedge::manual_hedge,
        api_pause_pair::pause_pair, api_update_config::update_config,
    },
    state::AppState,
};

pub fn build_api_app(app_state: AppState) -> Router {
    Router::new()
        .route("/config", post(update_config))
        .route("/pairs/{id}/pause", post(pause_pair))
        .route("/hedge", post(manual_hedge))
        .route("/health", get(health))
        .route("/geo", get(geo))
        .with_state(app_state)
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use axum::{
        extract::State as AxumState, routing::post as axum_post, Json as AxumJson,
        Router as AxumRouter,
    };
    use rust_decimal_macros::dec;
    use tokio::{
        net::TcpListener,
        sync::{broadcast, RwLock},
        task::JoinHandle,
        time::{sleep, Duration},
    };

    use crate::{
        models::{ExchangeOrderRequest, ExchangeOrderResponse},
        state::{AppState, EngineState, PairState},
    };

    use super::build_api_app;

    fn test_app_state(exchange_api_url: String) -> AppState {
        let (stream_tx, _) = broadcast::channel(8);
        AppState {
            state: Arc::new(RwLock::new(EngineState::new())),
            stream_tx,
            exchange_api_url,
        }
    }

    async fn spawn_api_server(app_state: AppState) -> (String, JoinHandle<()>) {
        let listener = TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind api test listener");
        let address = listener
            .local_addr()
            .expect("read api test listener address");
        let app = build_api_app(app_state);
        let server = tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });

        sleep(Duration::from_millis(20)).await;

        (format!("http://{address}"), server)
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
        let app = AxumRouter::new()
            .route("/orders", axum_post(mock_place_order))
            .with_state(filled);
        let server = tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });

        sleep(Duration::from_millis(20)).await;

        (format!("http://{address}"), server)
    }

    #[tokio::test]
    async fn health_endpoint_returns_ok_payload() {
        let app_state = test_app_state("http://127.0.0.1:3111".to_string());
        let (base_url, server) = spawn_api_server(app_state).await;

        let response = reqwest::get(format!("{base_url}/health"))
            .await
            .expect("request health route");
        assert!(response.status().is_success());

        let payload: serde_json::Value = response.json().await.expect("parse health payload");
        assert_eq!(payload["status"].as_str(), Some("ok"));
        assert_eq!(payload["trackedPairs"].as_u64(), Some(3));

        server.abort();
        let _ = server.await;
    }

    #[tokio::test]
    async fn config_endpoint_updates_state_and_returns_payload() {
        let app_state = test_app_state("http://127.0.0.1:3111".to_string());
        let (base_url, server) = spawn_api_server(app_state.clone()).await;
        let client = reqwest::Client::new();

        let response = client
            .post(format!("{base_url}/config"))
            .json(&serde_json::json!({
                "pairs": [
                    {
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
                    }
                ]
            }))
            .send()
            .await
            .expect("send config request");
        assert!(response.status().is_success());

        let payload: serde_json::Value = response.json().await.expect("parse config response");
        assert_eq!(payload["pairs"][0]["pair"].as_str(), Some("TESTPAIR"));

        let state = app_state.state.read().await;
        let pair_state = state
            .pairs
            .get("TESTPAIR")
            .expect("config update should create TESTPAIR state_engine");
        assert!(pair_state.paused);
        assert_eq!(state.config.pairs.len(), 1);

        server.abort();
        let _ = server.await;
    }

    #[tokio::test]
    async fn pause_and_hedge_endpoints_update_existing_pair_state() {
        let (exchange_api_url, exchange_server) = spawn_mock_exchange_api(true).await;
        let app_state = test_app_state(exchange_api_url);
        {
            let mut state = app_state.state.write().await;
            state
                .pairs
                .insert("TESTPAIR".to_string(), PairState::new(dec!(1000)));
            if let Some(pair) = state.pairs.get_mut("BTC/USDT") {
                pair.inventory = dec!(8);
            }
        }

        let (base_url, server) = spawn_api_server(app_state.clone()).await;
        let client = reqwest::Client::new();

        let pause_response = client
            .post(format!("{base_url}/pairs/TESTPAIR/pause"))
            .json(&serde_json::json!({ "paused": true }))
            .send()
            .await
            .expect("send pause request");
        assert!(pause_response.status().is_success());
        let pause_payload: serde_json::Value = pause_response
            .json()
            .await
            .expect("parse pause response payload");
        assert_eq!(pause_payload["pair"].as_str(), Some("TESTPAIR"));
        assert_eq!(pause_payload["paused"].as_bool(), Some(true));

        let hedge_response = client
            .post(format!("{base_url}/hedge"))
            .json(&serde_json::json!({
                "pair": "BTC/USDT",
                "targetExchange": "Bybit"
            }))
            .send()
            .await
            .expect("send hedge request");
        assert!(hedge_response.status().is_success());
        let hedge_payload: serde_json::Value = hedge_response
            .json()
            .await
            .expect("parse hedge response payload");
        assert_eq!(hedge_payload["pair"].as_str(), Some("BTC/USDT"));
        assert_eq!(hedge_payload["hedgeOrder"]["filled"].as_bool(), Some(true));

        let state = app_state.state.read().await;
        let test_pair = state
            .pairs
            .get("TESTPAIR")
            .expect("TESTPAIR should exist in state_engine");
        assert!(test_pair.paused);
        let btc_pair = state
            .pairs
            .get("BTC/USDT")
            .expect("BTC/USDT should exist in state_engine");
        assert_eq!(btc_pair.inventory, dec!(2));

        server.abort();
        let _ = server.await;
        exchange_server.abort();
        let _ = exchange_server.await;
    }
}
