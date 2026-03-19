use std::{env, sync::Arc, time::Duration};

use axum::{
    extract::ws::{Message, WebSocket},
    extract::{State, WebSocketUpgrade},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use tokio::{
    net::TcpListener,
    sync::{broadcast, RwLock},
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

    let app = Router::new()
        .route("/feed", get(ws_feed_handler))
        .route("/orders", post(place_order))
        .route("/health", get(health))
        .route("/geo", get(geo))
        .with_state(app_state.clone());

    let listener = TcpListener::bind("0.0.0.0:3111")
        .await
        .expect("bind exchange listener");

    info!("exchange feed listening on ws://0.0.0.0:3111/feed");
    info!("exchange api listening on http://0.0.0.0:3111");

    if let Err(err) = axum::serve(listener, app).await {
        error!("exchange server error: {err}");
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

const GEO_API_URL: &str = "https://ipwho.is/";

#[derive(Deserialize)]
struct IpWhoIsResponse {
    success: Option<bool>,
    message: Option<String>,
    latitude: Option<f64>,
    longitude: Option<f64>,
    city: Option<String>,
    country: Option<String>,
}

async fn geo() -> (StatusCode, Json<serde_json::Value>) {
    if let (Ok(lat_str), Ok(lng_str)) = (env::var("GEO_LAT"), env::var("GEO_LNG")) {
        if let (Ok(lat), Ok(lng)) = (lat_str.parse::<f64>(), lng_str.parse::<f64>()) {
            let mut resp = serde_json::json!({ "lat": lat, "lng": lng });
            if let Ok(label) = env::var("GEO_LABEL") {
                resp["label"] = serde_json::Value::String(label);
            }
            return (StatusCode::OK, Json(resp));
        }
    }
    match reqwest::get(GEO_API_URL).await {
        Ok(resp) => {
            if !resp.status().is_success() {
                tracing::warn!("geo lookup failed with status {}", resp.status());
                return (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(serde_json::json!({ "error": "geo lookup unavailable" })),
                );
            }
            match resp.json::<IpWhoIsResponse>().await {
                Ok(data) => {
                    if data.success == Some(false) {
                        let details = data
                            .message
                            .unwrap_or_else(|| "unknown provider error".to_string());
                        tracing::warn!("geo provider error: {details}");
                        return (
                            StatusCode::BAD_GATEWAY,
                            Json(serde_json::json!({ "error": "geo provider error" })),
                        );
                    }

                    let (lat, lng) = match (data.latitude, data.longitude) {
                        (Some(lat), Some(lng)) => (lat, lng),
                        _ => {
                            tracing::warn!("geo response missing coordinates");
                            return (
                                StatusCode::BAD_GATEWAY,
                                Json(
                                    serde_json::json!({ "error": "failed to parse geo response" }),
                                ),
                            );
                        }
                    };
                    let label = match (data.city, data.country) {
                        (Some(city), Some(country)) => format!("{city}, {country}"),
                        (Some(city), None) => city,
                        (None, Some(country)) => country,
                        (None, None) => "Unknown".to_string(),
                    };
                    (
                        StatusCode::OK,
                        Json(serde_json::json!({
                            "lat": lat,
                            "lng": lng,
                            "label": label,
                        })),
                    )
                }
                Err(err) => {
                    tracing::warn!("failed to parse geo response: {err}");
                    (
                        StatusCode::BAD_GATEWAY,
                        Json(serde_json::json!({ "error": "failed to parse geo response" })),
                    )
                }
            }
        }
        Err(err) => {
            tracing::warn!("geo lookup failed: {err}");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({ "error": "geo lookup unavailable" })),
            )
        }
    }
}
