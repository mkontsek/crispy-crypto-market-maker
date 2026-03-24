# Development Guidelines for Copilot

> **About this file (v1.1.0):** Lean version optimized for context efficiency. Core principles here; detailed patterns loaded on-demand via skills (Next.js, Rust, testing).
>
> **Architecture:**
>
> - `.github/copilot-instructions.md` (this file): Core philosophy + cross-cutting rules (~100 lines, always loaded).
> - `.github/skills/`: Detailed, stack-specific patterns (Next.js, Rust, testing) loaded on demand.

## Interaction Style

Before planning, quickly interview me to clarify requirements, constraints, and acceptance criteria. Ask focused questions when something is underspecified and the decision has meaningful trade-offs.

During execution, if you hit ambiguity or a design choice that affects DX, performance, or safety, pause and propose 2–3 options with pros/cons, then ask which to take.

## Project Context & Identity

- **Monorepo**: Turborepo with Next.js apps and Rust crates (workspaces).
- **Package management**: Use **pnpm** workspaces. Never use `npm` or `yarn`.

## Stack Overview

- **Frontend** (see `skills/nextjs-base.md`):
    - React (function components only), TypeScript, Next.js.
    - ShadCN UI, TanStack Query, Zustand (+ immer), React Hook Form v7, Zod.
    - Prisma for persistence, `date-fns` for dates, `lodash` (per-method imports).

- **Rust** (see `skills/rust-base.md`, `skills/rust-backend.md`, `skills/rust-cli.md`):
    - Use **Rust 2024+** edition.
    - Prefer **workspace layout** for multiple crates:
        - Root `Cargo.toml` defines `[workspace]` and shared dev-dependencies.
        - Place crates under `rust/crates/` or `crates/` (e.g., `crates/api`, `crates/core`, `crates/cli`). [web:3][web:11][web:12]
    - For Web/Next integration, consider WASM crates when appropriate; keep them in dedicated crates (e.g., `crates/wasm-*`) and expose JS bindings via `wasm-bindgen`. [web:9]

## Infrastructure & Third-party Services

- **Billing / Payments**: Stripe for all payments.
    - Prefer Stripe Checkout for hosted flows.
    - Client SDK only for non-sensitive logic; keep secrets in backend or serverless functions.

- **Deployment / Hosting**:
    - Next.js apps on **Vercel** (stateless, fast builds, env via Vercel dashboard).
    - Rust services:
        - Either deployed as separate services (e.g., containerized) or behind serverless adapters.
        - Ensure configuration via env vars; never commit secrets.

- **Assets / Backgrounds**:
    - Use **Midjourney** for generative backgrounds.
    - Store compiled assets under `public/assets/<feature>/`.
    - Keep prompts/metadata in docs (e.g., `/docs/asset-guides.md`), not in source control.

## Cross-cutting Coding Standards

- **Naming Conventions**:
    - **kebab-case**: folders, packages, `data-cy` attributes.
    - **camelCase**: variables, functions, hooks.
    - **PascalCase**: React components, TS types, classes, service files.
    - **UPPER_CASE**: constants.
    - **Folders**: plural for collections (e.g., `hooks/`, `helpers/`).
    - **Styles**: `PascalCase.module.scss`.

- **Imports**:
    - Within the same package/crate, prefer relative imports.
    - Cross-package (TS): use path aliases (e.g., `@business/feature-core`), never deep import `src` of another package.
    - Prefer named imports and tree-shakeable usage (avoid `import * as` unless needed).

- **Security**:
    - Sanitize URL params and user input via a `sanitize()` utility (TS) or dedicated validation layer (Rust) before use in HTML, SQL, or shell commands.
    - Do not log secrets or full tokens.

- **Assets**:
    - UI assets: `public/assets/<feature>/`.
    - Proxied / dynamic content: `public/img/`.
    - Prefer **SVG** for UI icons and simple illustrations.

- **Forms**:
    - Use **Zod** schemas + React Hook Form.
    - Keep form value shapes flat and UI-centric; map to/from API DTOs via mappers.
    - Map backend validation errors to fields via a violation-mapper util.
    - For cross-field logic, use `useWatch`.

## Rust-specific Standards (Monorepo)

> Detailed patterns live in `skills/rust-base.md` etc.; here are the high-level rules.

- **Workspace & Layout**:
    - Prefer a **single top-level workspace** with Rust crates under `crates/` or `rust/crates/`:
        - `crates/core` – domain logic, types, pure functions (no IO).
        - `crates/api` – HTTP services, handlers, framework wiring.
        - `crates/cli` – tools/maintenance CLIs.
        - `crates/wasm-*` – WASM-compiled crates for FE integration. [web:3][web:11][web:12]
    - Each crate under `src/`:
        - Library crate: `src/lib.rs` exports a coherent API.
        - Binary crate: `src/main.rs` is thin, delegates to lib crate.
        - For multiple binaries: `src/bin/<name>.rs`. [web:5][web:14]

- **Modules & Organization**:
    - Prefer **flat modules with explicit `mod`/`pub use` in `lib.rs`** over nested `mod.rs` hierarchies for new code. [web:3][web:8][web:14]
    - Group by domain/feature rather than technical layer:
        - Example: `domain`, `application`, `infrastructure`, `config`, `telemetry`.
    - Use feature flags for optional integrations, not separate crates, unless reuse or compilation time justifies it.

- **Error Handling**:
    - Use `Result<T, E>` with typed error enums per crate; avoid `Box<dyn Error>` at boundaries.
    - Use `thiserror` for ergonomic error definitions in library crates.
    - Map internal errors to transport-level errors (HTTP status, CLI exit codes) in boundary layers only.

- **Testing**:
    - Unit tests colocated in modules with `#[cfg(test)] mod tests;`.
    - Integration tests under `tests/` with descriptive filenames.
    - Prefer tests against public APIs, not private internals.
    - Use workspaces to share test utilities via a `test-support` crate if needed. [web:11]

- **Performance & Safety**:
    - Prefer **safe Rust**; reach for `unsafe` only with a documented justification and invariants.
    - Avoid premature micro-optimizations; profile first.
    - Use `clippy` and `rustfmt` with workspace-level configs; keep builds warning-free.

- **Interop with TS/Next**:
    - For WASM:
        - Keep the Rust API small and focused; expose simple types compatible with JS (strings, numbers, plain structs).
        - Add a thin TS wrapper that hides WASM initialization details from React code. [web:9]

## TypeScript / React Standards (recap)

- **TS**:
    - Prefer string union types over `enum` (better interop and tree-shaking).
- **JSX/TSX**:
    - Avoid multiline ternaries; use `&&` or extracted components.
    - Avoid inline styles; use CSS modules/utility classes.
    - Keys: use stable IDs; `useId()` only as last resort; never `lodash.uniqueId()`.

- **State & Data**:
    - TanStack Query for async data (`staleTime: 0`, `refetch` on failure, `invalidateQueries` on mutation).
    - Zustand (+ immer) for global/shared app state with dedicated stores.
    - React Context only for truly cross-cutting concerns; expose via typed hooks that throw when misused.

## Workflow & Commits

- **Git Branching**:
    - Use `<type>/<ticket-number>` (e.g., `feat/XXX-1234`), where `type ∈ {refactor, feat, test, chore, fix}`.

- **Commit Messages**:
    - Format: `<type>: <ticket-number> <description>`.
    - Follow Conventional Commits semantics.

- **Pull Requests**:
    - Rebase onto `main`; never merge `main` into feature branches.
    - Merge via `merge please` comment.
    - Target PR size ≈ 300 LOC; split larger work into multiple PRs.

## Living Documentation

Skill files in `.github/skills/` should emerge from real corrections and patterns.

- When you see repeated feedback or explicit conventions, propose updating a specific skill file (show a small diff).
- Keep each update focused on a single concern (e.g., “Rust error handling”, “Next.js data fetching”).
- Wait for approval before assuming a new pattern is canonical.
