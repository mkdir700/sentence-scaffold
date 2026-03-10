# Feature Research

**Domain:** React + Express refactor — code quality and maintainability
**Researched:** 2026-03-10
**Confidence:** HIGH (findings verified across official docs and multiple authoritative sources)

---

## Context

This is not a product feature document — it is a **code quality feature document**. The "users" here are developers maintaining and extending the codebase. "Table stakes" means patterns without which the codebase remains fragile. "Differentiators" are patterns that lift the codebase from working to genuinely well-engineered.

The project is a brownfield refactor of a ~15-file React + Express app. The core functionality (sentence analysis via Gemini, library management) must remain unchanged. Every item below is about internal code structure, not user-facing functionality.

---

## Feature Landscape

### Table Stakes (Must Have — Codebase Is Fragile Without These)

These are the non-negotiable foundations. Without them, the refactor does not achieve its stated goal of "proper TypeScript types, clean architecture, improved UX, and test coverage."

| Feature | Why Required | Complexity | Notes |
|---------|--------------|------------|-------|
| TypeScript strict types — eliminate `any` | Every `any` is a live grenade: runtime crashes go undetected, refactoring is dangerous, IDE support degrades. The codebase currently has `any` on all state, all API responses, and all event handlers. | MEDIUM | Requires defining `AnalysisResult`, `Sentence`, `Chunk`, `HistoryEntry` interfaces. Use `z.infer<>` from Zod to derive types from runtime schemas so compile-time and runtime stay in sync. |
| Zod schemas for API response validation | Gemini returns JSON parsed with no validation. A malformed or schema-breaking response will silently crash rendering. TypeScript types alone cannot protect against this — types are erased at runtime. | MEDIUM | Define one canonical Zod schema for the Gemini response. Run `.safeParse()` on every response. Export the inferred type (`z.infer<typeof AnalysisSchema>`) so all consumers share the same type. |
| Replace `alert()` with component-level error states | `alert()` blocks the UI thread, cannot be styled, cannot be dismissed gracefully, and breaks automated testing. Every async operation currently uses this pattern. | LOW | Each component that fetches data needs an `error` state variable. Render an inline error message (e.g., a red `<div>` or a `<Alert>` component) instead of calling `alert()`. |
| Loading state differentiation | The current single `isLoading` boolean conflates cache lookup (fast, ~50ms) with Gemini generation (slow, 3-10s). Users cannot tell which is happening. This is a UX defect, not a nice-to-have. | LOW | Use a discriminated union: `type AnalysisStatus = "idle" \| "checking-cache" \| "generating" \| "done" \| "error"`. TanStack Query's `isFetching` vs `isPending` distinction maps naturally to this. |
| URL-based navigation for Analysis page | The Analysis page uses `location.state` from React Router, which means every browser refresh shows "No analysis found." Users cannot bookmark or share analyses. This is a data-loss bug. | MEDIUM | Store the analysis result in the database with a stable ID (already present in SQLite). Navigate to `/analysis/:id`. The Analysis page fetches by ID on mount, making refresh safe. |
| Input validation (frontend + backend) | Currently only a `.trim()` check. Empty strings after trim, strings over 2000 chars, and whitespace-only inputs all reach the Gemini API. Backend has no validation at all — only `if (!sentence)`. | LOW | Frontend: validate min 10 chars, max 2000 chars, show inline message before submit. Backend: same validation as a guard clause before any DB or API call. Return `400` with a structured error body. |
| Extract `Analysis.tsx` into step components | At 547 lines with 6 analysis steps, multiple useState calls, and save handlers all in one file, this component is untestable and unmaintainable. Every edit risks breaking unrelated steps. | HIGH | Each step (Skeleton, Modifiers, StructureTree, Meaning, Chunks, Quiz) becomes its own component. Props are typed. The parent `Analysis.tsx` only handles navigation between steps and passes data down. |
| Route/controller separation in `server.ts` | All 7 routes live in one 120+ line file. Adding a new route means editing the entry point. Business logic, validation, and HTTP concerns are mixed. This is the Express equivalent of the Analysis.tsx monolith. | MEDIUM | Create `src/routes/` (route registration only) and `src/controllers/` (handler logic). Optionally add `src/services/` for DB queries if query logic is complex. This is the standard three-layer Express pattern. |
| Custom hooks for shared fetch logic | The same `try { setLoading(true); const data = await fetch(...) } catch { alert(...) } finally { setLoading(false) }` pattern appears in Home.tsx, Analysis.tsx, and Library.tsx. Any change must be made in three places. | LOW | Create `useApiQuery` and `useApiMutation` custom hooks, or adopt TanStack Query which eliminates this boilerplate entirely. If using TanStack Query, custom hooks become thin wrappers around `useQuery`/`useMutation`. |
| TanStack Query for server state | Manual `useEffect` + `useState` fetch patterns lack: deduplication, background refresh, cache invalidation, and request cancellation. TanStack Query provides all of this with zero custom code. | MEDIUM | Install `@tanstack/react-query`. Wrap app in `QueryClientProvider`. Replace all `useEffect`-based fetches with `useQuery`. Replace POST/DELETE operations with `useMutation`. This eliminates the custom hook boilerplate entirely and provides the loading state differentiation above for free via `isPending` vs `isFetching`. |
| Test infrastructure with Vitest | Zero test coverage means every change is a gamble. Bugs discovered in production, regressions uncatchable. The test infrastructure must exist before the refactor can be validated as safe. | MEDIUM | Install Vitest + `@testing-library/react` + `jsdom`. Configure `vitest.config.ts`. Write tests for: utility functions (pure functions, easiest), custom hooks (`renderHook`), and at minimum the critical analysis submission flow. |

### Differentiators (Raise the Quality Bar Beyond the Minimum)

These patterns separate "it works and is clean" from "it is genuinely well-engineered." They are not required for the refactor to succeed, but each one pays dividends over the project's lifetime.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Discriminated union types for async state | Instead of three booleans (`isLoading`, `isError`, `isSuccess`) that can produce 8 combinations (only 3 of which are valid), a discriminated union `DataState<T> = LoadingState \| ErrorState \| SuccessState<T>` makes invalid states unrepresentable in the type system. TypeScript enforces exhaustive handling at every call site. | LOW | Define once in a `types/` directory. Use as the return type for all data-fetching hooks. Requires TypeScript strict mode (already present). |
| Centralized Express error middleware | Currently each route handler has its own `catch (error: any) { res.status(500).json({ error: error.message }) }`. A centralized error handler (`app.use((err, req, res, next) => ...)`) gives consistent error response shape, one place to add logging, and routes that read as happy-path only. | LOW | Create `AppError` class with `statusCode` and `message`. Throw `new AppError('Not found', 404)` from controllers. One middleware at the bottom of `server.ts` catches all errors and formats the response. This is the Express-recommended pattern per official docs. |
| Zod validation on Express request bodies | Currently only manual `if (!sentence)` checks. Zod schemas on `req.body` give: automatic 400 responses for malformed input, typed `req.body` after validation, and reuse of the same schemas for frontend and backend validation. | LOW | Share a `schemas/` directory between frontend and backend. Both import from `shared/schemas.ts`. One source of truth for what constitutes a valid sentence. |
| React Error Boundary for the Analysis page | If any step component throws during render (e.g., Gemini returns a partial response), the entire page crashes with a white screen. An Error Boundary catches this, shows a friendly message, and lets the user retry without a full page reload. | LOW | A single `AnalysisErrorBoundary` class component wrapping the step renderer. This is the React-official pattern for catching render errors. Only class components can be Error Boundaries (React 19 introduces `use()`-based error handling, but class boundaries still work). |
| Query key factory pattern for TanStack Query | As the number of queries grows, ad-hoc query keys like `['analysis', id]` scattered across components become inconsistent and difficult to invalidate. A query key factory centralizes key definitions. | LOW | Create `queryKeys.ts` with objects like `analysisKeys.detail(id)`, `libraryKeys.all()`, `libraryKeys.savedSentences()`. When invalidating after a mutation, use `queryClient.invalidateQueries({ queryKey: analysisKeys.all() })`. |
| Timeout handling for Gemini calls | Gemini generation can take 5-15 seconds. Currently there is no timeout — the UI spins indefinitely on network errors or slow responses. A 30-second timeout with a specific "request timed out" error message is qualitatively better than an indefinite spinner. | LOW | Use `AbortController` with a 30-second timeout. Pass the signal to `fetch()`. Catch the `AbortError` and show "Analysis is taking longer than expected. Please try again." |
| Test coverage for critical paths | A basic test suite (utility functions + custom hooks) is table stakes. The differentiator is coverage of the critical user flow: sentence submission → cache check → analysis render. This flow is the single most important thing to protect against regression. | HIGH | Write an integration test that mocks the Gemini API response and the SQLite DB, submits a sentence, and asserts the analysis steps render correctly. This test is expensive to write but protects the core value of the product. |
| ESLint with TypeScript rules | Currently there is no ESLint config. Adding `@typescript-eslint/eslint-plugin` with `no-explicit-any`, `no-unused-vars`, and `consistent-type-imports` rules enforces the type safety work at the tooling level — future developers cannot accidentally reintroduce `any` types without a visible lint error. | LOW | Add `.eslintrc.json` with `@typescript-eslint/recommended` ruleset. Add lint script to `package.json`. Integrate with `tsc --noEmit` in a pre-commit check or CI step if used. |

### Anti-Features (Explicitly Do NOT Do These)

These are patterns that seem like good ideas during a refactor but create more problems than they solve in this specific context.

| Anti-Feature | Why It Seems Good | Why It's a Problem Here | Better Approach |
|--------------|-------------------|------------------------|-----------------|
| Full Clean Architecture (Domain / Use Case / Infrastructure layers) | Strict separation of concerns. Works great for large enterprise apps. | For a ~15-file codebase with 7 routes, adding Domain, Use Case, Interface, and Infrastructure layers means 4x more files, 4x more indirection, and near-zero real benefit. The refactor goal is maintainability, not academic purity. | Three-layer is sufficient: Routes (HTTP concerns) → Controllers (handler logic) → Services or direct DB calls. Stop there. |
| Global Redux or Zustand store for all state | Centralized state is predictable. | TanStack Query already handles server state. The remaining client state (active step in analysis, form input, tab selection) is component-local and does not benefit from a global store. Adding one creates unnecessary indirection. | Keep local state local (`useState`). Use TanStack Query for server state. Reach for a global store only if multiple unrelated components truly need shared client state — which this app currently does not have. |
| Optimistic updates for all mutations | Better perceived performance. | Optimistic updates require rollback logic when mutations fail. For this app (save sentence, save chunk, delete), the operations are fast (~50ms SQLite write) and failures are rare. The complexity of rollback is not worth the marginal UX improvement. | Use `invalidateQueries` after mutations. The refetch is fast. Reserve optimistic updates for operations that are genuinely slow. |
| 100% unit test coverage mandate | High coverage = high quality (perceived). | Chasing 100% coverage on a 15-file brownfield codebase leads to testing implementation details, brittle tests that break on internal refactors, and tests that give false confidence. | Target behavior coverage, not line coverage. Write tests for: all utility functions (pure), all custom hooks (behavior), and the critical analysis submission flow. Aim for 60-70% meaningful coverage rather than 90% superficial coverage. |
| Pagination for Library page | Scales to thousands of records. | This is a single-user personal tool. The library is unlikely to grow beyond a few hundred entries. Pagination adds UI complexity (page controls, URL state, cursor management) for a problem that does not yet exist. | If the Library page becomes slow, add it then. For now, a single `SELECT` with a reasonable `LIMIT 200` is sufficient. Flag for future consideration in PITFALLS.md. |
| Database migrations system | Professional schema management. | The schema is stable and out of scope per PROJECT.md constraints. Adding a migration system (drizzle-kit, Flyway) is a prerequisite for safe schema changes, but zero schema changes are planned for this refactor. | Add a comment in `src/db/index.ts` noting that schema changes will require migration infrastructure. Document it as future work. Don't build it now. |
| SSR or React Server Components | Modern React patterns, better initial load. | The app is deployed as a local-first SPA served by Express static. RSC requires a Node.js rendering layer and fundamentally changes how data fetching works. PROJECT.md explicitly calls this out of scope. | Keep client-side SPA. TanStack Query handles caching well enough for this use case. |
| Comprehensive JSDoc on all functions | Better IDE autocomplete and documentation. | Agreeable in principle, but writing JSDoc for all ~60 functions in a 15-file codebase during a refactor adds significant time cost for marginal benefit when TypeScript types already provide most of the autocomplete value. | Add JSDoc only where the function's behavior is non-obvious from its name and TypeScript signature. Focus JSDoc energy on the `analyzeSentence` function and the Gemini schema definition, where the behavior is complex. |

---

## Feature Dependencies

```
Zod schemas for Gemini response
    └──enables──> TypeScript strict types (inferred from schema)
    └──enables──> API response validation (safeParse in services/ai.ts)
    └──enables──> Zod on Express req.body (shared schema directory)

TanStack Query
    └──requires──> TypeScript strict types (query return types must be typed)
    └──replaces──> Custom fetch hooks (no longer needed)
    └──enables──> Loading state differentiation (isPending vs isFetching)
    └──enables──> Query key factory (organizes invalidation)

URL-based navigation (/analysis/:id)
    └──requires──> Analysis stored in DB with stable ID (already true)
    └──enables──> TanStack Query fetch-by-ID on Analysis page

Extract Analysis.tsx into step components
    └──requires──> TypeScript strict types (props must be typed)
    └──enables──> React Error Boundary (wraps step renderer)
    └──enables──> Unit tests for individual steps

Route/controller separation
    └──enables──> Centralized Express error middleware
    └──enables──> Zod validation on req.body (in controller, not route)

Test infrastructure (Vitest setup)
    └──requires──> TypeScript strict types (test helpers must compile)
    └──enables──> Custom hook tests (renderHook)
    └──enables──> Critical path integration test
    └──requires──> Component decomposition (monolith is hard to test in isolation)

ESLint with TypeScript rules
    └──requires──> TypeScript strict types (enforces no-explicit-any retroactively)
    └──enhances──> All other quality work (prevents regression)

Input validation (frontend)
    └──enhances──> Replace alert() with error states (validation errors use same error display)

Timeout handling for Gemini
    └──requires──> Loading state differentiation (timeout needs a "timeout" state)
    └──enhances──> Replace alert() with error states (timeout shows inline message)
```

### Dependency Notes

- **Zod schemas must come first:** They unblock TypeScript types (via inference) AND backend validation. Without them, strict TypeScript types require writing interfaces by hand that will drift from the actual Gemini response shape.
- **TypeScript strict types before component decomposition:** Extracting Analysis.tsx into typed step components requires knowing the prop types. Doing decomposition with `any` props defeats the purpose.
- **TanStack Query replaces custom hooks:** If TanStack Query is adopted (as planned per PROJECT.md), do not also build a custom `useFetch` hook — it will be redundant. The decision is either/or.
- **Component decomposition before integration tests:** Writing an integration test for the analysis flow against a 547-line monolith is painful. Decompose first, then test individual steps.

---

## MVP Definition (for this Refactor Milestone)

### Phase 1: Foundation (must complete before other phases)

These items unblock everything else. Without them, later work is built on sand.

- [ ] Define TypeScript interfaces + Zod schemas for all API response shapes — this is the single most unblocking action
- [ ] Configure Vitest and write one passing test — proves the test infrastructure works before writing real tests
- [ ] Configure ESLint with `@typescript-eslint/recommended` — surfaces the full scope of `any` usage

### Phase 2: Core Refactor (the actual quality improvements)

- [ ] Replace all `alert()` calls with component-level error states — most visible UX fix
- [ ] Implement loading state differentiation (`AnalysisStatus` discriminated union) — enables correct user feedback
- [ ] Install TanStack Query, replace all `useEffect` fetches — eliminates the duplicate fetch pattern everywhere at once
- [ ] Extract Analysis.tsx into 6 step components with typed props — the biggest architectural improvement
- [ ] Route/controller separation in server.ts + centralized error middleware — makes backend match frontend quality

### Phase 3: Polish and Protection

- [ ] URL-based navigation for Analysis page (`/analysis/:id`) — fixes data loss on refresh
- [ ] Input validation frontend + backend — prevents bad data reaching Gemini
- [ ] Zod validation on Express request bodies (req.body) — closes the server-side validation gap
- [ ] Timeout handling for Gemini calls with `AbortController` — prevents indefinite loading
- [ ] Tests: utility functions, custom hooks, critical analysis flow — protects against regression

### Defer to Future

- [ ] Pagination for Library — only needed if library grows large
- [ ] Database migration system — only needed before schema changes
- [ ] Full JSDoc coverage — low ROI given TypeScript types already provide most value

---

## Feature Prioritization Matrix

| Feature | Maintainability Value | Implementation Cost | Priority |
|---------|----------------------|---------------------|----------|
| TypeScript strict types + Zod schemas | HIGH | MEDIUM | P1 |
| Replace alert() with error states | HIGH | LOW | P1 |
| Loading state differentiation | HIGH | LOW | P1 |
| TanStack Query adoption | HIGH | MEDIUM | P1 |
| Extract Analysis.tsx into step components | HIGH | HIGH | P1 |
| Route/controller separation | HIGH | MEDIUM | P1 |
| Test infrastructure (Vitest setup) | HIGH | MEDIUM | P1 |
| URL-based navigation fix | MEDIUM | MEDIUM | P2 |
| Input validation (frontend + backend) | MEDIUM | LOW | P2 |
| Centralized Express error middleware | MEDIUM | LOW | P2 |
| Timeout handling for Gemini | MEDIUM | LOW | P2 |
| ESLint TypeScript rules | MEDIUM | LOW | P2 |
| React Error Boundary | MEDIUM | LOW | P2 |
| Query key factory | LOW | LOW | P3 |
| Tests: critical path integration | HIGH | HIGH | P2 |
| Zod on Express req.body | MEDIUM | LOW | P2 |
| Discriminated union async state | MEDIUM | LOW | P2 |

**Priority key:**
- P1: Required for refactor to achieve its stated goals
- P2: Should be included in this milestone
- P3: Nice to have, consider for next milestone

---

## Sources

- [TanStack Query Overview](https://tanstack.com/query/latest/docs/framework/react/overview) — official docs for loading state patterns (HIGH confidence)
- [TanStack Query: Queries](https://tanstack.com/query/v4/docs/react/guides/queries) — isPending vs isFetching distinction (HIGH confidence)
- [Zod Introduction](https://zod.dev/) — official docs, runtime validation patterns (HIGH confidence)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html) — official Express docs for centralized error middleware (HIGH confidence)
- [React: Thinking in React](https://react.dev/learn/thinking-in-react) — component decomposition principles (HIGH confidence)
- [Vitest Coverage Config](https://vitest.dev/config/coverage) — official Vitest docs (HIGH confidence)
- [TypeScript with React Best Practices 2026](https://medium.com/@mernstackdevbykevin/typescript-with-react-best-practices-2026-78ce4546210b) — discriminated union state patterns (MEDIUM confidence)
- [Express.js Scalable Patterns 2026](https://thelinuxcode.com/expressjs-tutorial-2026-practical-scalable-patterns-for-real-projects/) — three-layer architecture (MEDIUM confidence)
- [React Component Architecture Best Practices](https://rtcamp.com/handbook/react-best-practices/component-architecture/) — single responsibility, decomposition patterns (MEDIUM confidence)
- [State Management in React 2026](https://www.c-sharpcorner.com/article/state-management-in-react-2026-best-practices-tools-real-world-patterns/) — server state vs client state separation (MEDIUM confidence)

---

*Feature research for: React + Express refactor (Sentence Scaffold)*
*Researched: 2026-03-10*
