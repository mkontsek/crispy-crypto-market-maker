use axum::{
    extract::ws::{Message, WebSocket},
    extract::{State, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
    Router,
};

use crate::state::AppState;

pub fn build_ws_app(app_state: AppState) -> Router {
    Router::new()
        .route("/stream", get(ws_stream_handler))
        .with_state(app_state)
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

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use futures_util::StreamExt;
    use tokio::{
        net::TcpListener,
        sync::{broadcast, RwLock},
        task::JoinHandle,
        time::{sleep, timeout, Duration},
    };
    use tokio_tungstenite::{connect_async, tungstenite::Message as WsMessage};

    use crate::state::EngineState;

    use super::build_ws_app;
    use crate::AppState;

    fn test_app_state() -> AppState {
        let (stream_tx, _) = broadcast::channel(8);
        AppState {
            state: Arc::new(RwLock::new(EngineState::new())),
            stream_tx,
            exchange_api_url: "http://127.0.0.1:3111".to_string(),
        }
    }

    async fn spawn_ws_server(app_state: AppState) -> (String, String, JoinHandle<()>) {
        let listener = TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind websocket test listener");
        let address = listener
            .local_addr()
            .expect("read websocket test listener address");
        let app = build_ws_app(app_state);
        let server = tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });

        sleep(Duration::from_millis(20)).await;

        (
            format!("http://{address}"),
            format!("ws://{address}/stream"),
            server,
        )
    }

    #[tokio::test]
    async fn stream_route_requires_websocket_upgrade() {
        let app_state = test_app_state();
        let (http_base_url, _ws_url, server) = spawn_ws_server(app_state).await;

        let response = reqwest::get(format!("{http_base_url}/stream"))
            .await
            .expect("request stream route");

        server.abort();
        let _ = server.await;

        assert!(response.status().is_client_error());
    }

    #[tokio::test]
    async fn stream_socket_sends_initial_payload_and_forwards_broadcasts() {
        let app_state = test_app_state();
        let (_http_base_url, ws_url, server) = spawn_ws_server(app_state.clone()).await;

        let (mut socket, _response) = connect_async(&ws_url).await.expect("connect websocket");

        let initial_message = timeout(Duration::from_secs(1), socket.next())
            .await
            .expect("timed out waiting for initial websocket message")
            .expect("websocket closed before initial message")
            .expect("failed to receive initial websocket message");
        let WsMessage::Text(initial_text) = initial_message else {
            panic!("expected initial websocket text message");
        };

        let initial_payload: serde_json::Value =
            serde_json::from_str(initial_text.as_ref()).expect("initial payload should be json");
        let quotes = initial_payload["quotes"]
            .as_array()
            .expect("quotes should be an array");
        assert_eq!(quotes.len(), 3);

        let expected_broadcast = r#"{"event":"tick"}"#.to_string();
        app_state
            .stream_tx
            .send(expected_broadcast.clone())
            .expect("broadcast message to subscribers");

        let forwarded_message = timeout(Duration::from_secs(1), socket.next())
            .await
            .expect("timed out waiting for forwarded websocket message")
            .expect("websocket closed before forwarded message")
            .expect("failed to receive forwarded websocket message");
        let WsMessage::Text(forwarded_text) = forwarded_message else {
            panic!("expected forwarded websocket text message");
        };
        assert_eq!(forwarded_text.to_string(), expected_broadcast);

        server.abort();
        let _ = server.await;
    }
}
