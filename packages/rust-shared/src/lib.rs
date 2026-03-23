use std::env;

use axum::{http::StatusCode, Json};
use serde::Deserialize;
use tracing::warn;

const GEO_API_URL: &str = "https://ipwho.is/";

pub fn chrono_string() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    now.to_string()
}

#[derive(Deserialize)]
struct IpWhoIsResponse {
    success: Option<bool>,
    message: Option<String>,
    latitude: Option<f64>,
    longitude: Option<f64>,
    city: Option<String>,
    country: Option<String>,
}

pub async fn geo() -> (StatusCode, Json<serde_json::Value>) {
    if let Some(payload) = env_override_payload() {
        return (StatusCode::OK, Json(payload));
    }

    match reqwest::get(GEO_API_URL).await {
        Ok(resp) => {
            if !resp.status().is_success() {
                warn!("geo lookup failed with status {}", resp.status());
                return (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(serde_json::json!({ "error": "geo lookup unavailable" })),
                );
            }
            match resp.json::<IpWhoIsResponse>().await {
                Ok(data) => provider_response_to_http(data),
                Err(err) => {
                    warn!("failed to parse geo response: {err}");
                    (
                        StatusCode::BAD_GATEWAY,
                        Json(serde_json::json!({ "error": "failed to parse geo response" })),
                    )
                }
            }
        }
        Err(err) => {
            warn!("geo lookup failed: {err}");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({ "error": "geo lookup unavailable" })),
            )
        }
    }
}

fn env_override_payload() -> Option<serde_json::Value> {
    let (Ok(lat_str), Ok(lng_str)) = (env::var("GEO_LAT"), env::var("GEO_LNG")) else {
        return None;
    };

    let (Ok(lat), Ok(lng)) = (lat_str.parse::<f64>(), lng_str.parse::<f64>()) else {
        return None;
    };

    let mut resp = serde_json::json!({ "lat": lat, "lng": lng });
    if let Ok(label) = env::var("GEO_LABEL") {
        resp["label"] = serde_json::Value::String(label);
    }
    Some(resp)
}

fn provider_response_to_http(data: IpWhoIsResponse) -> (StatusCode, Json<serde_json::Value>) {
    if data.success == Some(false) {
        let details = data
            .message
            .unwrap_or_else(|| "unknown provider error".to_string());
        warn!("geo provider error: {details}");
        return (
            StatusCode::BAD_GATEWAY,
            Json(serde_json::json!({ "error": "geo provider error" })),
        );
    }

    let (lat, lng) = match (data.latitude, data.longitude) {
        (Some(lat), Some(lng)) => (lat, lng),
        _ => {
            warn!("geo response missing coordinates");
            return (
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({ "error": "failed to parse geo response" })),
            );
        }
    };
    let label = format_provider_label(data.city, data.country);
    (
        StatusCode::OK,
        Json(serde_json::json!({
            "lat": lat,
            "lng": lng,
            "label": label,
        })),
    )
}

fn format_provider_label(city: Option<String>, country: Option<String>) -> String {
    match (city, country) {
        (Some(city), Some(country)) => format!("{city}, {country}"),
        (Some(city), None) => city,
        (None, Some(country)) => country,
        (None, None) => "Unknown".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Mutex, OnceLock};

    fn env_guard() -> std::sync::MutexGuard<'static, ()> {
        static ENV_MUTEX: OnceLock<Mutex<()>> = OnceLock::new();
        ENV_MUTEX
            .get_or_init(|| Mutex::new(()))
            .lock()
            .expect("env mutex poisoned")
    }

    #[test]
    fn env_override_payload_returns_none_when_missing_values() {
        let _guard = env_guard();
        // SAFETY: Test serializes environment access via env_guard mutex.
        unsafe {
            env::remove_var("GEO_LAT");
            env::remove_var("GEO_LNG");
            env::remove_var("GEO_LABEL");
        }

        assert_eq!(env_override_payload(), None);
    }

    #[test]
    fn env_override_payload_parses_lat_lng_and_optional_label() {
        let _guard = env_guard();
        // SAFETY: Test serializes environment access via env_guard mutex.
        unsafe {
            env::set_var("GEO_LAT", "37.9838");
            env::set_var("GEO_LNG", "23.7275");
            env::set_var("GEO_LABEL", "Athens");
        }

        let payload = env_override_payload().expect("expected env payload");
        assert_eq!(payload["lat"], serde_json::json!(37.9838));
        assert_eq!(payload["lng"], serde_json::json!(23.7275));
        assert_eq!(payload["label"], serde_json::json!("Athens"));

        // SAFETY: Test serializes environment access via env_guard mutex.
        unsafe {
            env::remove_var("GEO_LAT");
            env::remove_var("GEO_LNG");
            env::remove_var("GEO_LABEL");
        }
    }

    #[test]
    fn provider_response_to_http_formats_city_country_label() {
        let data = IpWhoIsResponse {
            success: Some(true),
            message: None,
            latitude: Some(48.8566),
            longitude: Some(2.3522),
            city: Some("Paris".to_string()),
            country: Some("France".to_string()),
        };

        let (status, Json(payload)) = provider_response_to_http(data);
        assert_eq!(status, StatusCode::OK);
        assert_eq!(payload["lat"], serde_json::json!(48.8566));
        assert_eq!(payload["lng"], serde_json::json!(2.3522));
        assert_eq!(payload["label"], serde_json::json!("Paris, France"));
    }

    #[test]
    fn provider_response_to_http_rejects_missing_coordinates() {
        let data = IpWhoIsResponse {
            success: Some(true),
            message: None,
            latitude: None,
            longitude: Some(2.3522),
            city: None,
            country: Some("France".to_string()),
        };

        let (status, Json(payload)) = provider_response_to_http(data);
        assert_eq!(status, StatusCode::BAD_GATEWAY);
        assert_eq!(
            payload,
            serde_json::json!({ "error": "failed to parse geo response" })
        );
    }

    #[test]
    fn chrono_string_is_non_empty_and_numeric() {
        let ts = chrono_string();
        assert!(!ts.is_empty());
        assert!(ts.parse::<u128>().is_ok(), "timestamp is not numeric: {ts}");
    }
}
