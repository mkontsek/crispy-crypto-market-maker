# Rust CLI Skill

## Scope

These instructions apply to Rust CLI tools and developer utilities inside this repo.

## Project Structure

- Use a dedicated `crates/cli-<name>` crate for each CLI. [web:21][web:27]
- Inside the crate:
    - `src/main.rs`: minimal entrypoint, argument parsing + top-level orchestration.
    - `src/lib.rs`: core logic, reusable from tests and other crates.
    - `src/cli.rs`: argument parsing/command definitions (e.g., using `clap`).
    - `src/config.rs`: configuration loading/merging from CLI args, env vars, and config files. [web:21]

## CLI UX

- Use a modern argument parser (e.g., `clap`, `argh`) with:
    - Subcommands for separate concerns.
    - Helpful `--help` output and examples.
- Provide clear error messages and non-zero exit codes on failure.
- Avoid noisy logs by default; add `--verbose` / `-v` flags for more detail. [web:27][web:30]

## Error Handling

- In libraries, use typed errors with `thiserror`. [web:24]
- In CLI frontends, `anyhow` is acceptable for flexible error handling and fast iteration. [web:24][web:27]
- Convert internal errors into user-friendly messages; avoid exposing raw backtraces unless in debug/verbose modes.

## Testing

- Unit test core logi
