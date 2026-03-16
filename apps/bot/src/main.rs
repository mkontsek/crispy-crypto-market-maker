use std::sync::Arc;
use tokio::{
    net::TcpListener,
    sync::{broadcast, RwLock},
};
use tracing::{error, info};

mod exchange;
mod init;
mod models;
mod router;
mod state;
mod utils;

use exchange::exchange_ws_loop;
use init::resolve_exchange_endpoints;
use router::{build_api_app, build_ws_app};
use state::{AppState, EngineState};
use utils::spawn_bot_tick_loop;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // Init urls
    let (exchange_ws_url, exchange_api_url) = resolve_exchange_endpoints().await;
    info!("exchange ws url: {exchange_ws_url}");
    info!("exchange api url: {exchange_api_url}");

    let (stream_tx, _) = broadcast::channel(128);
    let app_state = AppState {
        state: Arc::new(RwLock::new(EngineState::new())),
        stream_tx,
        exchange_api_url,
    };

    // Exchange WebSocket listener: subscribes to the exchange feed and updates
    // mid prices / volatility in bot state_engine whenever new market data arrives.
    let exchange_bot_state = app_state.state.clone();
    tokio::spawn(async move {
        exchange_ws_loop(exchange_ws_url, exchange_bot_state).await;
    });

    // Bot tick loop: every 250 ms, compute MM quotes, place orders on the exchange,
    // process any fills, then broadcast the updated bot stream payload.
    spawn_bot_tick_loop(
        app_state.state.clone(),
        app_state.stream_tx.clone(),
        app_state.exchange_api_url.clone(),
    );

    let ws_app = build_ws_app(app_state.clone());
    let api_app = build_api_app(app_state.clone());

    let ws_listener = TcpListener::bind("0.0.0.0:8080")
        .await
        .expect("bind ws listener");
    let api_listener = TcpListener::bind("0.0.0.0:8081")
        .await
        .expect("bind api listener");

    info!("bot stream listening on ws://0.0.0.0:8080/stream");
    info!("bot api listening on http://0.0.0.0:8081");

    tokio::select! {
        result = axum::serve(ws_listener, ws_app) => {
            if let Err(err) = result {
                error!("ws server error: {err}");
            }
        }
        result = axum::serve(api_listener, api_app) => {
            if let Err(err) = result {
                error!("api server error: {err}");
            }
        }
    }
}
