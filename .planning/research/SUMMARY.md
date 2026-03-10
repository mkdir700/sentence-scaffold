# Project Research Summary

**Project:** Sentence Scaffold
**Domain:** Brownfield React + Express full-stack refactor (AI-powered sentence analysis tool)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

Sentence Scaffold is a single-user local SPA that analyzes English sentences through Google Gemini and presents results across 6 structured steps (Skeleton, Modifiers, Structure Tree, Meaning, Chunks, Quiz). The current codebase works functionally but has accumulated structural debt: `any` types throughout all files, `alert()` for every error, data lost on page refresh due to React Router state, and a 547-line monolithic Analysis component that is effectively untestable. The research consensus is clear — this is a well-understood brownfield refactor pattern with all recommended tools stable and mature.

The recommended approach is a layered refactor in strict dependency order. Shared TypeScript interfaces and Zod schemas must come first because every subsequent step (component decomposition, TanStack Query migration, backend separation) requires typed contracts. Once types are established, the core refactor can proceed in parallel-ish tracks: frontend state management via TanStack Query and backend route/controller/service separation. The final phase hardens the result with validation, URL-based navigation, Gemini timeout handling, and test coverage.

The primary risk is sequencing errors. Research identified 7 specific pitfalls, all of which are ordering problems rather than technical unknowns: enabling `strict: true` before defining interfaces, decomposing components before types exist, migrating query reads without also migrating mutations, and splitting the URL-navigation fix from the data-fetch migration. None of these risks are novel — they are well-documented antipatterns for this class of refactor. All are avoidable with correct phase ordering and atomic scope definitions.

---

## Key Findings

### Recommended Stack

The existing stack (React 19, Express 4, SQLite/better-sqlite3, Vite 6, Tailwind 4, TypeScript 5.8, React Router 7) is sound and should not change. The refactor adds three production dependencies and a testing stack. TanStack Query v5 replaces all manual `useEffect`/`fetch`/`useState` server state patterns, providing caching, deduplication, and `isPending`/`isFetching` state differentiation with zero custom infrastructure. Zod v4 provides runtime validation for Gemini API responses (TypeScript types alone cannot protect against malformed AI output) and doubles as the single source of truth for types via `z.infer<>`. The testing stack (Vitest v4, @testing-library/react v16, jsdom) is Vite-native and zero-configuration given the existing `vite.config.ts`.

The single most important configuration change is enabling `"strict": true` in `tsconfig.json`. This is currently missing, which is why `any` types are freely accepted throughout the codebase. This change must be paired with interface definitions — not done alone.

**Core technologies:**
- React 19 + React Router 7: Keep as-is; use `useParams` to fix data-loss-on-refresh
- TanStack Query v5.90+: Replace all manual fetch patterns; requires `QueryClientProvider` in `main.tsx` as first step
- Zod v4.3+: Runtime validation of Gemini responses + shared schema/type source of truth
- Vitest v4 + @testing-library/react v16: Vite-native testing; v16 required for React 19 compatibility
- TypeScript `strict: true`: Surfaces all existing `any` usage; must be enabled only after types are defined
- better-sqlite3 generics: Typed DB queries without an ORM (2-table schema does not warrant Drizzle/Prisma)

### Expected Features

Research reframes "features" as code quality improvements — the user-facing functionality stays unchanged. The refactor's deliverables are maintainability and reliability improvements.

**Must have (table stakes):**
- TypeScript strict types + Zod schemas — every `any` is a live runtime hazard; all API boundaries must be typed
- Replace `alert()` with component-level error states — `alert()` is untestable, unstyled, and blocks the UI thread
- TanStack Query adoption — eliminates the triplicated `try/catch/setLoading` pattern across 3 pages
- Extract Analysis.tsx into 6 step components — 547-line monolith is the single biggest maintainability block
- Route/controller/service separation in server.ts — backend mirrors the structural debt of the frontend
- Vitest test infrastructure — zero coverage means every change is untested; must exist before refactor is called safe
- URL-based navigation for Analysis page — `location.state` data loss is a functional bug, not a polish item

**Should have (quality polish):**
- Centralized Express error middleware — replaces per-route `catch (error: any)` boilerplate
- Input validation frontend + backend — prevents garbage reaching Gemini; backend has no validation beyond `if (!sentence)`
- Zod validation on `req.body` — closes server-side validation gap
- Gemini timeout handling via `AbortController` — prevents indefinite spinner on network issues
- ESLint with `@typescript-eslint/recommended` — enforces `no-explicit-any` at tooling level
- React Error Boundary for Analysis page — prevents white-screen crash on partial Gemini responses
- Loading state differentiation (`AnalysisStatus` discriminated union) — cache-hit (~50ms) vs AI generation (5-30s) need different UX

**Defer to future:**
- Database migration system — zero schema changes planned; add only before schema changes are needed
- Pagination for Library page — single-user tool unlikely to exceed a few hundred entries
- Full JSDoc coverage — TypeScript types already provide most autocomplete value; low ROI

### Architecture Approach

The target architecture is a standard 4-layer frontend (Pages → Feature Components → Custom Hooks → API Client) over a 3-layer backend (Routes → Controllers → Services) sharing a `src/types/` directory that both sides import from. This is not an academic architecture exercise — it directly maps to testability: services have no `req`/`res` dependency and are pure functions of inputs; custom hooks encapsulate all TanStack Query setup; components receive `{ data, isLoading, isError }` and render. State management is simple: TanStack Query owns all server state; `useState` owns all UI-only state (active step, form input, active tab). No Zustand, no Context for data.

**Major components:**
1. `src/types/` — Shared TypeScript interfaces (`AnalysisResult`, `Chunk`, `HistoryEntry`, etc.) imported by both frontend and backend; built first because everything depends on it
2. `src/api/` — Typed fetch wrappers per domain (`sentences.ts`, `chunks.ts`, `history.ts`); no component calls `fetch()` directly
3. `src/hooks/` — TanStack Query wrappers (`useAnalysis`, `useLibrary`, `useSaveChunk`); components only call hooks
4. `src/components/analysis/` — 6 step components extracted from Analysis.tsx monolith; each is independently testable
5. `server/routes` + `server/controllers` + `server/services` — HTTP wiring, request validation, and business logic are separated; services are the only layer that touches the DB

### Critical Pitfalls

1. **Analysis page data source split (Pitfall 1 + 5)** — URL navigation and the `useQuery`-by-id fetch must be a single atomic change. Never remove `location.state` before the GET endpoint and `useQuery` hook are both verified working. Leave no `location.state` fallback afterward.

2. **Strict mode enabled before types defined (Pitfall 2)** — Enabling `strict: true` on a codebase full of `any` without first defining shared interfaces produces hundreds of compiler errors. Enable flags incrementally: `noImplicitAny` first (define interfaces), `strictNullChecks` second (add guards). Never use `as any` as the "fix."

3. **Query reads migrated without mutations (Pitfall 3)** — Migrating `useEffect/fetch` to `useQuery` without also converting `POST`/`DELETE` operations to `useMutation` with `queryClient.invalidateQueries` leaves the cache permanently stale. The Library page will silently show outdated data after saves.

4. **Components decomposed before types defined (Pitfall 4)** — If Analysis.tsx is extracted before `AnalysisResult` and its nested interfaces exist, each sub-component invents its own prop types (often `any[]`). This creates rework. Types phase must precede or be combined with decomposition.

5. **Tests hitting real SQLite (Pitfall 7)** — Integration tests against `data/app.db` become order-dependent and fail in CI. Use `better-sqlite3` in-memory mode (`:memory:`) for all tests. Define the DB isolation strategy before writing any test.

---

## Implications for Roadmap

Based on the dependency graph across all four research files, the refactor requires 4 phases. The ordering is non-negotiable — each phase depends on the previous.

### Phase 1: Foundation — Types, Schemas, and Tooling

**Rationale:** Types and Zod schemas are the single most blocking dependency in the entire refactor. Every downstream phase — component decomposition, TanStack Query adoption, backend separation — requires knowing the shape of `AnalysisResult`, `Chunk`, `HistoryEntry`, etc. This phase also establishes the testing infrastructure so every subsequent phase can be verified. The "looks simple" trap of enabling `strict: true` first (Pitfall 2) is avoided by defining types before touching tsconfig.

**Delivers:**
- `src/types/` directory with all shared interfaces (`AnalysisResult`, `SentenceType`, `MainClause`, `Component`, `StructureNode`, `Meaning`, `ExpressionChunk`, `QuizItem`, `HistoryEntry`, `Chunk`)
- Zod schemas for the Gemini API response + shared `schemas/` directory accessible by both frontend and backend
- `"strict": true` enabled in tsconfig with zero `as any` workarounds
- Vitest + `@testing-library/react` v16 + jsdom configured; one passing smoke test as proof-of-life
- ESLint with `@typescript-eslint/recommended` configured; `no-explicit-any` rule active

**Avoids:** Pitfall 2 (strict mode before types), Pitfall 4 (decomposition before types)

**Research flag:** Standard patterns. No additional research needed — all tools are well-documented.

---

### Phase 2: Backend Separation

**Rationale:** Backend separation can proceed immediately after types are defined, and should happen before the frontend TanStack Query migration because the API contract must be stable before hooks are built against it. This phase also adds the GET `/api/analysis/:id` endpoint that the URL navigation fix (Phase 3) requires. Doing backend after types but before frontend query migration ensures hooks are built against a clean, typed API.

**Delivers:**
- `server/routes/` + `server/controllers/` + `server/services/` replacing the monolithic `server.ts`
- GET `/api/analysis/:id` endpoint (prerequisite for URL-based navigation fix in Phase 3)
- Centralized Express error middleware (`AppError` class, one error handler)
- Zod validation on all `req.body` inputs; 400 responses for malformed requests
- Input length validation (10–2000 chars) on the backend as a guard before Gemini calls
- Services are unit-testable without an HTTP server

**Avoids:** Pitfall 7 (DB isolation for service-level tests must be configured here)

**Research flag:** Standard patterns (Express route/controller/service separation is well-documented). No additional research needed.

---

### Phase 3: Frontend Core Refactor

**Rationale:** This is the highest-impact phase. TanStack Query replaces all manual `useEffect`/`fetch`/`setLoading` patterns in a single phase, and reads + mutations are migrated together per domain (avoiding Pitfall 3). Analysis.tsx decomposition happens in the same phase as TanStack Query adoption because the hooks produce typed data that becomes step component props — the two tasks reinforce each other. URL-based navigation is bundled with the `useQuery`-by-id hook as a single atomic change (avoiding Pitfall 1 + 5). The `location.state` fallback is removed in the same PR, not deferred.

**Delivers:**
- `QueryClientProvider` in `main.tsx` with configured `QueryClient` (first task, before any `useQuery` calls)
- `src/api/` client layer with typed domain modules (`sentences.ts`, `chunks.ts`, `history.ts`)
- `src/hooks/` with `useAnalysis(id)`, `useLibrary()`, `useSaveChunk()` — all wrapping TanStack Query
- All `useEffect`/`fetch` reads converted to `useQuery`; all POST/DELETE mutations converted to `useMutation` with `invalidateQueries`
- Analysis.tsx decomposed into 6 step components in `src/components/analysis/` with typed props
- URL-based navigation to `/analysis/:id` — `location.state` fully removed
- `alert()` fully replaced with inline error states across all pages
- `AnalysisStatus` discriminated union for loading state differentiation
- React Error Boundary wrapping the Analysis step renderer

**Avoids:** Pitfall 1 (navigation + data source split), Pitfall 3 (reads without mutations), Pitfall 5 (stale location.state fallback), Pitfall 6 (missing QueryClientProvider)

**Research flag:** TanStack Query v5 API changes need attention (v5 uses single options object, no `onSuccess`/`onError` on `useQuery`, `isPending` not `isLoading`). All documented in PITFALLS.md integration gotchas — review before implementation.

---

### Phase 4: Polish and Test Coverage

**Rationale:** Once the architecture is clean, tests can be written against stable interfaces rather than against a monolith. This phase adds Gemini timeout handling, input validation on the frontend, and the critical-path integration test. Tests are cheaper to write now because each step component is isolated and the service layer is pure.

**Delivers:**
- Frontend input validation (10–2000 chars, inline error message, no `alert()`)
- Gemini timeout via `AbortController` (30s) with specific "taking longer than expected" error state
- Unit tests for all utility functions and custom hooks (using `renderHook`)
- Integration test: sentence submission → cache check → analysis render (mocking Gemini + SQLite in-memory)
- Verification checklist from PITFALLS.md ("Looks Done But Isn't") run against all prior phases

**Avoids:** Pitfall 7 (DB isolation strategy applied to integration tests)

**Research flag:** Standard patterns. The DB isolation strategy (`:memory:` + `vi.mock`) and supertest patterns are documented in PITFALLS.md.

---

### Phase Ordering Rationale

- **Types before everything:** The feature dependency graph in FEATURES.md explicitly shows Zod schemas as the root node — they unblock TypeScript inference, API validation, and component prop typing simultaneously.
- **Backend before frontend hooks:** Frontend hooks are built against API contracts. Having the backend split and the GET `/api/analysis/:id` endpoint exist before writing `useAnalysis(id)` prevents the hook from being written against a nonexistent endpoint.
- **Navigation + TanStack Query atomic (Phase 3):** Pitfall 1 is the highest-severity risk in the entire refactor (rating: "most likely source of total feature regression"). Bundling these in Phase 3 as a single atomic change is the explicit recommendation from PITFALLS.md.
- **Tests last (but not too late):** Test infrastructure is set up in Phase 1 (smoke test + Vitest config), but comprehensive tests come in Phase 4 after the architecture is stable. Writing tests against the Phase 3 architecture is far cheaper than writing them against the original monolith.

### Research Flags

Phases requiring attention during planning:
- **Phase 3 (Frontend Core Refactor):** TanStack Query v5 has several breaking API changes from v4. Developers unfamiliar with v5 should review the migration gotchas in PITFALLS.md before writing any `useQuery`/`useMutation` calls. The query key factory pattern (FEATURES.md) should be designed upfront before multiple queries are added.

Phases with standard, well-documented patterns (no additional research needed):
- **Phase 1:** TypeScript strict mode migration and Vitest setup are extremely well-documented.
- **Phase 2:** Express route/controller/service pattern is a standard three-layer architecture with authoritative documentation.
- **Phase 4:** AbortController timeout pattern and @testing-library/react test patterns are stable and well-documented.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry as of 2026-03. Version compatibility matrix confirmed (TanStack Query v5 + React 19, RTL v16 + React 19, Vitest v4 + Vite 6). |
| Features | HIGH | Derived from direct codebase audit (CONCERNS.md, actual source files) + official docs. Not speculative — each feature addresses an identified defect. |
| Architecture | HIGH | Standard patterns grounded in official Express docs, React docs, and multiple corroborating sources. Codebase structure verified by direct file reading. |
| Pitfalls | HIGH | 7 of 7 pitfalls are grounded in direct code review of the actual codebase. Not generic "things that go wrong" — specific to the current code's state. |

**Overall confidence:** HIGH

### Gaps to Address

- **Gemini API schema stability:** The Zod schema for the Gemini response must be reverse-engineered from the current `src/services/ai.ts` schema definition and actual response shapes. If the Gemini structured output schema has changed since the app was written, Zod parsing will fail on real responses until the schema is updated. Validate Zod schema against a live Gemini call early in Phase 1.

- **`src/db/index.ts` test injection point:** The current DB singleton does not have an injection mechanism for swapping to `:memory:` in tests. Phase 1 should add an environment variable override (`DATABASE_PATH=':memory:'` or similar) before any integration tests are written. This is a small change but must happen before tests are written (Phase 1, not Phase 4).

- **Query key factory scope:** FEATURES.md lists the query key factory as a P3 (nice to have). However, Phase 3 will create at minimum 4 query keys (`['history']`, `['saved']`, `['chunks']`, `['analysis', id]`). Decide at the start of Phase 3 whether to implement the factory upfront (2-hour task) or retrofit it later. Retrofitting is cheap at 4 keys; it becomes expensive at 10+.

---

## Sources

### Primary (HIGH confidence)
- [TanStack Query v5 official docs](https://tanstack.com/query/v5/docs/framework/react) — API patterns, `isPending`/`isFetching`, v5 options object signature
- [TanStack Query v5 Migration Guide](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5) — breaking changes, removed callbacks
- [Zod v4 official docs](https://zod.dev/v4) — schema API, `safeParse`, `z.infer<>`
- [Vitest 4.0 official docs](https://vitest.dev/guide/) — config, `renderHook`, `--pool=forks`
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html) — centralized error middleware pattern
- [TypeScript TSConfig strict](https://www.typescriptlang.org/tsconfig/strict.html) — flag effects and incremental migration
- [@testing-library/react npm](https://www.npmjs.com/package/@testing-library/react) — v16 React 19 peer dep requirement
- Direct codebase audit: `src/pages/Analysis.tsx`, `src/pages/Home.tsx`, `src/pages/Library.tsx`, `server.ts`, `.planning/codebase/CONCERNS.md`

### Secondary (MEDIUM confidence)
- [React Project Structure — Robin Wieruch](https://www.robinwieruch.de/react-folder-structure/) — folder conventions
- [Separate Controllers from Services — Corey Cleary](https://www.coreycleary.me/why-should-you-separate-controllers-from-services-in-node-rest-apis) — Express layering rationale
- [TanStack Query Custom Hooks — Roman Slonov](https://romanslonov.com/blog/tanstack-query-reusable-custom-hooks) — hook abstraction pattern
- [React API Layer — Profy.dev](https://profy.dev/article/react-architecture-api-layer) — `src/api/` layer pattern
- [TypeScript React Patterns 2025 — dev.to](https://dev.to/muhammad_zulqarnainakram/typescript-patterns-every-react-developer-should-know-in-2025-2264) — discriminated union state

### Tertiary (LOW confidence)
- None — all findings were corroborated by multiple sources or direct code review.

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
