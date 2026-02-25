# Development Guidelines for Copilot

> **About this file (v1.0.0):** Lean version optimized for context efficiency. Core principles here; detailed patterns loaded on-demand via skills.
>
> **Architecture:**
> - `.github/copilot-instructions.md` (this file): Core philosophy + quick reference (~100 lines, always loaded)
> - `.github/skills/`: Detailed patterns loaded on-demand (testing)

## Interaction Style

Before starting any planning, interview me to gain clarity. For instance, after learning acceptance criteria and business requirements from a ticket or planning prompt, if there's anything unclear or underspecified, ask focused questions that would help build a reasonable plan.

During execution, if you encounter ambiguity or a decision point with meaningful trade-offs, pause and ask rather than assuming. Say what the options are and what each trades off.

## Project Context & Identity

- **Project**: A repo for custom React components for clients.
- **Monorepo Tools**: Uses **pnpm** for package management. Always prefer `pnpm` over `npm` or `yarn`.

## Infrastructure & Third-party Services

- **Billing / Payments**: Use **Stripe** for all billing and payment integrations. Prefer Stripe Checkout for hosted flows and the Stripe SDK for client-side flows; keep sensitive logic on serverless functions or backend services.
- **Deployment / Hosting**: Use **Vercel** for deployments and previews; prefer Vercel for its seamless Git integration and serverless functions. Keep builds fast and stateless; configure environment variables securely in the Vercel dashboard.
- **Asset / Background Generation**: Use **Midjourney** for creative background generation. Store generated images in `public/assets/` (organized per module) and keep source prompts and generation metadata alongside feature docs, not in source control.

## Core Tech Stack

(learn versions from `package.json`)
- **Frontend**: React (Functional Components ONLY), TypeScript.
- **UI/Design**:
    - Use the **ShadCN** design system components.
- **State & Data**:
    - **TanStack Query** (`@tanstack/react-query`):
        - **Fetch Pattern**: Use `refetch()` for retries after failure.
        - **Refresh**: Use `queryClient.invalidateQueries()` to trigger a refetch for data known to have changed.
        - **Staleness**: Use `staleTime: 0` to ensure a refetch happens on every component mount.
    - **ORM**: Use **Prisma** for database access and schema migrations. Prefer the generated TypeScript client, keep your schema in `prisma/schema.prisma`, run migrations with `pnpm prisma migrate`, and store connection strings in environment variables (never commit secrets).
    - **Mutations**: Use `useMutation` from `@tanstack/react-query`. ALWAYS provide user feedback (e.g., show a spinner) during pending states and ensure proper error handling.
    - **Pagination**: Use `useInfiniteQuery` from `@tanstack/react-query` for paginated endpoints.
    - **Forms**: Use **React Hook Form v7** with shared ShadCN wrappers (e.g., `FormTextField`, `FormSelectField`).
    - **State**: Use **zustand** with the **immer** middleware.
        - **Global/Shared**: Use a dedicated store module for feature-level state that needs to be shared or live outside React.
        - **Local**: Use `useLocalSlice()` or a scoped zustand store for state confined to a component subtree.
    - **Context**: Use React's built-in `createContext` / `useContext` to avoid singletons.
        - **Patterns**: Create typed context wrappers with a custom hook (e.g., `useMyContext()`) that throws when used outside its provider. Use a single `MultiContextProvider` component to flatten provider trees.
- **Utilities**:
    - **Lodash**: Use standard `lodash` (import per-method, e.g., `import debounce from 'lodash/debounce'`).
    - **Dates**: Use `date-fns` for all date operations.

## Internal Coding Standards

- **Naming Conventions**:
    - **kebab-case**: Folders, packages, and `data-cy` attributes.
    - **camelCase**: Hooks, function names, and variables.
    - **PascalCase**: Components, TypeScript types, class names, and service files.
    - **UPPER_CASE**: Constants.
    - **Folders**: Use plural form for multiple similar items (e.g., `hooks/`, `helpers/`).
    - **Styles**: `PascalCase.module.scss`.
- **Performance & Lazy Loading**:
    - **Lazy load ONLY routers** at the top level of a feature package.
    - **Directly import** everything else within a feature to avoid excessive small chunks.
    - Avoid nested lazy loading.
- **TypeScript**:
    - **Prefer String Union Types** over `enum` for runtime compatibility (TS 5.8+).
- **JSX/TSX**:
    - Avoid multiline ternary operators; use `&&` for conditional rendering.
    - Avoid inline styles.
    - No `lodash.uniqueId()` for React keys; use resource IDs, or the `useId()` hook (as last resort).
- **Imports**:
    - Use relative imports within the same package.
    - Use absolute aliases (e.g., `@business/feature-core`) for cross-package imports.
    - NEVER import from `src` folders directly across packages.
    - Prefer destructured (named) imports where possible — prefer named imports (e.g., `import { debounce } from 'lodash'`) and avoid importing entire modules or namespaces unless necessary. Keep default imports only for modules that export a single primary value.
- **Security**:
    - Sanitize URL parameters and user-provided fields using the `sanitize()` utility to prevent XSS.
- **Assets**:
    - Use `public/assets/` for FE assets (organized by type/module). `public/img/` is reserved for proxied/dynamic content.
    - Prefer **SVG** for UI elements.
- **Forms (Advanced)**:
    - **Validations**: Use **Zod** with a **builder/factory pattern** for reusability.
    - **Shape**: Keep form values **flat**; match UI structure rather than API DTOs. Use mappers for API conversion.
    - **Errors**: Map backend violations to form fields using a violation matcher utility.
    - **Cross-field logic**: Use `useWatch` from React Hook Form for side effects between fields.

### Workflow & Commits

- **Git Commit Workflow**: follow [Git Commit Instructions](./git-commit-instructions.md).
- **ESLint and Prettier**: Adhere to rules regarding rendering and formatting.

## Living Documentation

Skill files in `.github/skills/` grow organically from real development feedback. Start sparse. Let patterns emerge from actual work.

### Recognizing Patterns

When the user gives feedback, first apply it to the immediate code. Then consider: is this a reusable pattern worth capturing?

**Signals to capture it:**
- Same correction appears twice in a session
- User says "always", "never", "we prefer", "our convention is"
- User references a style guide or team standard
- User explicitly asks to remember it

**Signals to skip:**
- One-off or context-specific correction
- Tentative language ("maybe", "let's try")
- Business logic, not a coding pattern
- User says "just this once"

### Proposing Updates

1. Ask: "This seems like a pattern. Should I update [skill-file.md]?"
2. Show the proposed diff
3. Wait for approval before applying
4. Keep each update to one focused concept
