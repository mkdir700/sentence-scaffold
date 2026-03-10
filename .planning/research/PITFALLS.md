# Pitfalls Research

**Domain:** Brownfield React/Express refactor — TypeScript strict mode, TanStack Query migration, component decomposition
**Researched:** 2026-03-10
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: Breaking the Analysis Page Flow by Changing Navigation Before the Data Layer Is Ready

**What goes wrong:**
The current Analysis page reads from `location.state?.analysis` — a navigation payload. If you add URL-based navigation (fix the page-refresh bug) in a different phase than the TanStack Query data-fetching migration, you create a window where neither data source is reliable. The page renders "No analysis found" for any route the user lands on directly.

**Why it happens:**
The two concerns feel separate — "fix the URL" vs. "add TanStack Query" — so they get phased apart. But they share the same data contract: where does `analysis` come from? Splitting them creates an in-between state where the old source is gone and the new source is not yet wired up.

**How to avoid:**
Treat the URL-based navigation refactor and the `useQuery` hook for fetching analysis-by-id as a single atomic change. The sequence is: (1) ensure the backend GET `/api/analysis/:id` endpoint exists and returns full analysis data, (2) make the Analysis page read from `useQuery` with the id param, (3) only then remove the `location.state` fallback. Never remove the old data source before the new one is verified working.

**Warning signs:**
- A phase that mentions "URL-based navigation" without also mentioning the corresponding GET endpoint and `useQuery` hook.
- The Analysis page is modified in one phase and the API endpoint is added in a different, later phase.
- `location.state?.analysis` is removed or becomes unreachable without a fallback `useQuery` in place.

**Phase to address:**
The phase that introduces URL-based navigation for the Analysis page. This pitfall is the most likely source of total feature regression.

---

### Pitfall 2: Enabling `strict: true` in tsconfig in One Shot on a Codebase Full of `any`

**What goes wrong:**
The entire TypeScript compiler emits errors on every file at once. The team either (a) spends a sprint doing mechanical `any` fixes with no guarantee of correctness, or (b) silences errors with `// @ts-ignore` and `as any` casts scattered throughout, creating a false sense of type safety that is worse than the original state.

**Why it happens:**
"Enable strict mode" sounds like a single config change. It is actually a migration. This codebase has `any` in all three page files, in service files, in database query results, and in component props. The Gemini response schema in `src/services/ai.ts` has optional/unclear fields — strict null checks will surface dozens of potential `undefined` access bugs immediately.

**How to avoid:**
Enable individual strict flags one at a time in dependency order:
1. `noImplicitAny` first — forces explicit annotation of all the `any` parameters (e.g., `chunk: any`, `comp: any`). Fix by defining actual interfaces.
2. `strictNullChecks` second — this is where `analysis.sentence` crashes if `analysis` is undefined become compiler errors. Fix each one with proper guards.
3. `strictFunctionTypes`, `strictPropertyInitialization` after the above are clean.

Never use `as any` as a fix — use `unknown` + type narrowing, or define the real interface. The Gemini schema types in `ai.ts` must be defined as proper interfaces before `strictNullChecks` is enabled, or rendering code will have hundreds of errors.

**Warning signs:**
- tsconfig change and type definition phase are in different roadmap phases.
- The phase enabling strict mode does not also include defining shared types for the Gemini API response schema.
- `as any` appears in diffs during the TypeScript phase.
- The phrase "enable strict mode" appears in a task without a corresponding "define interfaces for API responses" task.

**Phase to address:**
The TypeScript types phase. Define all shared interfaces (`AnalysisResult`, `ExpressionChunk`, `HistoryItem`, etc.) before flipping any strict flags.

---

### Pitfall 3: Migrating `useEffect`/`fetch` to TanStack Query While Mutations Still Use Raw `fetch`

**What goes wrong:**
After migrating reads to `useQuery`, the mutation side (`handleSaveSentence`, `handleSaveChunk`) still uses raw `fetch` calls with manual `setIsSaving` state. The Library page's query cache never gets invalidated when a save succeeds. The user sees the save appear to succeed but the library list does not update until a manual refresh.

**Why it happens:**
`useQuery` is easy to understand as a drop-in for `useEffect + fetch`. `useMutation` feels optional because "the POST still works." Teams migrate reads first and defer mutations, leaving the cache in a permanently stale state.

**How to avoid:**
Migrate reads and their corresponding mutations in the same phase, per feature. When `GET /api/history` becomes a `useQuery`, also convert `POST /api/save` and `POST /api/chunks` to `useMutation` with `onSuccess: () => queryClient.invalidateQueries(['history'])`. The rule: every `useMutation` that modifies data owned by a `useQuery` must invalidate that query on success.

**Warning signs:**
- A phase description says "migrate data fetching to TanStack Query" but does not mention mutations or `invalidateQueries`.
- `setIsSaving`, `setIsLoading` boolean state still exists in components after the TanStack Query phase.
- The Library page data is not refreshed after a save from the Analysis page.

**Phase to address:**
The TanStack Query migration phase. Include mutation side in scope for each feature migrated.

---

### Pitfall 4: Extracting Sub-Components from Analysis.tsx Without Defining Shared Types First

**What goes wrong:**
Component decomposition begins before `AnalysisResult` and related interfaces are defined. Each extracted sub-component (e.g., `<ModifiersStep>`, `<ChunksStep>`) defines its own local prop types inline. Some use `any[]`, some invent conflicting shapes. When types are later defined properly in the TypeScript phase, all the sub-component props must be re-typed. The decomposition phase creates rework for the types phase.

**Why it happens:**
Component extraction and TypeScript typing feel like two separate refactor tasks. In a brownfield project, they interact because the existing 547-line component passes `analysis` fields through as `any`, meaning the prop types of extracted components inherit that `any`.

**How to avoid:**
Define the `AnalysisResult` interface (and all nested types: `SentenceType`, `MainClause`, `Component`, `StructureNode`, `Meaning`, `KeyPoint`, `ExpressionChunk`, `ReviewSummary`, `QuizItem`) before beginning component extraction. Each extracted component receives typed props. No `any[]` in `.map()` calls.

**Warning signs:**
- Component decomposition phase is scheduled before or independently of the TypeScript types phase.
- Sub-component prop types use inline `{ [key: string]: any }` or `any[]`.
- The `Tree` and `QuizCard` functions inside `Analysis.tsx` become separate files but their `nodes: any[]` signature is carried forward unchanged.

**Phase to address:**
Types phase must precede or be co-located with the component decomposition phase.

---

### Pitfall 5: Keeping `location.state` as a Fallback After Adding URL Navigation

**What goes wrong:**
To "be safe," the team keeps the `location.state?.analysis` fallback after adding URL-based navigation. The app works in both modes, tests pass, and the fallback is forgotten. Six months later the fallback is the only path that works in some edge case (e.g., direct navigation from History page), creating an inconsistent data flow that is impossible to reason about.

**Why it happens:**
Backward compatibility during transition feels responsible. The fallback is never cleaned up because it "still works."

**How to avoid:**
The transition should have a clear cutover: once `useQuery` + URL param is the canonical data source and is tested, remove `location.state` entirely. Add this as an explicit task in the refactor phase, not a follow-up. The test that validates "Analysis page loads correctly when navigated to directly by URL" is the completion criterion.

**Warning signs:**
- Both `location.state?.analysis` and `useParams()` are present in the same component after the navigation refactor phase.
- No test covering direct URL navigation to `/analysis/:id`.

**Phase to address:**
URL navigation + TanStack Query phase. Cleanup must be part of the same phase, not deferred.

---

### Pitfall 6: Adding TanStack Query Without Wrapping the App in `QueryClientProvider`

**What goes wrong:**
`useQuery` calls throw at runtime because `QueryClientProvider` is missing from the component tree. This is silent during component development and only surfaces when the component renders in the app.

**Why it happens:**
Library setup (provider setup in `main.tsx`) is treated as a minor detail and skipped during initial implementation. The developer tests components in isolation and misses the provider requirement.

**How to avoid:**
Make `QueryClientProvider` setup in `main.tsx` the first task of the TanStack Query phase, before writing any `useQuery` calls. Configure `staleTime` and `retry` in the same `QueryClient` instantiation — `retry: 1` on client (default 3 is too aggressive for a single-user tool), and configure `gcTime` appropriate for the use case.

**Warning signs:**
- `useQuery` is added to a component before `QueryClientProvider` is added to `main.tsx` in the same PR or phase.
- No task for "configure QueryClient defaults" in the TanStack Query phase.

**Phase to address:**
First task of the TanStack Query migration phase.

---

### Pitfall 7: Vitest Tests That Hit Real SQLite and Become Order-Dependent

**What goes wrong:**
Integration tests against the Express backend use the real SQLite database at `data/app.db`. Tests pass in isolation but fail in CI or when run in a different order because rows inserted by one test affect assertion counts in another.

**Why it happens:**
SQLite in-memory databases feel like overkill for a "simple" project. Tests are written against the real DB path because it is already configured in `src/db/index.ts`.

**How to avoid:**
Use `better-sqlite3` in-memory mode (`new Database(':memory:')`) for tests. Inject the DB instance via a module-level setter or environment variable that points `src/db/index.ts` to an in-memory path during tests. Alternatively, use `vi.mock` to replace the DB module with a fake. Each test suite should create a fresh schema via the same `CREATE TABLE` statements used in production. Vitest's `--pool=forks` is required when using `fetch` in tests against the Express server.

**Warning signs:**
- Test setup does not include schema creation or DB teardown.
- Tests import `db` from `src/db/index.ts` directly without any environment override.
- Tests pass alone but fail when run with `vitest run`.

**Phase to address:**
The test infrastructure phase. Database test isolation strategy must be defined before writing any integration tests.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep `as any` casts during TypeScript migration | Compiler errors go away faster | Type safety is illusory; bugs hide behind casts; future refactors are not safer | Never — use `unknown` + narrowing instead |
| Skip `useMutation` and keep raw `fetch` for POSTs | Less code to change in TanStack Query phase | Cache goes stale silently; Library page never reflects saves without a refresh | Never during this refactor |
| Inline component prop types as `any[]` during decomposition | Decomposition phase finishes faster | Types phase must redo all prop definitions; inconsistent shapes across sub-components | Never — define shared types before decomposing |
| Use `alert()` for error feedback during refactor to "fix later" | Error handling phase can be deferred | `alert()` blocks the browser thread; error states never get implemented | Only if error handling is the explicit next phase |
| Leave `location.state` fallback after URL navigation is added | Safer transition with backward compat | Dual data sources make the flow untestable and confusing long-term | Never — clean up in the same phase |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TanStack Query v5 | Using `isLoading` to mean "first load in progress" | In v5, `isLoading` = `isPending && isFetching`. Use `isPending` for "no data yet" and `isLoading` only if you need "no data AND currently fetching." |
| TanStack Query v5 | Using `onSuccess`/`onError` callbacks on `useQuery` | These were removed in v5. Use `useEffect` watching `data`/`error`, or use `useMutation`'s `onSuccess`/`onError` which still exist. |
| TanStack Query v5 | Single function call `useQuery(key, fn, opts)` — the three-argument signature | v5 uses a single options object: `useQuery({ queryKey: [...], queryFn: async () => ... })` |
| Gemini API | Trusting JSON.parse of the response without validation | Gemini can return structurally valid JSON that violates the expected schema. Use Zod to parse the response against the schema definition; treat a Zod parse failure as a retryable error. |
| Express + Vitest | Running `supertest` against the real server port | Start the Express app without calling `.listen()` in tests — pass the `app` object directly to `supertest(app)` to avoid port conflicts and cleanup issues. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| TanStack Query `staleTime: 0` (default) refetches on every window focus | History list refetches every time user switches tabs; network waterfall on every focus event | Set `staleTime: 30_000` (30s) for history/library queries that do not change frequently | Immediately visible in development with React DevTools network tab |
| Library page loads all history + saved + chunks simultaneously on mount | Slow initial render; three parallel API calls block each other | With TanStack Query, split into three separate `useQuery` calls with independent loading states; only fetch the active tab's data | Noticeable at 50+ records; problematic at 200+ |
| Analysis page re-renders all 6 steps on every `step` state change | Visible animation stutter on "Continue" button press as all visible steps re-render | Extract each step into its own `React.memo`-wrapped component with stable props | Noticeable at 6 steps; will worsen if more steps are added |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Passing raw `req.body.sentence` directly as a template literal into the Gemini prompt | Prompt injection — a crafted sentence can override AI instructions or leak system prompt | Validate and sanitize input before inserting into the prompt; enforce a maximum length (2000 chars) on the backend before constructing the prompt |
| No response validation on Gemini output before JSON.parse | Malformed Gemini response crashes the server with an unhandled exception | Wrap `JSON.parse` in a try-catch; validate the parsed object with Zod against the expected schema; return a 422 with a user-readable message on failure |
| SQLite `.get()` and `.run()` results cast to `any` in server.ts | Accessing non-existent fields silently returns `undefined`, causing downstream 500 errors | Define `interface` types for each DB row shape; use TypeScript to enforce property access at compile time |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Single loading state for both cache-hit (instant) and new AI generation (5-30s) | User waits with no feedback during AI calls; does not know if the request is stuck | Differentiate: "Checking..." spinner for the cache lookup (under 500ms), then "Generating analysis..." with estimated wait for new AI calls |
| `alert()` for save errors | Browser alert blocks the page; no way to retry from the alert; jarring UX | Inline error state in the component with a retry button; toast notification for success |
| Analysis page shows "No analysis found" on refresh with no explanation | User thinks the app is broken; cannot get back to their sentence without re-entering it | After URL-based navigation is implemented, this error state should include the original sentence and a "Re-analyze" button |

---

## "Looks Done But Isn't" Checklist

- [ ] **TanStack Query migration:** Verify that `queryClient.invalidateQueries` is called after every mutation that modifies data owned by a query. Missing invalidation means the Library page silently shows stale data.
- [ ] **TypeScript strict mode:** Verify `noImplicitAny` catches all `.map((item: any) =>` patterns. Grep for `: any` in `src/` after the types phase — any remaining are type safety gaps.
- [ ] **Component decomposition:** Verify extracted step components render correctly when their parent `Analysis` page is loaded via direct URL (not navigation state). Missing: tests covering this.
- [ ] **Error handling:** Verify `alert()` is completely absent from the codebase after the error handling phase. Search for `window.alert` and `alert(` — both patterns exist in the current codebase.
- [ ] **URL-based navigation:** Verify the Analysis page loads its data from the URL id via `useQuery`, not from `location.state`. Test: navigate to `/analysis/1` in a fresh browser tab — it must load without the Home page flow.
- [ ] **Vitest setup:** Verify tests do not touch the real `data/app.db`. Check that `beforeEach`/`afterEach` includes schema setup and teardown for integration tests.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Analysis page broken due to navigation + data source split | HIGH | Revert the navigation change, restore `location.state` as primary source, redo as atomic change |
| `as any` casts proliferated during TypeScript phase | MEDIUM | Grep for `as any`, replace with `unknown` + type guard one file at a time; prioritize files in the render path |
| Library cache never invalidates after saves | LOW | Add `onSuccess: () => queryClient.invalidateQueries(['library'])` to each relevant `useMutation`; verify with a manual test of save + view in library |
| Tests hit real DB and became order-dependent | MEDIUM | Add `beforeEach` to recreate schema in in-memory DB; move DB path to an environment variable overridable in tests |
| `QueryClientProvider` missing, runtime errors on every `useQuery` | LOW | Add `QueryClientProvider` to `main.tsx`, configure `QueryClient` with appropriate defaults |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Analysis page data source split (Pitfall 1) | URL navigation + TanStack Query phase (must be atomic) | Direct URL navigation to `/analysis/:id` loads data without going through Home page first |
| Strict mode enabled before types defined (Pitfall 2) | TypeScript types phase — types must precede `strict: true` | Zero `as any` in `src/`; `tsc --noEmit` passes with `strict: true` |
| Reads migrated without mutations (Pitfall 3) | TanStack Query migration phase | After saving a sentence, the Library page shows it without refresh |
| Components decomposed before types defined (Pitfall 4) | Types phase must precede or be combined with decomposition phase | All sub-component props are typed with shared interfaces, zero `any[]` in `.map()` |
| Stale `location.state` fallback (Pitfall 5) | URL navigation phase — cleanup in same phase | `location.state` does not appear in Analysis.tsx after this phase |
| Missing `QueryClientProvider` (Pitfall 6) | First task of TanStack Query phase | `main.tsx` includes `QueryClientProvider` wrapping `<App />` before any `useQuery` calls are added |
| Tests hit real SQLite (Pitfall 7) | Test infrastructure phase | `data/app.db` is never read or written during `vitest run` |

---

## Sources

- [TanStack Query v5 Migration Guide](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5) — official, authoritative
- [TanStack Query Optimistic Updates](https://tanstack.com/query/v4/docs/framework/react/guides/optimistic-updates) — official
- [TanStack Query Mutations v5](https://tanstack.com/query/v5/docs/react/guides/mutations) — official
- [TypeScript TSConfig strict option](https://www.typescriptlang.org/tsconfig/strict.html) — official
- [React component composition patterns](https://www.developerway.com/posts/components-composition-how-to-get-it-right) — MEDIUM confidence, well-regarded source
- [Good Refactoring vs Bad Refactoring](https://www.builder.io/blog/good-vs-bad-refactoring) — MEDIUM confidence
- [Vitest Getting Started](https://vitest.dev/guide/) — official
- [Testing Node.js RESTful APIs with Vitest](https://danioshi.substack.com/p/how-to-test-your-nodejs-restful-api) — MEDIUM confidence
- Codebase audit: `.planning/codebase/CONCERNS.md` — direct code review
- Direct reading of `src/pages/Analysis.tsx`, `src/pages/Home.tsx` — direct code review

---
*Pitfalls research for: Sentence Scaffold brownfield refactor (React/Express/TypeScript/TanStack Query)*
*Researched: 2026-03-10*
