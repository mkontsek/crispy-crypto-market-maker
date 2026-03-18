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
├── scripts
│   ├── setup-ubuntu.sh   # Ubuntu server provisioning script (bot / exchange)
│   └── run-services.sh   # Local background-process launcher
├── turbo.json
└── pnpm-workspace.yaml
```

## Exchange interfaces

Default local-development addresses (override with `EXCHANGE_WS_URL` / `EXCHANGE_HTTP_URL`):

- WebSocket feed: `ws://127.0.0.1:3111/feed`
- HTTP order API: `http://127.0.0.1:3111`
  - `POST /orders` — place an order; returns fill result (fake mode: probability-based fill)
  - `GET /health`

## Bot interfaces

Default local-development addresses (override with `BOT_1_WS_URL` / `BOT_1_HTTP_URL`):

- WebSocket stream: `ws://127.0.0.1:3110/stream`
- HTTP command API: `http://127.0.0.1:3110`
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
- `GET /api/history/fills?pair=<pair>&botId=<id>&page=<n>&pageSize=<n>` (DB-backed fill history)
- `GET /api/history/pnl?botId=<id>&limit=<n>` (DB-backed PnL snapshot history)
- `GET /api/history/inventory?pair=<pair>&botId=<id>&limit=<n>` (DB-backed inventory history)

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

### Database (PostgreSQL)

A `docker-compose.yml` is provided for spinning up a local Postgres instance and pushing Prisma schema:

```bash
pnpm run db:up
```

This starts Postgres on host port `55432` (mapped to container `5432`) with the default credentials
(`postgres`/`postgres`/`postgres`) that match the fallback `DATABASE_URL` in
`packages/db`.

If `55432` is busy on your machine, set `POSTGRES_HOST_PORT` when starting the DB:

```bash
POSTGRES_HOST_PORT=55440 pnpm run db:up
```

The web BFF automatically persists every engine stream event (fills, quotes,
inventory, PnL) to Postgres as soon as the bot connects. Historical data can be
browsed at [http://localhost:3008/history](http://localhost:3008/history).

### Development (watch mode)

**Option 1: All services in one command (background processes)**

```bash
pnpm run dev:all
```

`dev:*` scripts automatically check local listeners and stop processes already bound to these dev ports before startup:

- `3008` (web)
- `3110` (bot)
- `3111` (exchange)

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
pnpm dev            # Turbo parallel dev for web packages (auto-frees :3008)
pnpm dev:all        # All services (exchange + bot + web) in background
pnpm dev:exchange   # Exchange in watch mode (auto-frees :3111)
pnpm dev:bot        # Bot in watch mode (auto-frees :3110)
pnpm dev:web        # Web only in dev mode (auto-frees :3008)

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

### 2) Exchange on an Ubuntu server

`scripts/setup-ubuntu.sh` builds the exchange from source, installs it as a
systemd service, and writes a `/etc/crispy/crispy-exchange.env` config file.

```bash
git clone https://github.com/mkontsek/crispy-crypto-market-maker.git
cd crispy-crypto-market-maker
sudo ./scripts/setup-ubuntu.sh --service exchange
```

The service starts automatically and restarts on failure. Ports exposed:
- `3111` WebSocket feed (`/feed`)
- `3111` HTTP API (`/orders`, `/health`)

Manage the service with standard systemd commands:

```bash
sudo systemctl status  crispy-exchange
sudo systemctl restart crispy-exchange
journalctl -fu         crispy-exchange
```

### 3) Bot on an Ubuntu server

Point the bot at your exchange with explicit URLs:

```bash
# (use wss:// / https:// when the exchange is behind a TLS-terminating proxy)
sudo ./scripts/setup-ubuntu.sh \
  --service bot \
  --exchange-ws-url  ws://exchange.your-server.com/feed \
  --exchange-api-url http://exchange.your-server.com
```

If `EXCHANGE_WS_URL` / `EXCHANGE_API_URL` are left unset in
`/etc/crispy/crispy-bot.env`, the bot falls back to local defaults
(`ws://127.0.0.1:3111/feed`, `http://127.0.0.1:3111`).

> **Note:** The Rust services are plain HTTP servers. Use `ws://` / `http://` on
> private/internal networks and `wss://` / `https://` for any publicly reachable
> endpoint (place the service behind a TLS-terminating reverse proxy such as
> nginx or Caddy — see [HTTP vs HTTPS](#http-vs-https) below).

The service is installed under systemd and the config lives in
`/etc/crispy/crispy-bot.env`. Edit it to change endpoints, then restart:

```bash
sudo systemctl restart crispy-bot
journalctl -fu         crispy-bot
```

Ports exposed:
- `3110` WebSocket stream (`/stream`)
- `3110` HTTP API (`/config`, `/pairs/:id/pause`, `/hedge`, `/health`)

To add a second bot instance on the same machine, re-run the script with
`--user crispy2` (or any unique service user). The script will create the user,
install a separate binary, and register an independent systemd unit.

#### Uninstalling a service

```bash
sudo ./scripts/setup-ubuntu.sh --service <bot|exchange> --uninstall
```

### 4) PostgreSQL (managed DB recommended)

For production, a managed Postgres service (e.g. Supabase, Neon, RDS) is
recommended. For a quick self-hosted setup on Ubuntu, install the official
PostgreSQL package:

```bash
sudo apt-get install -y postgresql
sudo -u postgres psql -c "CREATE USER crispy WITH PASSWORD 'change-me';"
sudo -u postgres psql -c "CREATE DATABASE crispy OWNER crispy;"
```

Use the resulting connection string as `DATABASE_URL`:

```
postgresql://crispy:change-me@localhost:5432/crispy
```

### Production topology

Best results come from:
- **Vercel** for `apps/web`
- **Ubuntu VMs or bare-metal** for `apps/exchange` and `apps/bot` (provisioned with `setup-ubuntu.sh`)
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
