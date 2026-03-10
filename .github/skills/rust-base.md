# Rust Base Skill

## Scope

These instructions apply to all Rust crates in this repo (backend services, CLI tools, libraries, and WASM crates).

## Workspace & Crate Layout

- Use a single top-level Cargo workspace, with crates under `crates/` (or `rust/crates/`) such as:
    - `crates/core`: domain types, business rules, pure logic.
    - `crates/api`: HTTP servers, routing, handlers (Axum/Actix/etc.). [web:18][web:19]
    - `crates/cli`: CLI tools or dev utilities. [web:21][web:27]
    - `crates/test-support`: shared test utilities (optional).
    - `crates/wasm-*`: WASM-compiled crates for frontend integration. [web:9]
- Each crate:
    - Library: `src/lib.rs` exports a clear public API.
    - Binary: `src/main.rs` is a thin entry that delegates to library code.
    - Multiple binaries: `src/bin/<name>.rs`.

## Module Organization

- Prefer explicit modules in `lib.rs`:
    - `pub mod domain;`
    - `pub mod application;`
    - `pub mod infrastructure;`
- Group modules by **domain/use-case**, not purely by layer:
    - Example: `orders`, `billing`, `auth`, each internally split into `domain`, `handlers`, etc. if needed. [web:18][web:20]
- Avoid deep, nested `mod.rs` trees for new code; use `mod foo;` with `foo.rs` or `foo/mod.rs` as needed.

## Error Handling

- Use `Result<T, E>` with crate-specific error enums.
- Use `thiserror` in libraries for concise error definitions. [web:24]
- Use `anyhow` only at top-level binaries or CLI tools where detailed typing is not as critical. [web:24][web:27]
- Do not use `unwrap()` / `expect()` in request paths or library code unless clearly safe and documented.

## Testing

- Unit tests:
    - Colocate inside modules with `#[cfg(test)] mod tests { ... }`.
    - Test public behavior, avoid overfitting to private implementation.
- Integration tests:
    - Use `tests/` directory with one file per scenario or feature.
    - For backend crates, write end-to-end tests that spin up in-memory/http servers where feasible. [web:18]
- Shared test utilities:
    - Move repeated fixtures/mocks into `crates/test-support` and depend on it from test targets.

## Tooling & Quality

- Enable `rustfmt` and `clippy` for the workspace (`rustfmt.toml`, `clippy.toml` or `Cargo.toml` settings).
- Keep builds warning-free; fix lints instead of disabling them globally.
- Prefer safe Rust; use `unsafe` only with a clear comment on invariants.

## Interop with TypeScript / Next.js

- For WASM-oriented crates:
    - Use `wasm-bindgen` or equivalent for bindings.
    - Keep the JS-visible API surface small and ergonomic (plain structs, simple enums).
- Expose explicit initialization functions and hide WASM module loading details behind TS helpers.

## Things to Avoid

- God crates containing unrelated concerns.
- Circular dependencies between crates; when this appears, extract shared contracts into separate crates. [web:19]
- Overusing macros when traits/generics are sufficient.
