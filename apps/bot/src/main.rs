use std::{sync::Arc, time::Duration};

use axum::{
    extract::ws::{Message, WebSocket},
    extract::{Path, State, WebSocketUpgrade},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use futures_util::StreamExt;
use tokio::{
    net::TcpListener,
    sync::{RwLock, broadcast},
};
use tokio_tungstenite::connect_async;
use tracing::{error, info, warn};

mod models;
mod state;
mod utils;

use models::{ExchangeFeedPayload, ExchangeOrderRequest, ExchangeOrderResponse, HedgeRequest, MMConfig, PauseRequest};
use state::{EngineState, PairState};
use utils::{apply_ratio, quote_notional_rate_fp};

const DEFAULT_EXCHANGE_WS_URL: &str = "ws://127.0.0.1:8082/feed";
const DEFAULT_EXCHANGE_API_URL: &str = "http://127.0.0.1:8083";

#[derive(Clone)]
struct AppState {
    state: Arc<RwLock<EngineState>>,
    stream_tx: broadcast::Sender<String>,
    exchange_api_url: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let exchange_ws_url = std::env::var("EXCHANGE_WS_URL")
        .unwrap_or_else(|_| DEFAULT_EXCHANGE_WS_URL.to_string());
    let exchange_api_url = std::env::var("EXCHANGE_API_URL")
        .unwrap_or_else(|_| DEFAULT_EXCHANGE_API_URL.to_string());

    let (stream_tx, _) = broadcast::channel(128);
    let app_state = AppState {
        state: Arc::new(RwLock::new(EngineState::new())),
        stream_tx,
        exchange_api_url,
    };

    // Exchange WebSocket listener: subscribes to the exchange feed and updates
    // mid prices / volatility in bot state whenever new market data arrives.
    let exchange_bot_state = app_state.state.clone();
    tokio::spawn(async move {
        exchange_ws_loop(exchange_ws_url, exchange_bot_state).await;
    });

    // Bot tick loop: every 250 ms, compute MM quotes, place orders on the exchange,
    // process any fills, then broadcast the updated bot stream payload.
    let stream_state = app_state.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(250));
        let http_client = reqwest::Client::new();
        loop {
            interval.tick().await;

            // 1. Compute orders to place (requires write lock to update bid/ask).
            let orders = {
                let mut guard = stream_state.state.write().await;
                guard.compute_orders()
            };

            // 2. Place orders on the exchange (async, no lock held).
            let exchange_fills =
                place_exchange_orders(&http_client, &stream_state.exchange_api_url, orders).await;

            // 3. Apply fills and build the stream payload (write lock).
            let payload = {
                let mut guard = stream_state.state.write().await;
                guard.build_payload(exchange_fills)
            };

            if let Ok(serialized) = serde_json::to_string(&payload) {
                let _ = stream_state.stream_tx.send(serialized);
            }
        }
    });

    let ws_app = Router::new()
        .route("/stream", get(ws_stream_handler))
        .with_state(app_state.clone());

    let api_app = Router::new()
        .route("/config", post(update_config))
        .route("/pairs/{id}/pause", post(pause_pair))
        .route("/hedge", post(manual_hedge))
        .route("/health", get(health))
        .with_state(app_state.clone());

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

/// Connects to the exchange WebSocket feed and keeps the bot state updated with
/// the latest market prices. Reconnects automatically on disconnect.
async fn exchange_ws_loop(exchange_ws_url: String, bot_state: Arc<RwLock<EngineState>>) {
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
async fn place_exchange_orders(
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

async fn ws_stream_handler(
    ws: WebSocketUpgrade,
    State(app_state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_ws_socket(socket, app_state))
}

async fn handle_ws_socket(mut socket: WebSocket, app_state: AppState) {
    let initial_payload = {
        let mut state = app_state.state.write().await;
        state.build_payload(vec![])
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

async fn update_config(
    State(app_state): State<AppState>,
    Json(payload): Json<MMConfig>,
) -> Json<MMConfig> {
    let mut state = app_state.state.write().await;
    let pairs = payload.pairs.clone();
    state.config = payload.clone();
    for cfg in pairs {
        state
            .pairs
            .entry(cfg.pair.clone())
            .or_insert_with(|| PairState::new(1_000.0));
        if let Some(pair_state) = state.pairs.get_mut(&cfg.pair) {
            pair_state.paused = !cfg.enabled;
        }
    }
    Json(payload)
}

async fn pause_pair(
    Path(pair): Path<String>,
    State(app_state): State<AppState>,
    Json(payload): Json<PauseRequest>,
) -> impl IntoResponse {
    let mut state = app_state.state.write().await;
    if let Some(pair_state) = state.pairs.get_mut(&pair) {
        pair_state.paused = payload.paused;
        return Json(serde_json::json!({
            "pair": pair,
            "paused": pair_state.paused,
        }));
    }

    Json(serde_json::json!({
        "error": format!("unknown pair: {pair}"),
    }))
}

async fn manual_hedge(
    State(app_state): State<AppState>,
    Json(payload): Json<HedgeRequest>,
) -> impl IntoResponse {
    let mut state = app_state.state.write().await;
    if let Some(pair_state) = state.pairs.get_mut(&payload.pair) {
        let pre = pair_state.inventory;
        let mid = pair_state.mid;
        pair_state.inventory = apply_ratio(pair_state.inventory, 25, 100);
        let inventory_after = pair_state.inventory;
        let hedge_cost = quote_notional_rate_fp(mid, pre.abs(), 8, 100_000);
        state.hedging_costs = state.hedging_costs.saturating_add(hedge_cost);

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

async fn health(State(app_state): State<AppState>) -> Json<serde_json::Value> {
    let state = app_state.state.read().await;
    Json(serde_json::json!({
        "status": "ok",
        "exchangeConnected": state.exchange_connected,
        "trackedPairs": state.pairs.len(),
        "fills": state.total_fills,
        "quotes": state.total_quotes,
    }))
}

