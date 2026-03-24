# Rust Base Skill

## Scope

These instructions apply to all Rust crates in this repo (backend services, CLI tools, and libraries).

## Locked Versions

Use exact latest supported versions — do not upgrade unless explicitly requested. 
Example:

| Crate | Version |
|---|---|
| `axum` | 0.8.8 (features: `ws`, `macros`, `json`) |
| `tokio` | 1.50.0 (features: `full`) |
| `serde` | 1.0.228 (features: `derive`) |
| `serde_json` | 1.0.149 |
| `rust_decimal` | 1.40.0 (features: `serde-with-str`) |
| `rust_decimal_macros` | 1.40.0 |
| `sqlx` | 0.8.3 (features: `postgres`, `runtime-tokio`, `tls-rustls`) |
| `reqwest` | 0.13.2 (features: `json`) |
| `tracing` | 0.1.44 |
| `tracing-subscriber` | 0.3.22 (features: `fmt`, `env-filter`) |
| `thiserror` | latest stable |

## Crate Layout

- Apps live under `apps/`; shared libraries under `packages/`.
- Each app or library crate follows:
    - `src/main.rs` — thin entry point: config loading, tracing setup, server start. Delegates everything to library code.
    - `src/lib.rs` — not required for app crates, but use it for library crates to export a clean public API.

## Module Organization

- **One Rust source file per logical unit.** Do not pile multiple concerns into a single file.
- **Max 300 lines per `.rs` file** (enforced by `scripts/check-file-lines.sh`, excluding `tests/` and `*_test.rs` files). When a file approaches the limit, extract sub-logic into a sibling file.
- Group related files under a named subdirectory with a `mod.rs` that only declares sub-modules and re-exports the public API:

    ```
    router/
      mod.rs              ← declares sub-modules, re-exports `pub use ...`
      api_<action>.rs     ← e.g. api_set_strategy.rs, contains the handler function
      api_<action>.rs     ← e.g. api_kill_switch.rs, contains the handler function
    ```

- For a module that itself needs helpers, create a sub-subfolder with the same pattern:

    ```
    router/api_<action>/
      mod.rs              ← declares sub-modules + re-exports the public entry point
      api_<action>.rs     ← handler entry point (e.g. api_manual_hedge.rs)
      <helper>.rs         ← internal helper, not re-exported
    ```

- Split large state or domain objects across multiple focused files inside a named directory (e.g., `engine_state.rs`, `engine_payload.rs`, `pair_state.rs`), each under 300 lines. The directory's `mod.rs` only declares modules and re-exports.
- Name files after what they contain, using `snake_case`. Avoid generic names like `helpers.rs` — prefer a descriptive name that reflects the function (e.g., `apply_ratio.rs`).

## Naming Conventions

- **Do not use a `handle*` prefix for handler functions.** Name functions after the action they perform, e.g. `kill_switch`, `set_strategy`, `pause_pair`.
- Builder functions for routers or services are named `build_<thing>`, e.g. `build_api_app`, `build_ws_app`.

## Error Handling

- Use `Result<T, E>` with crate-specific typed error enums.
- Use `thiserror` in libraries for concise error definitions.
- Use `anyhow` only at top-level binaries or CLI tools.
- Do not use `unwrap()` / `expect()` in request paths or library code unless clearly safe.

## Testing

- Unit tests colocated inside modules with `#[cfg(test)] mod tests { ... }`.
- Integration / API-level tests can also live inside the same source file as the router assembly (e.g., spinning up an in-memory server inside `#[cfg(test)]`).
- Test public behavior, avoid testing private implementation details.
- Shared test utilities across crates belong in a dedicated `test-support` package (if needed).
- Test files and `tests/` directories are excluded from the 300-line rule.

## Tooling & Quality

- Enable `rustfmt` (`.rustfmt.toml`) and `clippy` (`clippy.toml`) for the workspace.
- Keep builds warning-free; fix lints instead of disabling them globally.
- Prefer safe Rust; use `unsafe` only with a clear inline comment on invariants.

## Things to Avoid

- God files containing unrelated concerns — split by the 300-line rule.
- Deep nested `mod.rs` hierarchies; prefer flat modules with explicit re-exports.
- Circular dependencies between crates; extract shared contracts into a shared library package.
- Overusing macros when traits/generics are sufficient.
