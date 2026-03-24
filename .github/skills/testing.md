# Testing Skill

## Scope

Applies to both TypeScript/Next.js and Rust crates in this monorepo.

## General Principles

- Prefer fast, focused tests that run in CI on every push/PR.
- Aim for meaningful coverage of critical paths (state transitions, mutations, business logic) rather than chasing a numeric coverage target.
- Test public behavior, not private implementation details.
- Test files are excluded from the 300-line rule.

## TypeScript / Next.js Testing

- Use **Vitest** for all unit and integration tests. Run with `pnpm test` inside `apps/web`.
- Use **React Testing Library** for React components.
- **Test file location**: tests live in a `__tests__/` subdirectory beside the code they test:
    - `src/lib/__tests__/geo-service.test.ts` tests `src/lib/geo-service.ts`.
    - `src/components/dashboard/__tests__/use-strategy-mutation.test.ts` tests `src/components/dashboard/use-strategy-mutation.ts`.
- File names match the source file: `<source-name>.test.ts` / `<source-name>.test.tsx`.
- Mock:
    - Network boundaries: mock `fetch` or API client wrappers, not internal logic.
    - Global browser APIs (`localStorage`, `navigator.geolocation`) when needed.
    - Use `vi.fn()` / `vi.spyOn()` from Vitest.
- Don't mock:
    - React internals or framework code.
    - Implementation details that make tests brittle.
- For hook tests, wrap with a `QueryClientProvider` created fresh per test to avoid cache pollution.
- Always clean up mocks with `afterEach` (e.g., `vi.restoreAllMocks()`).

## Rust Testing

- **Unit tests**: colocate inside the module file with `#[cfg(test)] mod tests { ... }`.
- **Integration / API tests**: for route handlers, write tests inside the same handler file (e.g., `api_app.rs`) inside `#[cfg(test)]`:
    - Build a minimal `AppState` with a `fn test_app_state() -> AppState` helper.
    - Bind to port 0 with `TcpListener::bind("127.0.0.1:0")` for a free port.
    - Use `reqwest` to drive HTTP assertions against the live in-memory server.
    - Always `server.abort()` in cleanup.
- **Test naming**: use descriptive snake_case names that read as a sentence: `kill_switch_engage_pauses_all_pairs`, `set_strategy_aggressive_updates_config`.
- Each test should test one behavior — split scenarios into separate `#[tokio::test]` functions.
- Test files (`tests/` directories, `*_test.rs`, `*_tests.rs`) are excluded from the 300-line rule.
