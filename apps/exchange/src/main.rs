use std::{sync::Arc, time::Duration};

use axum::{
    extract::ws::{Message, WebSocket},
    extract::{State, WebSocketUpgrade},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use tokio::{
    net::TcpListener,
    sync::{RwLock, broadcast},
};
use tracing::{error, info};

mod models;
mod state;
mod utils;

use models::OrderRequest;
use state::ExchangeState;

#[derive(Clone)]
struct AppState {
    state: Arc<RwLock<ExchangeState>>,
    stream_tx: broadcast::Sender<String>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let (stream_tx, _) = broadcast::channel(128);
    let app_state = AppState {
        state: Arc::new(RwLock::new(ExchangeState::new())),
        stream_tx,
    };

    let stream_state = app_state.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(250));
        loop {
            interval.tick().await;
            let payload = {
                let mut guard = stream_state.state.write().await;
                guard.tick()
            };
            if let Ok(serialized) = serde_json::to_string(&payload) {
                let _ = stream_state.stream_tx.send(serialized);
            }
        }
    });

    let ws_app = Router::new()
        .route("/feed", get(ws_feed_handler))
        .with_state(app_state.clone());

    let api_app = Router::new()
        .route("/orders", post(place_order))
        .route("/health", get(health))
        .with_state(app_state.clone());

    let ws_listener = TcpListener::bind("0.0.0.0:8082")
        .await
        .expect("bind ws listener");
    let api_listener = TcpListener::bind("0.0.0.0:8083")
        .await
        .expect("bind api listener");

    info!("exchange feed listening on ws://0.0.0.0:8082/feed");
    info!("exchange api listening on http://0.0.0.0:8083");

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

async fn ws_feed_handler(
    ws: WebSocketUpgrade,
    State(app_state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_ws_socket(socket, app_state))
}

async fn handle_ws_socket(mut socket: WebSocket, app_state: AppState) {
    let initial_payload = {
        let mut state = app_state.state.write().await;
        state.tick()
    };

    if let Ok(initial) = serde_json::to_string(&initial_payload) {
        if socket.send(Message::Text(initial.into())).await.is_err() {
            return;
        }
    }

    let mut rx = app_state.stream_tx.subscribe();
    while let Ok(msg) = rx.recv().await {
        if socket.send(Message::Text(msg.into())).await.is_err() {
            break;
        }
    }
}

async fn place_order(
    State(app_state): State<AppState>,
    Json(payload): Json<OrderRequest>,
) -> Json<serde_json::Value> {
    let state = app_state.state.read().await;
    let result = state.place_order(&payload);
    Json(serde_json::to_value(&result).unwrap_or_default())
}

async fn health(State(app_state): State<AppState>) -> Json<serde_json::Value> {
    let state = app_state.state.read().await;
    Json(serde_json::json!({
        "status": "ok",
        "fake": state.fake,
        "trackedPairs": state.pairs.len(),
    }))
}
