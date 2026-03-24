# Rust Backend Skill

## Scope

These instructions apply to Rust HTTP/WebSocket backends that serve APIs for the Next.js dashboard or other clients.

## Architecture

- Each backend app crate is structured as:
    - `src/main.rs` — thin entry point: env/config loading, tracing init, server start.
    - `src/models.rs` — all request/response types, shared data structs.
    - `src/utils.rs` — pure helper functions (math, formatting).
    - `src/router/` — HTTP and WebSocket routers (see below).
    - `src/state/` — in-memory engine state (see below).
    - `src/db.rs` — database writes via `sqlx` (when applicable).
    - `src/init.rs` — startup configuration resolution.

## Router Layout

- One file per API endpoint inside `src/router/`:
    - Name each file after the endpoint, e.g. `api_set_strategy.rs`, `api_kill_switch.rs`, `api_update_config.rs`.
    - For endpoints that require internal helpers, use a sub-directory (e.g., `router/api_manual_hedge/`) with its own `mod.rs`.
    - `router/mod.rs` declares all sub-modules and re-exports only the public builder functions (e.g., `build_api_app`, `build_ws_app`).
- Each handler file exports exactly one `pub async fn` handler. **Do not use a `handle*` prefix.** Name the function after the action it performs, e.g. `kill_switch`, `set_strategy`, `pause_pair`.

## HTTP Layer (Axum 0.8.8)

- Use composable `Router::new().route(…).with_state(app_state)` to build routers.
- Use typed Axum extractors: `State<T>`, `Json<T>`, `Path<T>`, `Query<T>`.
- Centralize error handling via an error type implementing `IntoResponse` (e.g., `AppError`).
- Keep handlers thin: extract inputs, call state methods, return `Json(serde_json::json!({…}))`.
- No business logic in handlers — delegate to state or helper modules.

## State Layout

- Keep app state cheap to clone (e.g., wrap mutable state in `Arc<RwLock<…>>`). Typical fields:
    - `state: Arc<RwLock<…>>` — the mutable engine/domain state.
    - `stream_tx: broadcast::Sender<…>` — channel to push SSE/WS updates.
    - Additional fields for runtime config (e.g., external service URLs) and optional resources (e.g., DB pool).
- Split large state structs across multiple focused files under `src/state/`, e.g.:
    - `engine_state.rs` — struct definition + `new()` + high-level methods.
    - `engine_payload.rs` — logic for building the broadcast payload.
    - `engine_process_exchange.rs` — processing incoming exchange data.
    - `engine_reset.rs` — state reset logic.
    - `pair_state.rs` — per-pair state struct.
    - `mod.rs` — declares all sub-modules and re-exports the public types.

## Persistence

- DB writes are the backend service's responsibility, not the web app's.
- Use `sqlx` with a `PgPool` injected into the app state.
- The web app only reads from the DB (via Prisma).
- Configure via env vars (e.g., `DATABASE_URL`, `BOT_ID`).

## Configuration & Observability

- Load all configuration from environment variables (use `dotenvy` for local dev, system env in production).
- Use `tracing` for structured logging; initialize with `tracing-subscriber` in `main.rs`.
- Log important lifecycle events (server start, external service connect/disconnect, data received).

## Testing Backend Code

- Unit tests colocated inside each handler file with `#[cfg(test)] mod tests { ... }`.
- Integration tests (spinning up an in-memory Axum server) live in the router assembly file (e.g., `api_app.rs`) inside `#[cfg(test)]`.
- Helper pattern for integration tests:
    - `fn test_app_state(…) -> <YourAppState>` builds a minimal state.
    - `async fn spawn_api_server(…) -> (String, JoinHandle<()>)` binds to port 0 and returns the base URL.
    - Use `reqwest` to drive HTTP assertions.
    - Always `server.abort()` in cleanup.
- Test domain/application layers independently of HTTP when possible.
