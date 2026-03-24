# Rust CLI Skill

## Scope

These instructions apply to Rust CLI tools and developer utilities inside this repo.

## Project Structure

- Use a dedicated crate for each CLI tool (e.g., `crates/cli-<name>` or `packages/<name>`).
- Inside the crate:
    - `src/main.rs` — minimal entry point: argument parsing + top-level orchestration.
    - `src/lib.rs` — core logic, reusable from tests and other crates.
    - `src/cli.rs` — argument parsing/command definitions (e.g., using `clap`).
    - `src/config.rs` — configuration loading/merging from CLI args, env vars, and config files.
- Apply the same **max 300 lines per file** rule. Split by extracting sub-commands or helpers.

## Naming

- **Do not use a `handle*` prefix.** Name functions after the action: `run_migrate`, `sync_config`, `build_topology`.

## CLI UX

- Use a modern argument parser (e.g., `clap`) with:
    - Subcommands for separate concerns.
    - Helpful `--help` output and examples.
- Provide clear error messages and non-zero exit codes on failure.
- Avoid noisy output by default; add `--verbose` / `-v` flags for more detail.

## Error Handling

- In library crates, use typed errors with `thiserror`.
- In CLI frontends, `anyhow` is acceptable for flexible error handling.
- Convert internal errors into user-friendly messages; avoid exposing raw backtraces unless in verbose mode.

## Testing

- Unit tests colocated inside modules with `#[cfg(test)] mod tests { ... }`.
- Test core logic in `lib.rs`; keep `main.rs` thin and untested.
- Use `assert_cmd` or similar crates for end-to-end CLI tests when useful.
