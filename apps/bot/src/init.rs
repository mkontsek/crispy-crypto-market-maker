const DEFAULT_EXCHANGE_WS_URL: &str = "ws://127.0.0.1:3111/feed";
const DEFAULT_EXCHANGE_API_URL: &str = "http://127.0.0.1:3111";

fn env_non_empty(name: &str) -> Option<String> {
    std::env::var(name)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

pub fn resolve_exchange_endpoints() -> (String, String) {
    (
        env_non_empty("EXCHANGE_WS_URL").unwrap_or_else(|| DEFAULT_EXCHANGE_WS_URL.to_string()),
        env_non_empty("EXCHANGE_API_URL").unwrap_or_else(|| DEFAULT_EXCHANGE_API_URL.to_string()),
    )
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;

    use super::resolve_exchange_endpoints;

    static ENV_LOCK: Mutex<()> = Mutex::new(());

    struct EnvSnapshot {
        exchange_ws_url: Option<String>,
        exchange_api_url: Option<String>,
    }

    impl EnvSnapshot {
        fn capture() -> Self {
            Self {
                exchange_ws_url: std::env::var("EXCHANGE_WS_URL").ok(),
                exchange_api_url: std::env::var("EXCHANGE_API_URL").ok(),
            }
        }
    }

    impl Drop for EnvSnapshot {
        fn drop(&mut self) {
            restore_env_var("EXCHANGE_WS_URL", self.exchange_ws_url.clone());
            restore_env_var("EXCHANGE_API_URL", self.exchange_api_url.clone());
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

    #[test]
    fn resolve_exchange_endpoints_prefers_explicit_env_vars() {
        let _lock = ENV_LOCK.lock().expect("lock env");
        let _snapshot = EnvSnapshot::capture();

        set_env_var("EXCHANGE_WS_URL", "ws://explicit.exchange/feed");
        set_env_var("EXCHANGE_API_URL", "http://explicit.exchange");

        let (ws_url, api_url) = resolve_exchange_endpoints();

        assert_eq!(ws_url, "ws://explicit.exchange/feed");
        assert_eq!(api_url, "http://explicit.exchange");
    }

    #[test]
    fn resolve_exchange_endpoints_uses_defaults_for_missing_values() {
        let _lock = ENV_LOCK.lock().expect("lock env");
        let _snapshot = EnvSnapshot::capture();

        unset_env_var("EXCHANGE_WS_URL");
        unset_env_var("EXCHANGE_API_URL");

        let (ws_url, api_url) = resolve_exchange_endpoints();

        assert_eq!(ws_url, "ws://127.0.0.1:3111/feed");
        assert_eq!(api_url, "http://127.0.0.1:3111");
    }

    #[test]
    fn resolve_exchange_endpoints_supports_partial_env_overrides() {
        let _lock = ENV_LOCK.lock().expect("lock env");
        let _snapshot = EnvSnapshot::capture();

        set_env_var("EXCHANGE_WS_URL", "ws://explicit.exchange/feed");
        unset_env_var("EXCHANGE_API_URL");

        let (ws_url, api_url) = resolve_exchange_endpoints();

        assert_eq!(ws_url, "ws://explicit.exchange/feed");
        assert_eq!(api_url, "http://127.0.0.1:3111");
    }
}
