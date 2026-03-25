use std::{sync::Arc, time::Duration};

use futures_util::StreamExt;
use tokio::sync::RwLock;
use tokio_tungstenite::connect_async;
use tracing::{error, info, warn};

use crate::db;
use crate::models::ExchangeFeedPayload;
use crate::state::EngineState;

/// Connects to the exchange WebSocket feed and keeps the bot StateEngine updated with
/// the latest market prices. Reconnects automatically on disconnect.
pub async fn exchange_ws_loop(
    exchange_ws_url: String,
    bot_state: Arc<RwLock<EngineState>>,
    db_pool: Option<sqlx::PgPool>,
) {
    loop {
        info!("connecting to exchange at {exchange_ws_url}");
        match connect_async(&exchange_ws_url).await {
            Ok((mut ws_stream, _)) => {
                info!("connected to exchange");
                if let Some(pool) = &db_pool {
                    db::write_system_log(pool, &db::bot_id(), "info", "connected to exchange")
                        .await;
                }
                while let Some(msg) = ws_stream.next().await {
                    match msg {
                        Ok(tokio_tungstenite::tungstenite::Message::Text(text)) => {
                            match serde_json::from_str::<ExchangeFeedPayload>(&text) {
                                Ok(feed) => {
                                    let mut guard = bot_state.write().await;
                                    guard.update_from_exchange(feed);
                                }
                                Err(e) => {
                                    warn!("exchange feed parse error: {e}");
                                }
                            }
                        }
                        Err(e) => {
                            error!("exchange ws error: {e}");
                            break;
                        }
                        _ => {}
                    }
                }
                {
                    let mut guard = bot_state.write().await;
                    guard.exchange_connected = false;
                }
                warn!("exchange disconnected, reconnecting in 1s");
                if let Some(pool) = &db_pool {
                    db::write_system_log(pool, &db::bot_id(), "warn", "exchange disconnected")
                        .await;
                }
            }
            Err(e) => {
                error!("exchange ws connect error: {e}");
            }
        }
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        extract::ws::{Message, WebSocket, WebSocketUpgrade},
        response::IntoResponse,
        routing::get,
        Router,
    };
    use futures_util::SinkExt;
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
    async fn ws_loop_updates_state_from_feed() {
        async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
            ws.on_upgrade(|mut socket: WebSocket| async move {
                let payload = json!({
                    "pairs": [{
                        "pair": "BTC/USDT",
                        "mid": "65000",
                        "volatility": "1.5"
                    }]
                });
                let _ = socket
                    .send(Message::Text(serde_json::to_string(&payload).unwrap().into()))
                    .await;
                // Close after sending one message
                let _ = socket.close().await;
            })
        }

        let app = Router::new().route("/feed", get(ws_handler));
        let (addr, _handle) = serve_router(app).await;
        let ws_url = format!("ws://{addr}/feed");
        let state = Arc::new(RwLock::new(EngineState::new()));

        // Run the loop in a task; it will connect, receive one message, then disconnect
        let loop_state = state.clone();
        let loop_handle = tokio::spawn(async move {
            exchange_ws_loop(ws_url, loop_state, None).await;
        });

        // Give it time to connect, receive, and process
        tokio::time::sleep(Duration::from_millis(500)).await;
        loop_handle.abort();

        let guard = state.read().await;
        assert_eq!(guard.pairs["BTC/USDT"].mid, dec!(65000));
        assert_eq!(guard.pairs["BTC/USDT"].volatility, dec!(1.5));
    }

    #[tokio::test]
    async fn ws_loop_marks_disconnected_on_close() {
        async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
            ws.on_upgrade(|mut socket: WebSocket| async move {
                // Immediately close
                let _ = socket.close().await;
            })
        }

        let app = Router::new().route("/feed", get(ws_handler));
        let (addr, _handle) = serve_router(app).await;
        let ws_url = format!("ws://{addr}/feed");
        let state = Arc::new(RwLock::new(EngineState::new()));

        {
            let mut guard = state.write().await;
            guard.exchange_connected = true;
        }

        let loop_state = state.clone();
        let loop_handle = tokio::spawn(async move {
            exchange_ws_loop(ws_url, loop_state, None).await;
        });

        // Wait for the disconnect to be processed
        tokio::time::sleep(Duration::from_millis(500)).await;
        loop_handle.abort();

        let guard = state.read().await;
        assert!(!guard.exchange_connected);
    }

    #[tokio::test]
    async fn ws_loop_ignores_invalid_json_messages() {
        async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
            ws.on_upgrade(|mut socket: WebSocket| async move {
                // Send garbage, then a valid message, then close
                let _ = socket.send(Message::Text("not valid json".into())).await;
                let payload = json!({
                    "pairs": [{
                        "pair": "ETH/USDT",
                        "mid": "4000",
                        "volatility": "2.0"
                    }]
                });
                let _ = socket
                    .send(Message::Text(serde_json::to_string(&payload).unwrap().into()))
                    .await;
                let _ = socket.close().await;
            })
        }

        let app = Router::new().route("/feed", get(ws_handler));
        let (addr, _handle) = serve_router(app).await;
        let ws_url = format!("ws://{addr}/feed");
        let state = Arc::new(RwLock::new(EngineState::new()));

        let loop_state = state.clone();
        let loop_handle = tokio::spawn(async move {
            exchange_ws_loop(ws_url, loop_state, None).await;
        });

        tokio::time::sleep(Duration::from_millis(500)).await;
        loop_handle.abort();

        // The valid message should still have been processed
        let guard = state.read().await;
        assert_eq!(guard.pairs["ETH/USDT"].mid, dec!(4000));
        assert_eq!(guard.pairs["ETH/USDT"].volatility, dec!(2.0));
    }
}
