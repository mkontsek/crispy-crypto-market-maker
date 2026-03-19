use std::env;

use axum::{http::StatusCode, Json};
use serde::Deserialize;
use tracing::warn;

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

pub async fn geo() -> (StatusCode, Json<serde_json::Value>) {
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
                warn!("geo lookup failed with status {}", resp.status());
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
