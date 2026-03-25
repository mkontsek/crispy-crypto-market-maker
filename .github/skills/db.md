# Database / Prisma Skill

## Scope

This skill defines database conventions for Prisma and Postgres across this monorepo.

## Location & Ownership

- Keep all Prisma source-of-truth data in `packages/db`:
    - `packages/db/prisma/schema.prisma`
    - `packages/db/prisma.config.ts`
    - `packages/db/src/` for Prisma client setup/export
- Do not create duplicate Prisma schemas in app packages.

## Canonical Workspace Scripts

Use these root-level script names for DB workflows:

- `db:generate`
- `db:dev:migrate`
- `db:prod:migrate`
- `db:dev:up`
- `db:dev:stop`
- `db:dev:reset`
- `db:dev:seed`
- `db:prod:seed`

These scripts should delegate to `@crispy/db` commands via `pnpm --filter @crispy/db ...`.

## Local Development DB (Docker)

- Use Docker Compose for local PostgreSQL lifecycle.
- Start local DB + apply dev schema with:
    - `pnpm run db:dev:up`
- Stop local DB container with:
    - `pnpm run db:dev:stop`
- If port `55432` is occupied, override host port at runtime:
    - `POSTGRES_HOST_PORT=55440 pnpm run db:dev:up`
- Keep local Docker DB settings development-only; production should use managed or separately provisioned Postgres.

## Environment Conventions

- `.env.example` contains development-safe defaults, including dev `DATABASE_URL`.
- `.env.prod.example` contains production placeholder values only.
- App-specific templates follow the same split:
    - `apps/web/.env.example` for dev values.
    - `apps/web/.env.prod.example` for production placeholders.
- Never commit real credentials or production secrets.

## Migration / Seeding Guidance

- Use `db:dev:migrate` for local development schema iteration.
- Use `db:prod:migrate` for production deploy migrations.
- Seed through `db:dev:seed` and `db:prod:seed`; keep seeds idempotent where possible.
- When introducing seed data, prefer realistic defaults that match shared domain constants (e.g., supported pairs/exchanges).
