use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};

use super::EngineState;

#[derive(Clone)]
pub struct AppState {
    pub state: Arc<RwLock<EngineState>>,
    pub stream_tx: broadcast::Sender<String>,
    pub exchange_api_url: String,
}
