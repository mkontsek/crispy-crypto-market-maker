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
- **Web** (`apps/web`): Next.js 16 BFF + UI. Maintains runtime topology (default: Joe + Bob + disconnected example bot + exchange),
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
│   ├── run-exchange.sh   # Provision and start the exchange on Ubuntu
│   ├── run-bot.sh        # Provision and start a bot on Ubuntu
│   ├── stop-exchange.sh  # Stop the exchange systemd service
│   ├── stop-bot.sh       # Stop a named bot systemd service
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

Default local-development addresses (override with `BOT_1_*`, `BOT_2_*`, `BOT_3_*` env vars):

- `Joe` (`bot-1`)
    - WebSocket stream: `ws://127.0.0.1:3110/stream`
    - HTTP command API: `http://127.0.0.1:3110`
- `Bob` (`bot-2`)
    - WebSocket stream: `ws://127.0.0.1:3112/stream`
    - HTTP command API: `http://127.0.0.1:3112`
- `Disconnected (example)` (`bot-3`)
    - WebSocket stream: `ws://127.0.0.1:3999/stream`
    - HTTP command API: `http://127.0.0.1:3999`

Each bot HTTP API exposes:

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
- `GET /api/history/pnl?botId=<id>&page=<n>&pageSize=<n>` (DB-backed PnL snapshot history; `limit` still accepted as alias for `pageSize`)
- `GET /api/history/inventory?pair=<pair>&botId=<id>&page=<n>&pageSize=<n>` (DB-backed inventory history; `limit` still accepted as alias for `pageSize`)

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
(`postgres`/`postgres`/`postgres`) that match the local development fallback in
`packages/db` (`postgresql://postgres:postgres@localhost:55432/postgres`).

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
    - `BOT_1_NAME`, `BOT_1_HTTP_URL`, `BOT_1_WS_URL` (Joe defaults)
    - `BOT_2_NAME`, `BOT_2_HTTP_URL`, `BOT_2_WS_URL` (Bob defaults)
    - `BOT_3_NAME`, `BOT_3_HTTP_URL`, `BOT_3_WS_URL` (disconnected example bot defaults)
    - `EXCHANGE_HTTP_URL`, `EXCHANGE_WS_URL` (exchange endpoints)
    - `ENGINE_HTTP_URL`, `ENGINE_WS_URL` remain supported as bot-1 aliases
    - `DATABASE_URL` (optional — only needed if you want the web app to serve
      history / analytics data; DB writes are performed by the bot, not the web app)
      - The app also accepts Vercel Postgres vars: `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, or `POSTGRES_URL`.
      - In production, missing DB env vars now fail fast instead of falling back to localhost.
    - Optional static map locations (replaces geo API calls):
        - `BOT_1_GEO_LAT`, `BOT_1_GEO_LNG`, `BOT_1_GEO_LABEL` — bot-1 map pin
        - `BOT_2_GEO_LAT`, `BOT_2_GEO_LNG`, `BOT_2_GEO_LABEL` — bot-2 map pin
        - `BOT_3_GEO_LAT`, `BOT_3_GEO_LNG`, `BOT_3_GEO_LABEL` — bot-3 map pin
        - `EXCHANGE_GEO_LAT`, `EXCHANGE_GEO_LNG`, `EXCHANGE_GEO_LABEL` — simulated exchange map pin
        - `DASHBOARD_GEO_LAT`, `DASHBOARD_GEO_LNG`, `DASHBOARD_GEO_LABEL` — dashboard/browser map pin
    - Optional alert webhook (fires a POST when an alert appears or resolves):
        - `ALERT_WEBHOOK_URL` — full URL of the webhook endpoint (Slack, Discord, Telegram, or custom)
        - The payload is JSON: `{ botId, botName, newAlerts, resolvedAlertIds, timestamp }`
        - See [Alert Webhooks](#alert-webhooks) for details.
- Deploy from Git or with CLI:

```bash
vercel
```

**Note**: The `vercel.json` in `apps/web` configures pnpm as the package manager and sets the correct build command for the monorepo.

### 2) Exchange on an Ubuntu server

`scripts/run-exchange.sh` builds the exchange from source, installs it as a
systemd service, writes `/etc/crispy/crispy-exchange.env`, and configures Caddy.
The script is idempotent: you can safely run it again and unchanged steps/files
are skipped.

```bash
git clone https://github.com/mkontsek/crispy-crypto-market-maker.git
cd crispy-crypto-market-maker
sudo ./scripts/run-exchange.sh \
  --caddy-domain exchange.your-domain.com
```

Optional: pin the exchange location on the infrastructure map (skips IP geolocation):

```bash
sudo ./scripts/run-exchange.sh \
  --caddy-domain exchange.your-domain.com \
  --geo-lat 51.5074 --geo-lng -0.1278 --geo-label "London, UK"
```

You must pass a full domain name via `--caddy-domain`.

### 3) Bot on an Ubuntu server

Bot setup requires:

```bash
sudo ./scripts/run-bot.sh \
  --bot-name bot1 \
  --caddy-domain bot1.your-domain.com \
  --exchange-domain exchange.your-domain.com
```

This sets:

- Caddy domain for the bot service (`bot1.your-domain.com`)
- Exchange endpoints in bot env (`wss://exchange.your-domain.com/feed`, `https://exchange.your-domain.com`)

> **Note:** The Rust services are plain HTTP servers. Use `ws://` / `http://` on
> private/internal networks and `wss://` / `https://` for any publicly reachable
> endpoint (place the service behind a TLS-terminating reverse proxy such as
> nginx or Caddy — see [HTTP vs HTTPS](#http-vs-https) below).

Or provide explicit exchange URLs:

```bash
sudo ./scripts/run-bot.sh \
  --bot-name bot2 \
  --caddy-domain bot2.your-domain.com \
  --exchange-ws-url wss://exchange-alt.your-domain.com/feed \
  --exchange-api-url https://exchange-alt.your-domain.com
```

To set DB persistence at install time, pass the DB URL on the command line:

```bash
sudo ./scripts/run-bot.sh \
  --bot-name bot1 \
  --caddy-domain bot1.your-domain.com \
  --exchange-domain exchange.your-domain.com \
  --database-url 'postgresql://crispy:change-me@localhost:5432/crispy'
```

The service is installed under systemd and the config lives in
`/etc/crispy/crispy-bot-bot1.env`. To apply config-only changes, edit the file
and restart the service directly:

```bash
sudo systemctl restart crispy-bot-bot1
journalctl -fu         crispy-bot-bot1
```

To enable database persistence, set `DATABASE_URL` (via `--database-url` or by editing the env file) and set `BOT_ID`:

```ini
DATABASE_URL=postgresql://crispy:change-me@localhost:5432/crispy
BOT_ID=bot1
```

The bot writes fills, quotes, inventory snapshots and PnL directly to Postgres
on every tick. `DATABASE_URL` is optional — the bot runs normally without it.

Re-running `run-bot.sh` (idempotent) rebuilds and redeploys when source or
config changes:

```bash
sudo ./scripts/run-bot.sh --bot-name bot1 --caddy-domain bot1.your-domain.com \
  --exchange-domain exchange.your-domain.com
```

Exchange management example:

```bash
# Config-only change: edit /etc/crispy/crispy-exchange.env, then:
sudo systemctl restart crispy-exchange
journalctl -fu         crispy-exchange

# Rebuild and redeploy (idempotent):
sudo ./scripts/run-exchange.sh --caddy-domain exchange.your-domain.com
```

To stop a service:

```bash
sudo ./scripts/stop-exchange.sh
sudo ./scripts/stop-bot.sh --bot-name bot1
```

Ports exposed:

- `3110` WebSocket stream (`/stream`)
- `3110` HTTP API (`/config`, `/pairs/:id/pause`, `/hedge`, `/health`)

To add a second bot instance on the same machine, re-run `run-bot.sh` with another bot name
(for example `--bot-name bot2`). This creates an independent unit/binary/env
per bot.

#### Uninstalling a service

```bash
sudo systemctl stop crispy-exchange
sudo systemctl disable crispy-exchange
sudo rm /etc/systemd/system/crispy-exchange.service
sudo systemctl daemon-reload
```

For a bot, substitute `crispy-exchange` with `crispy-bot-<bot-name>`:

```bash
sudo systemctl stop crispy-bot-bot1
sudo systemctl disable crispy-bot-bot1
sudo rm /etc/systemd/system/crispy-bot-bot1.service
sudo systemctl daemon-reload
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

**Important**: Set `DATABASE_URL` (and `BOT_ID`) in the bot's env file
(`/etc/crispy/crispy-bot-<name>.env`). The bot writes fills, quotes, inventory,
and PnL snapshots directly to Postgres on every tick. The web app uses the same
database only for reading history — set `DATABASE_URL` in Vercel only if you
want the history and analytics endpoints.

### Production topology

Best results come from:

- **Vercel** for `apps/web`
- **Ubuntu VMs or bare-metal** for `apps/exchange` and `apps/bot` (provisioned with `run-exchange.sh` / `run-bot.sh`)
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

## Alert Webhooks

The web app can push a JSON webhook to any URL whenever an alert fires or clears.
Set `ALERT_WEBHOOK_URL` (in Vercel or your local `.env`) to enable it.

```
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

The webhook fires server-side (from the Next.js backend / Vercel serverless runtime)
whenever alert state changes for any bot — so you are notified even when the dashboard
is not open.

### Payload

```json
{
  "botId": "bot-1",
  "botName": "Joe",
  "newAlerts": [
    { "id": "exchange-disconnect", "severity": "critical", "message": "Feed disconnected: Binance (BTC/USDT)" }
  ],
  "resolvedAlertIds": ["feed-stale"],
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

| Field | Description |
|---|---|
| `botId` | Identifies which bot the alert belongs to |
| `botName` | Human-readable bot name from topology |
| `newAlerts` | Alerts that just became active (empty when only resolving) |
| `resolvedAlertIds` | IDs of alerts that just cleared (empty when only firing) |
| `timestamp` | ISO 8601 timestamp from the engine payload |

### Alert IDs

| ID | Severity | Condition |
|---|---|---|
| `kill-switch` | critical | Kill switch engaged — all quoting halted |
| `exchange-disconnect` | critical | Exchange WebSocket feed disconnected |
| `inv-crit-{pair}` | critical | Inventory > 90 % of hard limit |
| `feed-stale` | warning | Feed staleness > 2 s |
| `inv-warn-{pair}` | warning | Inventory 75–90 % of limit |
| `adverse-high` | warning | Adverse selection rate > 40 % |
| `fill-low` | warning | Fill rate < 2 % |
| `all-paused` | warning | All pairs paused (kill switch off) |

### Integrations

**Slack Incoming Webhook** — create a webhook at <https://api.slack.com/messaging/webhooks>,
then set `ALERT_WEBHOOK_URL` to the `https://hooks.slack.com/…` URL.  
The raw payload is delivered as-is; use a Slack workflow or a thin proxy to format the message.

**Discord** — use a Discord channel webhook URL (`https://discord.com/api/webhooks/…`).

**Telegram** — run a small proxy that receives the POST and calls the Bot API.

**Custom handler** — any HTTP endpoint that accepts a POST with `Content-Type: application/json`.
