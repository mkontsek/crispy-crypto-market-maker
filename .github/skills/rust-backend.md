# Rust Backend Skill

## Scope

These instructions apply to Rust HTTP/web backends (e.g., Axum, Actix Web, etc.) that serve APIs for Next.js or other clients.

## Architecture

- Follow a layered / clean architecture: [web:18][web:20]
    - **Domain**: entities, value objects, business rules, repository traits.
    - **Application**: use-cases/services orchestrating domain logic.
    - **Infrastructure**: DB adapters, HTTP clients, messaging, persistence.
    - **Presentation**: HTTP routing, handlers, middleware, request/response mappers.
- Dependencies flow inwards only:
    - Presentation → Application → Domain.
    - Infrastructure implements traits defined in Domain/Application, not the other way around.

## Crate Layout

- Suggestion:
    - `crates/core` or `crates/domain`: shared domain logic and traits.
    - `crates/api`: concrete HTTP server:
        - `src/main.rs`: bootstrap (config, observability, server start).
        - `src/lib.rs`: exposes `build_router`, `AppState`, etc.
        - `src/routes/`: route definitions/composition.
        - `src/handlers/`: HTTP handlers, thin adapters over application services. [web:17][web:18]
        - `src/middleware/`: auth, logging, tracing, rate limiting.
        - `src/config.rs`: configuration loading/validation.
        - `src/telemetry.rs`: logging, tracing, metrics.

## HTTP Layer

- Prefer **Axum**-style composable routers when framework choice is open:
    - Use extractors (`Path`, `Query`, `Json`, `State`) for typed handlers. [web:18]
    - Centralize error handling via an `AppError` implementing `IntoResponse`.
- Keep handlers small:
    - Parse input, call application service, map result to HTTP response.
    - No business logic in handlers.

## Persistence & External Services

- Define repository/service traits in domain/application crates.
- Implement them in infrastructure modules that depend on concrete crates (SQL clients, HTTP clients, queues). [web:18][web:19]
- Inject dependencies via constructors or builders at application startup.

## Configuration & Observability

- Load configuration from env variables + config files, validate early.
- Use structured logging (e.g., `tracing`) with fields for request IDs, user IDs when available.
- Provide metrics hooks for key operations (requests, DB queries, external calls).

## Testing Backend Code

- Unit test domain/application layers without HTTP/framework dependencies.
- Integration tests:
    - Spin up an in-memory or ephemeral instance (e.g., test database) and run HTTP-level tests.
    - Test error translation (e.g., domain error → HTTP 4xx/5xx) explicitly. [web:18]
