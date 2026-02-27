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

## Workspace scripts

```bash
pnpm dev
pnpm lint
pnpm build
pnpm typecheck
```
