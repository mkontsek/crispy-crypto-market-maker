# Rust Backend Skill

## Scope

These instructions apply to Rust HTTP/WebSocket backends (`apps/bot`, `apps/exchange`) that serve APIs for the Next.js dashboard or the exchange simulator.

## Architecture

- Two separate app crates: `apps/bot` (market-maker logic + API) and `apps/exchange` (simulated exchange).
- Each app is structured as:
    - `src/main.rs` — thin entry point: env/config loading, tracing init, Axum server start.
    - `src/models.rs` — all request/response types, shared data structs.
    - `src/utils.rs` — pure helper functions (math, formatting).
    - `src/router/` — HTTP and WebSocket routers (see below).
    - `src/state/` — in-memory engine state (see below).
    - `src/db.rs` — database writes via `sqlx` (bot only).
    - `src/init.rs` — startup configuration resolution.
    - `src/exchange/` — exchange connectivity (bot only).

## Router Layout

- One file per API endpoint inside `src/router/`:
    - Name each file after the endpoint: `api_set_strategy.rs`, `api_kill_switch.rs`, `api_update_config.rs`, `api_pause_pair.rs`, `api_reset_state.rs`, `api_health.rs`.
    - For endpoints that require internal helpers, use a sub-directory (e.g., `router/api_manual_hedge/`) with its own `mod.rs`.
    - `router/mod.rs` declares all sub-modules and re-exports only the two public builder functions: `build_api_app` and `build_ws_app`.
- Each handler file exports exactly one `pub async fn` handler. **Do not use a `handle*` prefix.** Name the function after the action: `kill_switch`, `set_strategy`, `manual_hedge`, `pause_pair`, `update_config`, `reset_state`.

## HTTP Layer (Axum 0.8.8)

- Use composable `Router::new().route(…).with_state(app_state)` to build routers.
- Use typed Axum extractors: `State<AppState>`, `Json<T>`, `Path<T>`, `Query<T>`.
- Centralize error handling via an `AppError` type implementing `IntoResponse`.
- Keep handlers thin: extract inputs, call state methods, return `Json(serde_json::json!({…}))`.
- No business logic in handlers — delegate to `EngineState` methods or helper modules.

## State Layout

- `AppState` (cheap to clone via `Arc<RwLock<EngineState>>`) holds:
    - `state: Arc<RwLock<EngineState>>` — the mutable engine state.
    - `stream_tx: broadcast::Sender<…>` — channel to push SSE/WS updates.
    - `exchange_api_url: String` — runtime-resolved exchange endpoint.
    - `db_pool: Option<sqlx::PgPool>` — optional DB pool (bot only).
- `EngineState` is split across multiple focused files under `src/state/`:
    - `engine_state.rs` — struct definition + `new()` + high-level methods.
    - `engine_payload.rs` — logic for building the broadcast payload.
    - `engine_process_exchange.rs` — processing incoming exchange fills.
    - `engine_update_quotes.rs` — quote refresh logic.
    - `engine_reset.rs` — state reset logic.
    - `engine_simulate_exchange_health.rs` — simulated health checks.
    - `pair_state.rs` — per-pair state struct.
    - `strategy.rs` — strategy preset definitions and config builders.
    - `mod.rs` — declares all sub-modules and re-exports `AppState`, `EngineState`, `PairState`.

## Persistence

- DB writes (fills, quotes, inventory, PnL) are the bot's responsibility via `apps/bot/src/db.rs` using `sqlx`.
- The web app only reads from the DB (via Prisma).
- Set `DATABASE_URL` and `BOT_ID` in the bot's env file.

## Configuration & Observability

- Load all configuration from environment variables (use `dotenvy` for local dev, system env in production).
- Use `tracing` for structured logging; initialize with `tracing-subscriber` in `main.rs`.
- Log important lifecycle events (server start, exchange connect/disconnect, fill received).

## Testing Backend Code

- Unit tests colocated inside each handler file with `#[cfg(test)] mod tests { ... }`.
- Integration tests (spinning up an in-memory Axum server) live in `src/router/api_app.rs` inside `#[cfg(test)]`.
- Helper pattern for integration tests:
    - `fn test_app_state(…) -> AppState` builds a minimal state.
    - `async fn spawn_api_server(…) -> (String, JoinHandle<()>)` binds to port 0 and returns the base URL.
    - Use `reqwest` to drive HTTP assertions.
    - Always `server.abort()` in cleanup.
- Test domain/application layers independently of HTTP when possible.
