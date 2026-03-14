use std::{sync::Arc, time::Duration};

use futures_util::StreamExt;
use tokio::sync::RwLock;
use tokio_tungstenite::connect_async;
use tracing::{error, info, warn};

use crate::models::{ExchangeFeedPayload, ExchangeOrderRequest, ExchangeOrderResponse};
use crate::state::EngineState;

/// Connects to the exchange WebSocket feed and keeps the bot state_engine updated with
/// the latest market prices. Reconnects automatically on disconnect.
pub async fn exchange_ws_loop(exchange_ws_url: String, bot_state: Arc<RwLock<EngineState>>) {
    loop {
        info!("connecting to exchange at {exchange_ws_url}");
        match connect_async(&exchange_ws_url).await {
            Ok((mut ws_stream, _)) => {
                info!("connected to exchange");
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
            }
            Err(e) => {
                error!("exchange ws connect error: {e}");
            }
        }
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}

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
