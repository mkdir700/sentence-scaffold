# Stack Research

**Domain:** React + Express full-stack refactor (AI-powered sentence analysis tool)
**Researched:** 2026-03-10
**Confidence:** HIGH — all versions verified against npm/official sources as of 2026-03

---

## Recommended Stack

### Core Technologies (Keep Existing)

These are already in the project and should be retained. The refactor does NOT change the fundamental stack — it improves how the stack is used.

| Technology | Current Version | Purpose | Why Keep |
|------------|-----------------|---------|----------|
| React | 19.0.0 | UI framework | Latest stable; all libraries now support it |
| Express | 4.21.2 | Backend API server | Working stack; Express 5 is stable but migration not worth it for this scope |
| SQLite (better-sqlite3) | 12.4.1 | Embedded database | Synchronous API is actually an advantage in Express route handlers; no async overhead |
| Vite | 6.2.0 | Dev server + bundler | Vite 6 is current stable; Vitest 4 reuses this config |
| Tailwind CSS | 4.1.14 | Utility styling | v4 is current; keep existing setup |
| TypeScript | 5.8.2 | Type safety | Current; enable `strict: true` — currently missing from tsconfig |

### New Dependencies to Add

| Library | Recommended Version | Purpose | Why This One |
|---------|---------------------|---------|--------------|
| @tanstack/react-query | ^5.90.21 | Server state management | v5 is stable with React 19; built-in caching eliminates manual fetch boilerplate; `isPending`/`isError` states replace duplicate try-catch-alert patterns |
| @tanstack/react-query-devtools | ^5.91.3 | Query debugging in dev | Visualize cache state, stale time, background refetches; zero production cost when excluded |
| zod | ^4.3.6 | Runtime schema validation | TypeScript-first; validates Gemini API responses at runtime; infers TS types from schemas — single source of truth for types and validation |

### Testing Stack (All New)

| Library | Recommended Version | Purpose | Why This One |
|---------|---------------------|---------|--------------|
| vitest | ^4.0.18 | Test runner | Vite-native — reuses existing `vite.config.ts`; 4x faster than Jest; no separate Babel/transform config needed |
| @testing-library/react | ^16.x | Component testing | v16+ required for React 19 compatibility; tests behavior not implementation |
| @testing-library/dom | ^10.x | RTL v16 peer dep | Required by @testing-library/react v16+ |
| @testing-library/user-event | ^14.x | User interaction simulation | Replaces `fireEvent` for realistic interaction testing (proper event sequences) |
| @testing-library/jest-dom | ^6.x | DOM matchers | Adds `toBeInTheDocument()`, `toHaveTextContent()` etc. to Vitest's `expect` |
| jsdom | ^26.x | DOM environment | Simulates browser DOM for component tests in Vitest |

### Supporting Libraries (Keep Existing)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| react-router | ^7.13.1 | Client-side routing | Keep; use `useParams` for URL-based analysis navigation (fixes data-loss-on-refresh) |
| lucide-react | ^0.546.0 | Icons | Keep |
| clsx + tailwind-merge | current | Class utilities | Keep; already correctly configured |
| motion | ^12.23.24 | Animations | Keep; use sparingly |
| dotenv | ^17.2.3 | Env config | Keep |

### Backend Type Safety (No New Libraries)

Better-sqlite3 v12 ships with `@types/better-sqlite3` — install separately as a devDependency if not present. Use the generic parameter on `.prepare().get<T>()` and `.prepare().all<T>()` for typed query results. Do NOT add an ORM — the schema is simple (2 tables), and typed generics are sufficient. Adding Drizzle or Prisma for 2 tables is over-engineering.

---

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tsx | TypeScript execution for server.ts in dev | Keep; already configured |
| @types/better-sqlite3 | Type definitions for better-sqlite3 | Add to devDependencies if not present |
| @types/express | Express type definitions | Already present |

---

## TypeScript Configuration Changes

The current `tsconfig.json` is missing `"strict": true`. This is the single most important configuration change for the refactor goal of eliminating `any` types.

**Current state:** No `strict` flag — TypeScript is lenient, `any` is freely accepted.

**Required change:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

`strict: true` activates all of the above flags at once. Adding them individually is redundant but documents intent clearly.

**What `strict: true` catches that matters here:**
- `noImplicitAny` — flags every existing `any` usage in Analysis.tsx, Home.tsx, Library.tsx, server.ts
- `strictNullChecks` — forces handling of `null | undefined` from DB queries and API responses
- `strictFunctionTypes` — catches incorrect event handler signatures

---

## Installation

```bash
# Server state management
npm install @tanstack/react-query

# Runtime validation (also use for Gemini response validation)
npm install zod

# Dev: testing stack
npm install -D vitest @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom jsdom

# Dev: better-sqlite3 types (if not present)
npm install -D @types/better-sqlite3

# Dev: TanStack Query devtools
npm install -D @tanstack/react-query-devtools
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| TanStack Query v5 | SWR | TanStack Query has more features (mutations, optimistic updates, devtools) and better TypeScript inference. SWR is simpler but insufficient for managing the multiple endpoints this app has. |
| TanStack Query v5 | Manual fetch + useState | Current approach — produces the duplicate try-catch-alert pattern documented in CONCERNS.md. Eliminates with zero-config cache and built-in `isPending`/`isError` states. |
| Zod v4 | io-ts | Zod has simpler ergonomics and 31M weekly downloads. io-ts has steeper learning curve with no benefit at this scale. |
| Zod v4 | yup | Zod infers TypeScript types directly from schemas; yup requires separate type declarations. Single source of truth is the key advantage. |
| Vitest v4 | Jest | Jest requires separate Babel/ts-jest config. Vitest reuses existing vite.config.ts — zero additional configuration. Jest is not wrong, just adds friction. |
| @testing-library/react v16 | Enzyme | Enzyme tests implementation details; RTL tests behavior. RTL is the current industry standard and officially recommended by React team for React 19. |
| Keep Express 4 | Migrate to Express 5 | Express 5 is stable but the migration adds risk with no functional benefit for this refactor scope. Express 4 is fully supported and production-ready. |
| Keep Express 4 | Migrate to Hono | Project constraints explicitly state "Keep Express." Hono migration would be a separate decision after the refactor stabilizes. |
| @types/better-sqlite3 generics | Drizzle ORM | Drizzle is excellent but the schema has only 2 tables (sentences, chunks). Adding an ORM for 2 tables is over-engineering. Typed generics on prepare().get<T>() cover the use case completely. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `any` type in TypeScript | Bypasses the entire type system; every `any` is a potential runtime crash. The codebase currently has it in 5+ files. | Define interfaces/types for all data structures; use `zod.infer<>` for API response types |
| `alert()` for errors | Blocks the browser, cannot be tested, cannot be styled, terrible UX. Found in Home.tsx, Analysis.tsx, Library.tsx. | TanStack Query's `isError`/`error` state + inline error UI components |
| `location.state` for cross-page data | Data lost on page refresh. Analysis page currently relies on this. | URL params (`/analysis/:id`) — fetch from DB on mount via TanStack Query |
| `react-test-renderer` | Deprecated in React 19; logs deprecation warnings and switches to concurrent rendering internally | `@testing-library/react` v16 |
| `@testing-library/react` v13/14/15 | Peer dep declares `react@^18.0.0` — causes `ERESOLVE` with React 19 | `@testing-library/react` v16+ |
| `useEffect` + `fetch` + `useState` for server data | The pattern that caused all the duplicate try-catch-alert boilerplate. Three hooks where one TanStack Query hook would do. | `useQuery` / `useMutation` from TanStack Query |
| Decorator-based routing (`routing-controllers`) | Adds experimental decorator complexity; requires `emitDecoratorMetadata` config. Overkill for 7 routes. | Plain `express.Router()` split into route files per feature domain |
| Jest | Requires separate Babel/ts-jest pipeline alongside existing Vite setup. Dual build configs create maintenance burden. | Vitest — reuses Vite config |

---

## Stack Patterns

**For TypeScript type definitions of API data:**
- Define interfaces in `src/types/` (e.g., `analysis.types.ts`, `db.types.ts`)
- Use `zod.infer<typeof Schema>` to derive types from Zod schemas where runtime validation is also needed (Gemini response, Express request bodies)
- Export types from a central `src/types/index.ts` barrel

**For server state (data from Express endpoints):**
- Use `useQuery` for GET requests (history, library, single analysis)
- Use `useMutation` for POST/DELETE requests (save sentence, save chunk, delete)
- Wrap the `QueryClient` provider in `App.tsx`
- One `queryClient` instance at the root; no context threading needed

**For Express route organization:**
- Split `server.ts` (currently 130+ lines, 7 routes) into route files by domain:
  - `src/server/routes/analysis.ts` — analyze, get by ID
  - `src/server/routes/sentences.ts` — save, delete, list
  - `src/server/routes/chunks.ts` — save, delete, list
- Keep controllers simple (no BaseController abstraction needed at this scale)
- Pattern: `router.post('/analyze', validateBody(AnalyzeSchema), analyzeController)`

**For React component decomposition:**
- Decompose `Analysis.tsx` (547 lines) by extracting each analysis step as a focused component
- Each step component: receives typed props, renders one section, no shared state
- Custom hooks for logic extraction: `useAnalysis(id)` wraps `useQuery`, `useSaveChunk()` wraps `useMutation`
- No compound component pattern needed — step components are independent, not related by shared parent state

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @tanstack/react-query ^5.90 | React ^18 or ^19 | Fully compatible; uses `useSyncExternalStore` (React 18+ API) |
| @testing-library/react ^16 | React ^18 or ^19 | v16+ explicitly adds React 19 support; v13-15 will ERESOLVE |
| @testing-library/dom ^10 | @testing-library/react ^16 | Required peer dep for RTL v16 |
| zod ^4.3 | TypeScript ^5.5 | Current project uses TS 5.8.2 — compatible |
| vitest ^4 | Vite ^5 or ^6 | Current project uses Vite 6.2 — compatible |

---

## Sources

- [TanStack Query npm (v5.90.21 confirmed)](https://www.npmjs.com/package/@tanstack/react-query) — version verification, React 19 compatibility
- [TanStack Query v5 React docs](https://tanstack.com/query/v5/docs/framework/react) — API patterns, `isPending` rename, Suspense support
- [Zod npm (v4.3.6 confirmed)](https://www.npmjs.com/package/zod) — version verification
- [Zod v4 release notes](https://zod.dev/v4) — v4 import path (`zod/v4`), stability status
- [Vitest npm (v4.0.18 confirmed)](https://www.npmjs.com/package/vitest) — version verification
- [Vitest 4.0 announcement](https://vitest.dev/blog/vitest-4) — stable Browser Mode, Vite 6 compatibility
- [@testing-library/react npm](https://www.npmjs.com/package/@testing-library/react) — v16 React 19 peer dep requirement
- [RTL React 19 compatibility (Medium)](https://medium.com/@dinukakeshan/solving-dependency-conflicts-react-19-and-testing-library-issues-2eb6f773d4ea) — confirmed v16 required for React 19
- [better-sqlite3 TypeScript typed patterns](https://www.npmjs.com/package/@types/better-sqlite3) — generic query typing approach
- [Express route organization with Router](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/routes) — MDN, authoritative pattern reference
- [TypeScript strict mode for React (2025)](https://dev.to/muhammad_zulqarnainakram/typescript-patterns-every-react-developer-should-know-in-2025-2264) — strict mode flag effects — MEDIUM confidence (WebSearch + multiple corroborating sources)
- [Zod + Express validation middleware pattern](https://stevekinney.com/courses/full-stack-typescript/using-zod-with-express) — validated request body typing

---

*Stack research for: React + Express full-stack refactor (Sentence Scaffold)*
*Researched: 2026-03-10*
