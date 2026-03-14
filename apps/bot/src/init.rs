use serde::Deserialize;
use tracing::warn;

const DEFAULT_EXCHANGE_WS_URL: &str = "ws://127.0.0.1:8082/feed";
const DEFAULT_EXCHANGE_API_URL: &str = "http://127.0.0.1:8083";

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExchangeTopologyResponse {
    exchange_ws_url: String,
    exchange_http_url: String,
}

fn env_non_empty(name: &str) -> Option<String> {
    std::env::var(name)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn exchange_topology_endpoint(raw: &str) -> String {
    let trimmed = raw.trim().trim_end_matches('/');
    if trimmed.ends_with("/api/topology/exchange") {
        trimmed.to_string()
    } else {
        format!("{trimmed}/api/topology/exchange")
    }
}

pub async fn resolve_exchange_endpoints() -> (String, String) {
    let exchange_ws_url = env_non_empty("EXCHANGE_WS_URL");
    let exchange_api_url = env_non_empty("EXCHANGE_API_URL");

    if let (Some(ws_url), Some(api_url)) = (&exchange_ws_url, &exchange_api_url) {
        return (ws_url.clone(), api_url.clone());
    }

    if let Some(topology_base_url) = env_non_empty("WEB_TOPOLOGY_URL") {
        let topology_endpoint = exchange_topology_endpoint(&topology_base_url);
        match reqwest::get(&topology_endpoint).await {
            Ok(response) => match response.error_for_status() {
                Ok(ok_response) => match ok_response.json::<ExchangeTopologyResponse>().await {
                    Ok(topology) => {
                        let resolved_ws = exchange_ws_url
                            .unwrap_or_else(|| topology.exchange_ws_url.trim().to_string());
                        let resolved_api = exchange_api_url
                            .unwrap_or_else(|| topology.exchange_http_url.trim().to_string());
                        return (resolved_ws, resolved_api);
                    }
                    Err(err) => {
                        warn!("failed to parse topology exchange response: {err}");
                    }
                },
                Err(err) => {
                    warn!("topology exchange endpoint returned non-success status: {err}");
                }
            },
            Err(err) => {
                warn!("failed to fetch topology exchange endpoint: {err}");
            }
        }
    }

    (
        exchange_ws_url.unwrap_or_else(|| DEFAULT_EXCHANGE_WS_URL.to_string()),
        exchange_api_url.unwrap_or_else(|| DEFAULT_EXCHANGE_API_URL.to_string()),
    )
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;

    use axum::{routing::get, Json, Router};
    use tokio::net::TcpListener;

    use super::{exchange_topology_endpoint, resolve_exchange_endpoints};

    static ENV_LOCK: Mutex<()> = Mutex::new(());

    struct EnvSnapshot {
        exchange_ws_url: Option<String>,
        exchange_api_url: Option<String>,
        web_topology_url: Option<String>,
    }

    impl EnvSnapshot {
        fn capture() -> Self {
            Self {
                exchange_ws_url: std::env::var("EXCHANGE_WS_URL").ok(),
                exchange_api_url: std::env::var("EXCHANGE_API_URL").ok(),
                web_topology_url: std::env::var("WEB_TOPOLOGY_URL").ok(),
            }
        }
    }

    impl Drop for EnvSnapshot {
        fn drop(&mut self) {
            restore_env_var("EXCHANGE_WS_URL", self.exchange_ws_url.clone());
            restore_env_var("EXCHANGE_API_URL", self.exchange_api_url.clone());
            restore_env_var("WEB_TOPOLOGY_URL", self.web_topology_url.clone());
        }
    }

    fn restore_env_var(name: &str, value: Option<String>) {
        match value {
            Some(value) => {
                std::env::set_var(name, value);
            }
            None => {
                std::env::remove_var(name);
            }
        }
    }

    fn set_env_var(name: &str, value: &str) {
        std::env::set_var(name, value);
    }

    fn unset_env_var(name: &str) {
        std::env::remove_var(name);
    }

    async fn spawn_topology_server() -> (String, tokio::task::JoinHandle<()>) {
        let listener = TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind topology test listener");
        let address = listener.local_addr().expect("read topology listener addr");

        let app = Router::new().route(
            "/api/topology/exchange",
            get(|| async {
                Json(serde_json::json!({
                    "exchangeWsUrl": "ws://topology.example/feed",
                    "exchangeHttpUrl": "http://topology.example",
                }))
            }),
        );

        let server = tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });

        (format!("http://{address}"), server)
    }

    #[test]
    fn exchange_topology_endpoint_appends_suffix() {
        assert_eq!(
            exchange_topology_endpoint("http://localhost:3000"),
            "http://localhost:3000/api/topology/exchange"
        );
    }

    #[test]
    fn exchange_topology_endpoint_preserves_suffix() {
        assert_eq!(
            exchange_topology_endpoint("http://localhost:3000/api/topology/exchange/"),
            "http://localhost:3000/api/topology/exchange"
        );
    }

    #[tokio::test]
    async fn resolve_exchange_endpoints_prefers_explicit_env_vars() {
        let _lock = ENV_LOCK.lock().expect("lock env");
        let _snapshot = EnvSnapshot::capture();

        set_env_var("EXCHANGE_WS_URL", "ws://explicit.exchange/feed");
        set_env_var("EXCHANGE_API_URL", "http://explicit.exchange");
        set_env_var("WEB_TOPOLOGY_URL", "not a url");

        let (ws_url, api_url) = resolve_exchange_endpoints().await;

        assert_eq!(ws_url, "ws://explicit.exchange/feed");
        assert_eq!(api_url, "http://explicit.exchange");
    }

    #[tokio::test]
    async fn resolve_exchange_endpoints_uses_topology_for_missing_values() {
        let _lock = ENV_LOCK.lock().expect("lock env");
        let _snapshot = EnvSnapshot::capture();
        let (topology_base_url, topology_server) = spawn_topology_server().await;

        set_env_var("EXCHANGE_WS_URL", "ws://explicit.exchange/feed");
        unset_env_var("EXCHANGE_API_URL");
        set_env_var("WEB_TOPOLOGY_URL", &format!("{topology_base_url}/"));

        let (ws_url, api_url) = resolve_exchange_endpoints().await;
        topology_server.abort();
        let _ = topology_server.await;

        assert_eq!(ws_url, "ws://explicit.exchange/feed");
        assert_eq!(api_url, "http://topology.example");
    }

    #[tokio::test]
    async fn resolve_exchange_endpoints_falls_back_to_defaults_on_topology_error() {
        let _lock = ENV_LOCK.lock().expect("lock env");
        let _snapshot = EnvSnapshot::capture();

        unset_env_var("EXCHANGE_WS_URL");
        unset_env_var("EXCHANGE_API_URL");
        set_env_var("WEB_TOPOLOGY_URL", "not a url");

        let (ws_url, api_url) = resolve_exchange_endpoints().await;

        assert_eq!(ws_url, "ws://127.0.0.1:8082/feed");
        assert_eq!(api_url, "http://127.0.0.1:8083");
    }
}
