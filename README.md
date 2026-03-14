# Crispy Crypto Market Maker

Crispy is a monorepo demo of a market-making platform with two Rust services and a Next.js BFF/frontend.

## Architecture

```
Web/Dashboard  ──────────►  Bot 1..N (market maker)  ──────────►  Exchange
(Next.js BFF)               wss://...  https://...               wss://...  https://...
```

- **Exchange** (`apps/exchange`): Simulates a crypto exchange with fake data generation.
  Can be swapped for a real exchange adapter that connects to Binance, Bybit, OKX, etc.
- **Bot** (`apps/bot`): Market maker bot that connects to the exchange, calculates quotes,
  places orders, tracks inventory, PnL and hedging. Exposes a WebSocket stream and HTTP
  command API consumed by the web frontend.
- **Web** (`apps/web`): Next.js 16 BFF + UI. Maintains runtime topology (initially 1 bot + exchange),
  supports adding more bots at runtime, relays bot streams, and provides URL configuration from the dashboard.

## Monorepo layout

```
.
├── apps
│   ├── exchange  # Rust (Axum + Tokio) simulated exchange — WS feed + order API
│   ├── bot       # Rust (Axum + Tokio) market maker bot — connects to exchange, exposes stream
│   └── web       # Next.js 16 App Router (BFF + UI)
├── packages
│   ├── config    # shared lint/ts config artifacts
│   ├── db        # Prisma schema + Prisma client export
│   └── shared    # shared TS types + Zod schemas/constants
├── infra
│   └── postgres  # PostgreSQL container image
├── turbo.json
└── pnpm-workspace.yaml
```

## Exchange interfaces

Default local-development addresses (override with `EXCHANGE_WS_URL` / `EXCHANGE_HTTP_URL`):

- WebSocket feed: `ws://127.0.0.1:8082/feed`
- HTTP order API: `http://127.0.0.1:8083`
  - `POST /orders` — place an order; returns fill result (fake mode: probability-based fill)
  - `GET /health`

## Bot interfaces

Default local-development addresses (override with `BOT_1_WS_URL` / `BOT_1_HTTP_URL`):

- WebSocket stream: `ws://127.0.0.1:8080/stream`
- HTTP command API: `http://127.0.0.1:8081`
  - `POST /config`
  - `POST /pairs/:id/pause`
  - `POST /hedge`
  - `GET /health`

## Web API routes

- `GET /api/quotes?botId=<bot-id>`
- `GET /api/fills?botId=<bot-id>`
- `GET /api/pnl?botId=<bot-id>`
- `GET /api/inventory?botId=<bot-id>`
- `POST /api/config?botId=<bot-id>`
- `POST /api/pairs/:id/pause?botId=<bot-id>`
- `POST /api/hedge?botId=<bot-id>`
- `GET /api/stream?botId=<bot-id>` (SSE fan-out from selected bot stream)
- `GET /api/topology` / `POST /api/topology` (runtime bot + exchange URLs)
- `GET /api/topology/exchange` (exchange URLs for bot bootstrap)

## Getting started

### Prerequisites

Install dependencies:

```bash
pnpm install
```

Git pre-commit hooks are installed automatically during `pnpm install`. If needed, you can
reinstall them manually:

```bash
pnpm hooks:install
```

Install `cargo-watch` for auto-reloading Rust services during development:

```bash
cargo install cargo-watch
```

Copy web env template for local development:

```bash
cp apps/web/.env.example apps/web/.env.local
```

### Development (watch mode)

**Option 1: All services in one command (background processes)**

```bash
pnpm run dev:all
```

**Option 2: Individual terminals with watch mode**

Terminal 1 (exchange with auto-reload):

```bash
pnpm run dev:exchange
```

Terminal 2 (bot with auto-reload):

```bash
pnpm run dev:bot
```

Terminal 3 (web with hot reload):

```bash
pnpm run dev:web
```

**Option 3: Manual mode (no auto-reload)**

```bash
cd apps/exchange && cargo run
cd apps/bot && cargo run
pnpm --filter @crispy/web dev
```

## Workspace scripts

```bash
# Development
pnpm dev            # Turbo parallel dev for web packages
pnpm dev:all        # All services (exchange + bot + web) in background
pnpm dev:exchange   # Exchange in watch mode
pnpm dev:bot        # Bot in watch mode
pnpm dev:web        # Web only in dev mode

# Build
pnpm build          # Turbo build for web packages
pnpm build:exchange # Exchange release build
pnpm build:bot      # Bot release build

# Quality
pnpm lint           # Turbo lint for web packages
pnpm lint:rust      # Clippy for Rust services
pnpm typecheck      # TypeScript type checking
pnpm test           # Full test suite (web + Rust services)
pnpm test:web       # Web tests (Vitest via Turbo)
pnpm test:rust      # Rust tests (exchange + bot)
pnpm check:lines    # Enforce 300-line file limit
pnpm check:precommit # Full pre-commit checks (lint + test + build all)
pnpm hooks:install   # Configure Git hooks to use .githooks/
```

## Deploying (recommended)

### 1) Web on Vercel

- Create a Vercel project with **Root Directory** set to `apps/web`.
- Vercel will automatically detect `pnpm` from the `pnpm-lock.yaml` file.
- Add environment variables:
  - `BOT_1_HTTP_URL`, `BOT_1_WS_URL` (initial bot endpoints)
  - `EXCHANGE_HTTP_URL`, `EXCHANGE_WS_URL` (exchange endpoints)
  - `ENGINE_HTTP_URL`, `ENGINE_WS_URL` remain supported as bot-1 aliases
  - `DATABASE_URL` (Postgres connection string)
- Deploy from Git or with CLI:

```bash
vercel
```

**Note**: The `vercel.json` in `apps/web` configures pnpm as the package manager and sets the correct build command for the monorepo.

### 2) Exchange as a container

Build and run:

```bash
docker build -t crispy-exchange ./apps/exchange
docker run --rm -p 8082:8082 -p 8083:8083 crispy-exchange
```

`apps/exchange/Dockerfile` exposes:
- `8082` WebSocket feed (`/feed`)
- `8083` HTTP API (`/orders`, `/health`)

### 3) Bot as a container

Build and run (point it at the exchange):

```bash
docker build -t crispy-bot ./apps/bot
docker run --rm \
  -e EXCHANGE_WS_URL=ws://exchange:8082/feed \
  -e EXCHANGE_API_URL=http://exchange:8083 \
  -p 8080:8080 -p 8081:8081 \
  crispy-bot
```

> **Note:** `http://` is safe here because `exchange` and `crispy-bot` communicate over a
> private Docker bridge network. Only the ports published via `-p` are accessible externally,
> and in a real production setup those would sit behind a TLS-terminating reverse proxy (see
> [Production topology](#production-topology) below).

Or let the bot fetch exchange URLs from web topology:

```bash
docker run --rm \
  -e WEB_TOPOLOGY_URL=https://web.your-domain.com \
  -p 8080:8080 -p 8081:8081 \
  crispy-bot
```

`apps/bot/Dockerfile` exposes:
- `8080` WebSocket stream (`/stream`)
- `8081` HTTP API (`/config`, `/pairs/:id/pause`, `/hedge`, `/health`)

### 4) PostgreSQL as a container (or managed DB)

For production, a managed Postgres service is recommended. For containerized/self-hosted usage:

```bash
docker build -t crispy-postgres ./infra/postgres
docker run --rm -p 5432:5432 -e POSTGRES_PASSWORD=change-me crispy-postgres
```

Use the resulting connection string as `DATABASE_URL`.

### Production topology

Best results come from:
- **Vercel** for `apps/web`
- **Container platform** (Fly.io/Render/ECS/Kubernetes) for `apps/exchange` and `apps/bot`
- **Managed Postgres** for persistence

Then set Vercel env vars to the bot and database endpoints.

### HTTP vs HTTPS

The bot and exchange services are **plain HTTP servers**. They do not manage TLS certificates
themselves. TLS termination is handled at the infrastructure layer:

- **Local development**: `http://` and `ws://` are fine — all traffic stays on `127.0.0.1`.
- **Deployed (remote)**: put the Rust services behind a **TLS-terminating reverse proxy or
  cloud load balancer** (e.g. Fly.io's built-in proxy, nginx, AWS ALB). The proxy accepts
  public `https://` / `wss://` connections and forwards plain HTTP to the containers over the
  private network.

The web app enforces this rule via the URL validation schema
(`packages/shared/src/schemas.ts`): any bot or exchange URL that is not `localhost` /
`127.0.0.1` / `::1` **must** use `https://` or `wss://` — the runtime topology API will
reject `http://` for remote hosts.
