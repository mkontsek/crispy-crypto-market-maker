use axum::{http::StatusCode, Json};
use serde::Deserialize;
use tracing::warn;

const GEO_API_URL: &str = "https://ipapi.co/json/";

#[derive(Deserialize)]
struct IpGeoResponse {
    latitude: f64,
    longitude: f64,
    city: Option<String>,
    country_name: Option<String>,
}

pub async fn geo() -> (StatusCode, Json<serde_json::Value>) {
    match reqwest::get(GEO_API_URL).await {
        Ok(resp) => match resp.json::<IpGeoResponse>().await {
            Ok(data) => {
                let label = match (data.city, data.country_name) {
                    (Some(city), Some(country)) => format!("{city}, {country}"),
                    (Some(city), None) => city,
                    (None, Some(country)) => country,
                    (None, None) => "Unknown".to_string(),
                };
                (
                    StatusCode::OK,
                    Json(serde_json::json!({
                        "lat": data.latitude,
                        "lng": data.longitude,
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
        },
        Err(err) => {
            warn!("geo lookup failed: {err}");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({ "error": "geo lookup unavailable" })),
            )
        }
    }
}
