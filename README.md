# Crispy Crypto Market Maker

Crispy is a monorepo demo of a market-making platform with two Rust services and a Next.js BFF/frontend.

## Architecture

```
Web/Dashboard  ──────────►  Bot 1 (market maker)  ──────────►  Exchange
(Next.js BFF)               ws://8080   http://8081           ws://8082  http://8083
       │
       └───────────────►  Bot 2 (market maker)
                          ws://9080   http://9081
```

- **Exchange** (`apps/exchange`): Simulates a crypto exchange with fake data generation.
  Can be swapped for a real exchange adapter that connects to Binance, Bybit, OKX, etc.
- **Bot** (`apps/bot`): Market maker bot that connects to the exchange, calculates quotes,
  places orders, tracks inventory, PnL and hedging. Exposes a WebSocket stream and HTTP
  command API consumed by the web frontend.
- **Web** (`apps/web`): Next.js 16 BFF + UI. Maintains runtime topology (2 bots + exchange),
  relays both bot streams, and provides URL configuration from the dashboard.

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

- WebSocket feed: `ws://127.0.0.1:8082/feed`
- HTTP order API: `http://127.0.0.1:8083`
  - `POST /orders` — place an order; returns fill result (fake mode: probability-based fill)
  - `GET /health`

## Bot interfaces

- WebSocket stream: `ws://127.0.0.1:8080/stream`
- HTTP command API: `http://127.0.0.1:8081`
  - `POST /config`
  - `POST /pairs/:id/pause`
  - `POST /hedge`
  - `GET /health`

## Web API routes

- `GET /api/quotes?botId=bot-1|bot-2`
- `GET /api/fills?botId=bot-1|bot-2`
- `GET /api/pnl?botId=bot-1|bot-2`
- `GET /api/inventory?botId=bot-1|bot-2`
- `POST /api/config?botId=bot-1|bot-2`
- `POST /api/pairs/:id/pause?botId=bot-1|bot-2`
- `POST /api/hedge?botId=bot-1|bot-2`
- `GET /api/stream?botId=bot-1|bot-2` (SSE fan-out from selected bot stream)
- `GET /api/topology` / `POST /api/topology` (runtime bot + exchange URLs)
- `GET /api/topology/exchange` (exchange URLs for bot bootstrap)

## Getting started

### Prerequisites

Install dependencies:

```bash
pnpm install
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
pnpm check:lines    # Enforce 300-line file limit
```

## Deploying (recommended)

### 1) Web on Vercel

- Create a Vercel project with **Root Directory** set to `apps/web`.
- Vercel will automatically detect `pnpm` from the `pnpm-lock.yaml` file.
- Add environment variables:
  - `BOT_1_HTTP_URL`, `BOT_1_WS_URL` (bot-1 endpoints)
  - `BOT_2_HTTP_URL`, `BOT_2_WS_URL` (bot-2 endpoints)
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
