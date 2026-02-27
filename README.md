# Crispy Crypto Market Maker

Crispy is a monorepo demo of a market-making platform with a Rust engine and a Next.js BFF/frontend.

## Monorepo layout

```
.
├── apps
│   ├── engine   # Rust (Axum + Tokio) stream + command API
│   └── web      # Next.js 16 App Router (BFF + UI)
├── packages
│   ├── config   # shared lint/ts config artifacts
│   ├── db       # Prisma schema + Prisma client export
│   └── shared   # shared TS types + Zod schemas/constants
├── infra
│   └── postgres # PostgreSQL container image
├── turbo.json
└── pnpm-workspace.yaml
```

## Engine interfaces

- WebSocket stream: `ws://127.0.0.1:8080/stream`
- HTTP command API: `http://127.0.0.1:8081`
  - `POST /config`
  - `POST /pairs/:id/pause`
  - `POST /hedge`

## Web API routes

- `GET /api/quotes`
- `GET /api/fills`
- `GET /api/pnl`
- `GET /api/inventory`
- `POST /api/config`
- `POST /api/pairs/:id/pause`
- `POST /api/hedge`
- `GET /api/stream` (SSE fan-out from engine stream)

## Getting started

```bash
pnpm install
```

Terminal 1:

```bash
cd apps/engine
cargo run
```

Terminal 2:

```bash
pnpm --filter @crispy/web dev
```

Copy web env template for local development:

```bash
cp apps/web/.env.example apps/web/.env.local
```

## Workspace scripts

```bash
pnpm dev
pnpm lint
pnpm build
pnpm typecheck
```

## Deploying (recommended)

### 1) Web on Vercel

- Create a Vercel project with **Root Directory** set to `apps/web`.
- Vercel will automatically detect `pnpm` from the `pnpm-lock.yaml` file.
- Add environment variables:
  - `ENGINE_HTTP_URL` (for example `https://engine.your-domain.com`)
  - `ENGINE_WS_URL` (for example `wss://engine.your-domain.com/stream`)
  - `DATABASE_URL` (Postgres connection string)
- Deploy from Git or with CLI:

```bash
vercel
```

**Note**: The `vercel.json` in `apps/web` configures pnpm as the package manager and sets the correct build command for the monorepo.

### 2) Rust engine as a container

Build and run:

```bash
docker build -t crispy-engine ./apps/engine
docker run --rm -p 8080:8080 -p 8081:8081 crispy-engine
```

`apps/engine/Dockerfile` exposes:
- `8080` WebSocket stream (`/stream`)
- `8081` HTTP API (`/config`, `/pairs/:id/pause`, `/hedge`, `/health`)

### 3) PostgreSQL as a container (or managed DB)

For production, a managed Postgres service is recommended. For containerized/self-hosted usage:

```bash
docker build -t crispy-postgres ./infra/postgres
docker run --rm -p 5432:5432 -e POSTGRES_PASSWORD=change-me crispy-postgres
```

Use the resulting connection string as `DATABASE_URL`.

### Production topology

Best results come from:
- **Vercel** for `apps/web`
- **Container platform** (Fly.io/Render/ECS/Kubernetes) for `apps/engine`
- **Managed Postgres** for persistence

Then set Vercel env vars to the engine and database endpoints.
