# Next.js / Frontend Skill

## Scope

These instructions apply to all Next.js / React / TypeScript packages in this monorepo, including shared component libraries and app surfaces.

## Locked Versions

Use exact latest supported versions — do not upgrade unless explicitly requested. 
Example:

| Package | Version |
|---|---|
| `next` | 16.1.6 |
| `react` / `react-dom` | 19.2.4 |
| `@tanstack/react-query` | 5.90.21 |
| `zustand` | 5.0.11 |
| `zod` | 4.3.6 |
| `prisma` / `@prisma/client` | 7.4.2 |
| `framer-motion` | 12.38.0 |
| `typescript` | 5.9.3 |

## Layout & Conventions

- Actual folder structure in `apps/web/src/`:
    - `app/` — Next.js App Router pages and API routes.
    - `components/<feature>/` — all UI for that feature; split into subfolders when a feature grows (e.g., `geo-map/`, `pnl/`, `config-panel/`).
    - `lib/` — pure utility/service functions (no React). Name files `<noun>-service.ts` for domain services (e.g., `geo-service.ts`, `bot-data-service.ts`) and `<noun>.ts` for utilities (e.g., `fetch-json.ts`, `timestamp.ts`).
    - `stores/` — Zustand stores, one file per store (e.g., `engine-store.ts`).
    - `server/` — server-only helpers (never imported by client components).
- Keep server-only logic in API routes or `server/` modules — no secrets on the client.
- **Max 300 lines per file** for `.ts` and `.tsx` source files (enforced by `scripts/check-file-lines.sh`). When a file approaches the limit, split by extracting hooks, service helpers, or sub-components into their own files.

## Components

- One component per file. Use `export const Component: FC<Props> =` pattern.
- All exports are **named exports** — never use `export default` or `export *`.
- Component files live in `components/<feature>/`. When a single feature directory becomes large, create a subfolder (e.g., `components/dashboard/geo-map/`).
- Extract non-component helpers (pure functions, formatters, fetchers) to `lib/<noun>-service.ts`, not inline in the component file.

## Hooks

- Each `use*` hook gets its own dedicated file named `use-<action>.ts` (e.g., `use-strategy-mutation.ts`, `use-bot-quotes-query.ts`, `use-bounds-controller.ts`).
- Place hooks that belong to a component in the same directory as that component; place reusable standalone hooks (e.g., `use-table-sort.ts`) in `lib/`.
- **Do not use a `handle*` prefix for functions.** Name functions after the action they perform: `killSwitch`, `setStrategy`, `pausePair`, `updateConfig`, `resetState`.
- **Reserve the `on*` prefix exclusively for props** (e.g. `onClose`, `onChange`). Internal event listeners or callbacks should be named after what they do, not how they are triggered (e.g. `closeOnPressEscape`, `submitLogin`, not `onKeydown` or `onSubmit`).
- **Never pass anonymous arrow functions as event listeners** (e.g. `onClick={() => doThing()}`). Always define a named function inside the component scope (or at module level if it needs no closure) and reference it: `onClick={doThing}`. This prevents memory reallocation on every render. For handlers that must close over a loop variable (e.g. inside `.map()`), define a named curried factory: `const selectItem = (id: string) => () => doThing(id)` and use `onClick={selectItem(item.id)}`. If a mapped element needs multiple named handlers, extract a dedicated child component so each handler can be defined once in that component scope.

## Data Fetching

- Use **TanStack Query** (`@tanstack/react-query` v5) for client-side fetching:
    - One `useQuery` or `useMutation` per file; name the file `use-<entity>-query.ts` or `use-<entity>-mutation.ts`.
    - Use `refetchInterval` for polling (see `BOT_REFETCH_INTERVAL_MS` in `bot-data-service.ts`).
    - On mutation success, call `queryClient.invalidateQueries({ queryKey })` for affected keys.
    - Use `onMutate` / `onError` for optimistic updates when immediate feedback is needed.
- For server components, call backend APIs or Rust services via typed clients in `server/`.

## State Management

- Use **Zustand** + **immer** for shared app state:
    - One store per concern under `stores/<noun>-store.ts`.
    - Avoid a single global "god" store.
    - Access Zustand state outside React hooks via `useMyStore.getState()`.
- Use React Context only for cross-cutting concerns (theme, auth session), exposed via typed hooks that throw when used outside providers.

## Forms & Validation

- Use **React Hook Form v7** for form state.
- Use **Zod** v4 for schema definitions.
- Keep form value shapes flat and UI-centric; map to/from API DTOs via mapper functions.
- Use `useWatch` for cross-field derived logic.

## Styling & Components

- Use ShadCN components as baseline, wrapped in local primitives when customization repeats.
- Prefer **Tailwind CSS v4** utility classes over inline styles.
- Use `cn()` from `lib/utils.ts` (based on `clsx` + `tailwind-merge`) for conditional class merging.

## Performance

- Lazy-load only top-level route segments or clearly isolated heavy features.
- Avoid deep nested `React.lazy` usage.
- Use `useMemo` / `useCallback` only when profiling shows benefit.

## Testing

- Tests live in a `__tests__/` subfolder beside the code they test (e.g., `components/dashboard/__tests__/`, `lib/__tests__/`). File names match the source: `use-strategy-mutation.test.ts`, `geo-service.test.ts`.
- Use **Vitest** (not Jest) — run with `pnpm test` in `apps/web`.
- Use **React Testing Library** for component behavior; do not test implementation details.
- For data-fetching hooks, mock the network boundary (i.e., `fetch`) not internal helpers.
- Test files are excluded from the 300-line rule.
