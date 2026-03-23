use tracing::warn;

use crate::models::{ExchangeOrderRequest, ExchangeOrderResponse};

/// Sends a batch of orders to the exchange HTTP API and collects fill responses.
pub async fn place_exchange_orders(
    client: &reqwest::Client,
    exchange_api_url: &str,
    orders: Vec<ExchangeOrderRequest>,
) -> Vec<ExchangeOrderResponse> {
    let mut fills = Vec::new();
    for order in orders {
        match client
            .post(format!("{exchange_api_url}/orders"))
            .json(&order)
            .send()
            .await
        {
            Ok(resp) => {
                if let Ok(fill) = resp.json::<ExchangeOrderResponse>().await {
                    fills.push(fill);
                }
            }
            Err(e) => {
                warn!("failed to place order: {e}");
            }
        }
    }
    fills
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        routing::post,
        Json, Router,
    };
    use rust_decimal_macros::dec;
    use serde_json::json;
    use std::net::SocketAddr;
    use tokio::net::TcpListener;

    /// Bind an axum router on a random OS port and return the base URL.
    async fn serve_router(router: Router) -> (SocketAddr, tokio::task::JoinHandle<()>) {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let handle = tokio::spawn(async move {
            axum::serve(listener, router).await.unwrap();
        });
        (addr, handle)
    }

    #[tokio::test]
    async fn place_orders_returns_fills_on_success() {
        let app = Router::new().route(
            "/orders",
            post(|Json(req): Json<ExchangeOrderRequest>| async move {
                Json(json!({
                    "pair": req.pair,
                    "side": req.side,
                    "filled": true,
                    "fillPrice": "62010",
                    "fillSize": "0.5",
                    "adverseSelection": false,
                }))
            }),
        );
        let (addr, _handle) = serve_router(app).await;
        let url = format!("http://{addr}");
        let client = reqwest::Client::new();

        let orders = vec![ExchangeOrderRequest {
            pair: "BTC/USDT".to_string(),
            side: "sell".to_string(),
            price: dec!(62010),
            size: dec!(0.5),
        }];

        let fills = place_exchange_orders(&client, &url, orders).await;

        assert_eq!(fills.len(), 1);
        assert!(fills[0].filled);
        assert_eq!(fills[0].pair, "BTC/USDT");
        assert_eq!(fills[0].fill_price, dec!(62010));
        assert_eq!(fills[0].fill_size, dec!(0.5));
        assert!(!fills[0].adverse_selection);
    }

    #[tokio::test]
    async fn place_orders_handles_multiple_orders() {
        let app = Router::new().route(
            "/orders",
            post(|Json(req): Json<ExchangeOrderRequest>| async move {
                Json(json!({
                    "pair": req.pair,
                    "side": req.side,
                    "filled": true,
                    "fillPrice": "100",
                    "fillSize": "1",
                    "adverseSelection": false,
                }))
            }),
        );
        let (addr, _handle) = serve_router(app).await;
        let url = format!("http://{addr}");
        let client = reqwest::Client::new();

        let orders = vec![
            ExchangeOrderRequest {
                pair: "BTC/USDT".to_string(),
                side: "sell".to_string(),
                price: dec!(100),
                size: dec!(1),
            },
            ExchangeOrderRequest {
                pair: "ETH/USDT".to_string(),
                side: "buy".to_string(),
                price: dec!(200),
                size: dec!(2),
            },
        ];

        let fills = place_exchange_orders(&client, &url, orders).await;

        assert_eq!(fills.len(), 2);
        assert_eq!(fills[0].pair, "BTC/USDT");
        assert_eq!(fills[1].pair, "ETH/USDT");
    }

    #[tokio::test]
    async fn place_orders_empty_input_returns_empty() {
        let client = reqwest::Client::new();
        // URL doesn't matter since no requests are made
        let fills = place_exchange_orders(&client, "http://127.0.0.1:1", vec![]).await;
        assert!(fills.is_empty());
    }

    #[tokio::test]
    async fn place_orders_skips_unparseable_response() {
        let app = Router::new().route(
            "/orders",
            post(|| async { Json(json!({ "unexpected": "schema" })) }),
        );
        let (addr, _handle) = serve_router(app).await;
        let url = format!("http://{addr}");
        let client = reqwest::Client::new();

        let orders = vec![ExchangeOrderRequest {
            pair: "BTC/USDT".to_string(),
            side: "sell".to_string(),
            price: dec!(100),
            size: dec!(1),
        }];

        let fills = place_exchange_orders(&client, &url, orders).await;
        // Response can't be deserialized into ExchangeOrderResponse → skipped
        assert!(fills.is_empty());
    }

    #[tokio::test]
    async fn place_orders_skips_on_network_error() {
        let client = reqwest::Client::new();
        // Nothing is listening on this port
        let orders = vec![ExchangeOrderRequest {
            pair: "BTC/USDT".to_string(),
            side: "sell".to_string(),
            price: dec!(100),
            size: dec!(1),
        }];

        let fills = place_exchange_orders(&client, "http://127.0.0.1:1", orders).await;
        assert!(fills.is_empty());
    }
}
