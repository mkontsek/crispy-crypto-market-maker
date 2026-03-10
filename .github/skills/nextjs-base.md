# Next.js / Frontend Skill

## Scope

These instructions apply to all Next.js / React / TypeScript packages in this monorepo, including shared component libraries and app surfaces.

## Layout & Conventions

- Prefer feature-first structure inside apps:
    - `app/` (or `pages/` for legacy) for routing.
    - `features/<feature-name>/` for cohesive vertical slices (components, hooks, state).
    - `components/` only for truly shared, cross-feature UI elements.
- Use `public/assets/<feature>/` for static assets consumed by that feature.
- Keep server-only logic in server components, API routes, or server actions (no secrets on the client).

## Data Fetching

- Use **TanStack Query** for client-side fetching:
    - Use `staleTime: 0` by default to refetch on mount.
    - On mutation success, call `queryClient.invalidateQueries()` for affected keys.
    - Support manual retry via `refetch()` after errors.
- For server components:
    - Prefer calling backend APIs or Rust services via typed clients.
    - Keep data-fetching logic in dedicated modules (e.g., `features/<feature>/api.ts`).

## State Management

- Use **Zustand** + **immer** for shared/local app state:
    - Dedicated store per feature under `features/<feature>/store.ts`.
    - Avoid single global “god” store.
- Use React Context only for cross-cutting concerns (theme, auth session), exposed via typed hooks throwing outside providers.

## Forms & Validation

- Use **React Hook Form v7** for form state.
- Wrap inputs with ShadCN components and shared wrappers like `FormTextField`, `FormSelectField`.
- Use **Zod** for schemas:
    - Define schemas per form in `features/<feature>/schema.ts`.
    - Use builder/factory patterns for reusable fragments.
- Keep form values flat and UI-centric, map to/from API DTOs using mapper functions.

## Styling & Components

- Use ShadCN components as baseline, wrapped in local primitives when customization is repeated.
- Prefer CSS Modules or Tailwind (if present) over inline styles.
- Keep components small and focused; extract presentational vs container components when logic grows.

## Performance

- Lazy-load only top-level route segments or clearly isolated heavy features.
- Avoid deep nested `React.lazy` usage.
- Use `useMemo` / `useCallback` only when profiling shows benefit or props cause expensive recalculations.

## Testing

- Co-locate component tests next to components (`MyComponent.test.tsx`).
- Prefer React Testing Library for behavior, not implementation details.
- For data-fetching hooks, mock network layer or query client boundaries, not internals.
