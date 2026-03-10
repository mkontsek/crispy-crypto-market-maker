# Testing Skill

## Scope

Applies to both TypeScript/Next.js and Rust crates in this monorepo.

## General Principles

- Prefer fast, focused tests that run in CI on every push/PR.
- Aim for meaningful coverage of critical paths (auth, payments, state transitions) rather than chasing a numeric coverage target.

## TypeScript / Next.js Testing

- Use:
    - Jest / Vitest (depending on repo config) for unit tests.
    - React Testing Library for React components.
- Co-locate tests:
    - `ComponentName.test.tsx` next to `ComponentName.tsx`.
    - `util.test.ts` next to `util.ts`.
- Mock:
    - Network boundaries (API clients, fetch wrappers).
    - Global browser APIs when needed.
- Don’t mock:
    - React internals.
    - Implementation details that make tests brittle (use behavior assertions instead).

## Rust Testing

- Unit tests colocated 
