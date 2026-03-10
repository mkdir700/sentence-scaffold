# Phase 3: Frontend Core Refactor - Research

**Researched:** 2026-03-10
**Domain:** TanStack Query v5, React Router v7 URL params, React component decomposition, typed API client layer
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FEND-01 | Analysis.tsx decomposed into 6 step components (skeleton, modifiers, tree, meaning, chunks, quiz) | Decompose inline JSX blocks into `src/components/analysis/` — each step receives typed props from parent |
| FEND-02 | All server data fetching uses TanStack Query (no manual useEffect+fetch patterns) | `useQuery` replaces `useEffect+fetch` in Home and Library; mutation hooks replace manual fetch in Analysis save handlers |
| FEND-03 | Error states shown in UI components (no alert() calls anywhere) | `isError` + `error.message` from useQuery/useMutation renders inline — never `alert()` |
| FEND-04 | Custom hooks encapsulate shared logic (data fetching, form handling) | Query factories + mutation hooks in `src/hooks/` — components call hooks, not raw fetch |
| FEND-05 | Loading states differentiate cache check vs AI generation | `isLoading` (isPending && isFetching) = new AI generation; `isSuccess && isFetching` = background refresh |
| FEND-06 | Query mutations properly invalidate related caches after saves | `onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.library.all() })` |
| UX-01 | Analysis page uses URL parameter (`/analysis/:id`) — survives page refresh | Route changed from `/analysis` (no param) to `/analysis/:id`; useParams + GET /api/analysis/:id |
</phase_requirements>

---

## Summary

Phase 3 is the largest frontend change in the refactor. The current codebase has three critical anti-patterns that must be eliminated together: (1) Analysis.tsx relies on `location.state` which evaporates on page refresh; (2) all three pages use `useEffect+fetch` instead of TanStack Query; (3) errors are surfaced via `alert()`. These three problems are causally linked — fixing URL navigation requires TanStack Query to load the analysis from the server, which eliminates the need for location state, which then makes component decomposition clean.

TanStack Query v5 is not yet installed in the project (`package.json` has no `@tanstack/react-query` entry). The installation is straightforward: one package plus the `QueryClientProvider` wrapper in `main.tsx`. React is already at v19 (compatible — v5 requires React 18+). The project uses react-router v7 which is already installed, so switching `/analysis` to `/analysis/:id` requires only a route definition change in `App.tsx` and a `navigate('/analysis/' + id)` call from Home.

The current API contract from Phase 2 provides `GET /api/analysis/:id` (BEND-03), which is the exact endpoint needed for URL-based navigation. The analysis ID is the `lastInsertRowid` from the `sentences` table returned by `POST /api/save-sentence`. The Home page must capture this ID and navigate to `/analysis/:id` instead of passing analysis state.

**Primary recommendation:** Install `@tanstack/react-query`, add `QueryClientProvider` to `main.tsx`, create `src/hooks/` with query factories using the `queryOptions` pattern, update the `/analysis/:id` route, and decompose Analysis.tsx into 6 step components. Execute in one atomic phase — partial migration creates stale-state bugs.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.0.0 (latest stable) | Server state management, caching, background refetch | Industry standard for React server state; v5 has improved TypeScript, 20% smaller bundle |
| react-router | ^7.13.1 (already installed) | URL-based navigation with `useParams` | Already in project; `useParams` extracts `:id` from URL |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query-devtools | ^5.0.0 | Debug query cache in development | Add to main.tsx in dev mode only; helps verify cache hit vs fresh fetch |
| vitest + @testing-library/react | already have vitest; RTL not yet installed | Component tests in Phase 4 | Phase 4 only — not needed for Phase 3 implementation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-query | SWR | SWR has no mutation/invalidation support as first-class; TanStack Query is the decided choice per REQUIREMENTS.md |
| @tanstack/react-query | Zustand + fetch | Global state management explicitly called out of scope in REQUIREMENTS.md |
| queryOptions factory | plain custom hooks | queryOptions enables type-safe `getQueryData`/`prefetchQuery`; custom hooks can't share types with imperative cache access |

### Installation

```bash
npm install @tanstack/react-query
npm install --save-dev @tanstack/react-query-devtools
```

No other new dependencies are required. All other needed libraries (react-router, lucide-react, UI components) are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   ├── queries.ts       # queryOptions factories for all GET endpoints
│   └── mutations.ts     # useMutation hooks for all POST endpoints
├── lib/
│   ├── api.ts           # typed fetch wrapper (throws on !response.ok)
│   └── utils.ts         # (existing)
├── components/
│   └── analysis/
│       ├── StepSkeleton.tsx    # Step 1: sentence type, main clause, core_skeleton
│       ├── StepModifiers.tsx   # Step 2: components array
│       ├── StepTree.tsx        # Step 3: structure_tree
│       ├── StepMeaning.tsx     # Step 4: meaning, key_points
│       ├── StepChunks.tsx      # Step 5: chunks, review_summary
│       └── StepQuiz.tsx        # Step 6: quiz
└── pages/
    ├── Home.tsx          # MODIFIED: useQuery for history, useMutation for analyze
    ├── Analysis.tsx      # MODIFIED: useParams + useQuery for analysis, no inline steps
    └── Library.tsx       # MODIFIED: useQuery for history/saved/chunks
```

### Pattern 1: QueryClientProvider Setup

**What:** Wrap the entire app with `QueryClientProvider` in `main.tsx`.
**When to use:** Once, at app root.

```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes — analysis data rarely changes
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
```

### Pattern 2: Typed API Client Layer

**What:** A thin typed fetch wrapper in `src/lib/api.ts` that throws on error responses. This is the single place where `fetch` is called — all query functions and mutation functions use this wrapper.
**When to use:** All API calls go through here. Components never call `fetch` directly.

```typescript
// src/lib/api.ts
import type { AnalysisResult, HistoryEntry } from '@/src/types/index.js';
import type { SaveChunkRequest } from '@/src/types/api.js';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  checkSentence: (sentence: string): Promise<AnalysisResult> =>
    apiFetch('/api/check-sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    }),

  saveSentence: (sentence: string, analysis: AnalysisResult): Promise<{ success: boolean }> =>
    apiFetch('/api/save-sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence, analysis }),
    }),

  getAnalysisById: (id: number): Promise<AnalysisResult & { id: number }> =>
    apiFetch(`/api/analysis/${id}`),

  getHistory: (): Promise<HistoryEntry[]> =>
    apiFetch('/api/history'),

  getSaved: (): Promise<unknown[]> =>
    apiFetch('/api/saved'),

  getChunks: (): Promise<unknown[]> =>
    apiFetch('/api/chunks'),

  saveSentenceToLibrary: (sentence: string): Promise<{ success: boolean }> =>
    apiFetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    }),

  saveChunk: (chunk: SaveChunkRequest): Promise<{ success: boolean }> =>
    apiFetch('/api/chunks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    }),
};
```

### Pattern 3: queryOptions Factory (FEND-04)

**What:** Define `queryKey` and `queryFn` together using the `queryOptions` helper. This enables type-safe `getQueryData`/`invalidateQueries` and shares the definition between hooks and imperative cache access.
**When to use:** All GET endpoint queries.

```typescript
// src/hooks/queries.ts
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/src/lib/api.js';

// Query key hierarchy: top-level → specific
export const queryKeys = {
  history: {
    all: () => ['history'] as const,
  },
  library: {
    all: () => ['library'] as const,
    saved: () => [...queryKeys.library.all(), 'saved'] as const,
    chunks: () => [...queryKeys.library.all(), 'chunks'] as const,
  },
  analysis: {
    all: () => ['analysis'] as const,
    byId: (id: number) => [...queryKeys.analysis.all(), id] as const,
  },
};

export const analysisQueryOptions = (id: number) =>
  queryOptions({
    queryKey: queryKeys.analysis.byId(id),
    queryFn: () => api.getAnalysisById(id),
    staleTime: Infinity, // Analysis results never change — AI output is deterministic
  });

export const historyQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.history.all(),
    queryFn: () => api.getHistory(),
  });

export const savedSentencesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.library.saved(),
    queryFn: () => api.getSaved(),
  });

export const chunksQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.library.chunks(),
    queryFn: () => api.getChunks(),
  });
```

### Pattern 4: Mutation Hook with Cache Invalidation (FEND-06)

**What:** Mutation hooks use `onSuccess` to `invalidateQueries`, which triggers a background refetch of stale queries. This is how Library page auto-updates after a save.
**When to use:** All POST/save operations.

```typescript
// src/hooks/mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/api.js';
import { queryKeys } from './queries.js';
import type { AnalysisResult } from '@/src/types/index.js';
import type { SaveChunkRequest } from '@/src/types/api.js';

export function useSaveSentenceToLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sentence: string) => api.saveSentenceToLibrary(sentence),
    onSuccess: () => {
      // Invalidate library queries so Library page auto-refreshes (FEND-06)
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all() });
    },
  });
}

export function useSaveChunk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chunk: SaveChunkRequest) => api.saveChunk(chunk),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.library.chunks() });
    },
  });
}
```

### Pattern 5: URL-Based Navigation (UX-01)

**What:** Home page captures the analysis ID from save response, navigates to `/analysis/:id`. Analysis page reads the ID from `useParams`, fetches via TanStack Query.
**When to use:** Whenever navigating to the analysis page.

```typescript
// In Home.tsx — after saving sentence
const { data: savedData } = await api.saveSentence(sentence, analysisResult);
navigate(`/analysis/${savedData.id}`);

// App.tsx route registration
<Route path="/analysis/:id" element={<Analysis />} />

// In Analysis.tsx
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { analysisQueryOptions } from '@/src/hooks/queries.js';

const { id } = useParams<{ id: string }>();
const analysisId = Number(id);
const { data, isPending, isError, error } = useQuery(analysisQueryOptions(analysisId));
```

### Pattern 6: Loading State — Cache Hit vs AI Generation (FEND-05)

**What:** Use `isLoading` (`isPending && isFetching`) to detect a true first-fetch (AI generation). Use `isSuccess && isFetching` to detect a background refresh (cache hit scenario — fast, no spinner).

```typescript
// In Analysis.tsx
const { data, isPending, isFetching, isError, error } = useQuery(analysisQueryOptions(analysisId));

// New AI generation (no cache): show full "Generating..." state
if (isPending && isFetching) return <GeneratingSpinner />;

// Error state: show inline, never alert()
if (isError) return <InlineError message={error.message} />;

// Cached data rendering — isFetching may be true for background refresh
// but we show data immediately (cache hit — no spinner needed)
return (
  <div>
    {/* data is guaranteed defined here */}
    <StepSkeleton analysis={data} />
    ...
  </div>
);
```

Note: For the analyze flow in Home.tsx, the AI call is triggered by `POST /api/check-sentence` (cache check) or by calling Gemini directly via `src/services/ai.ts`. The loading state in Home.tsx tracks the mutation state (`mutation.isPending`), while Analysis.tsx tracks the query state. The distinction between "cache check" and "AI generation" happens in the Home.tsx mutation logic, not in Analysis.tsx — Analysis.tsx just fetches by ID and always shows data immediately from cache on revisit.

### Pattern 7: Step Component Props Interface

**What:** Each step component receives a typed subset of `AnalysisResult` as props. No step component fetches data itself — the parent Analysis.tsx passes it down.

```typescript
// src/components/analysis/StepSkeleton.tsx
import type { AnalysisResult } from '@/src/types/index.js';

interface StepSkeletonProps {
  sentence_type: AnalysisResult['sentence_type'];
  main_clause: AnalysisResult['main_clause'];
  core_skeleton: AnalysisResult['core_skeleton'];
}

export function StepSkeleton({ sentence_type, main_clause, core_skeleton }: StepSkeletonProps) {
  // renders existing Step 1 JSX
}
```

### Anti-Patterns to Avoid

- **`location.state` for analysis data:** After this phase, Analysis.tsx must NEVER read `location.state?.analysis`. If a test finds this import, it means UX-01 is not implemented.
- **`alert()` anywhere in the codebase:** Replace with inline error JSX using `isError` and `error.message`. Search the codebase for `alert(` before considering the phase complete.
- **`useEffect` + `fetch` for server data:** Every `useEffect(() => { fetch(...).then(...)...}, [])` pattern must be replaced. After Phase 3, the only `useEffect` calls remaining should be for non-server concerns (e.g., scroll position, focus management).
- **Calling `fetch` directly in components:** All fetching goes through `src/lib/api.ts`. Components call hooks that call `api.*` functions.
- **Step components that import useQuery:** Step components are pure presentational. They receive typed props from Analysis.tsx. They never fetch.
- **Putting QueryClientProvider inside BrowserRouter:** `QueryClientProvider` should wrap `BrowserRouter` (or be at the same level as its sibling), not inside it.
- **Forgetting `staleTime: Infinity` for analysis results:** Analysis results from Gemini are immutable — once saved to the DB, they never change. Without `staleTime: Infinity`, TanStack Query will refetch them unnecessarily on window focus.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cache-aware loading state | Custom `useState(isFromCache)` tracking | `isPending`, `isFetching`, `isSuccess` from useQuery | TanStack Query already tracks all fetch lifecycle states atomically |
| Stale-while-revalidate | Manual `useState(stale)` + background fetch | `staleTime` + default revalidation on window focus | Built into TanStack Query; hand-rolled versions have race conditions |
| Error state management | `useState(error)` in each component | `isError`, `error` from useQuery | Automatic, reset on successful retry |
| Query cache invalidation | `setTimeout(() => refetch(), 100)` after save | `queryClient.invalidateQueries({ queryKey: ... })` | Synchronous, targeted, no timing hacks |
| Duplicate request deduplication | `useRef(isFetchingRef)` guards | TanStack Query deduplicates by queryKey automatically | Race-condition-free by design |
| URL param parsing | Custom `window.location.pathname.split('/')` | `useParams<{ id: string }>()` from react-router | Type-safe, works with nested routes |

**Key insight:** TanStack Query manages the full server-state lifecycle (loading, error, cache, background refresh, invalidation). The application layer should only define `queryKey` + `queryFn` + `mutationFn` — not reimplement any of the state machinery.

---

## Common Pitfalls

### Pitfall 1: The `location.state` → URL Migration Breaks the Analyze Flow

**What goes wrong:** Home.tsx currently navigates with `navigate("/analysis", { state: { analysis: data } })`. If you update the route to `/analysis/:id` but don't update Home.tsx to pass the ID, the user sees a broken Analysis page.

**Why it happens:** The current flow never returns an analysis ID from the server — it calls `POST /api/check-sentence` (returns `AnalysisResult` without an ID) and if not found, calls `analyzeSentence()` locally then `POST /api/save-sentence`. Neither the check-sentence nor the AI path currently returns an ID.

**How to avoid:** The migration requires `POST /api/save-sentence` to return the inserted row ID (e.g., `{ success: true, id: lastInsertRowid }`). The `POST /api/check-sentence` response also needs to include the existing row's `id`. Verify Phase 2 service implementations return IDs — the current `saveSentence()` service returns `void`; this must be updated to return `{ id: number }`.

**Warning signs:** `useParams` returns `id: "undefined"` or `NaN` when converted; Analysis page shows "No analysis found" immediately.

### Pitfall 2: `staleTime: Infinity` for Analysis Results vs. Zero for Library Lists

**What goes wrong:** Without `staleTime`, TanStack Query considers data stale immediately after fetching. On window focus, it will silently refetch analysis results from the server — unnecessary since Gemini output is immutable.

**Why it happens:** Default `staleTime` is `0`.

**How to avoid:** Set `staleTime: Infinity` in `analysisQueryOptions` (the result never changes). Use the default `staleTime` (or `5 * 60 * 1000`) for history/saved/chunks since those change when the user saves items.

**Warning signs:** DevTools shows frequent refetches of analysis queries; network tab shows `GET /api/analysis/:id` on every window focus.

### Pitfall 3: `onSuccess`/`onError` Callbacks Were Removed from `useQuery` in v5

**What goes wrong:** Copying v4 patterns with `useQuery({ ..., onSuccess: (data) => ... })` causes a TypeScript error because v5 removed these callbacks from `useQuery`.

**Why it happens:** v5 moved `onSuccess`/`onError`/`onSettled` to the global `QueryCache` level to prevent issues with multiple component subscriptions calling the callback multiple times.

**How to avoid:** Handle side effects from query data using `useEffect` watching `data` or `isSuccess`, or use the global `QueryClient` callbacks. For mutations, `onSuccess`/`onError` callbacks remain valid on `useMutation` — this is only a query restriction.

**Warning signs:** TypeScript error: `Object literal may only specify known properties, and 'onSuccess' does not exist in type 'UseQueryOptions<...>'`.

### Pitfall 4: The `enabled` Option Needed for Analysis Query When ID is Invalid

**What goes wrong:** If `useParams` returns `undefined` or if the URL is `/analysis/abc` (non-numeric), `analysisQueryOptions(NaN)` triggers an API call to `/api/analysis/NaN`, which returns 400 and causes an error state.

**Why it happens:** `Number(undefined)` is `NaN`; `Number("abc")` is `NaN`.

**How to avoid:** Add `enabled: !isNaN(analysisId)` to the analysis `queryOptions`. Guard before rendering: if `isNaN(analysisId)`, show an "Invalid analysis ID" error without fetching.

**Warning signs:** Network tab shows `GET /api/analysis/NaN` request on load.

### Pitfall 5: React StrictMode Double-Renders Expose Race Conditions

**What goes wrong:** React 18/19 StrictMode double-invokes effects, but TanStack Query deduplicates requests — this is fine. However, if any mutation or side-effect code has been left in `useEffect` without TanStack Query, StrictMode will run it twice, surfacing bugs.

**Why it happens:** StrictMode intentionally mounts/unmounts components twice in development to catch effects that lack proper cleanup.

**How to avoid:** All server mutations go through `useMutation`, not `useEffect`. This is automatically safe with TanStack Query.

**Warning signs:** Duplicate API calls visible in network tab despite deduplication — means something is still using `useEffect+fetch`.

### Pitfall 6: React Router `useParams` Always Returns Strings — Parse Explicitly

**What goes wrong:** `const { id } = useParams()` gives you `string | undefined`. Passing a string directly to `api.getAnalysisById(id)` will cause a TypeScript error since the function expects `number`.

**Why it happens:** URL parameters are always strings; react-router does not coerce types.

**How to avoid:** Always parse: `const analysisId = Number(useParams<{ id: string }>().id)`. Then guard with `isNaN(analysisId)`.

---

## Code Examples

Verified patterns from official TanStack Query v5 documentation and the existing project codebase:

### QueryClientProvider in main.tsx

```typescript
// src/main.tsx - Source: https://tanstack.com/query/v5/docs/react/quick-start
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
```

### Analysis Page with URL Param + TanStack Query

```typescript
// src/pages/Analysis.tsx
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { analysisQueryOptions } from '@/src/hooks/queries.js';

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const analysisId = Number(id);

  const { data, isPending, isFetching, isError, error } = useQuery(
    analysisQueryOptions(analysisId)
  );

  if (isNaN(analysisId)) {
    return <div>Invalid analysis ID</div>;
  }

  // True first load — no cache, AI generation path
  if (isPending && isFetching) {
    return <div>Generating analysis...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  // data is guaranteed defined here
  return (
    <div>
      <StepSkeleton
        sentence_type={data.sentence_type}
        main_clause={data.main_clause}
        core_skeleton={data.core_skeleton}
      />
      {/* etc */}
    </div>
  );
}
```

### Home Page Analyze Flow with Mutation and ID Return

```typescript
// src/pages/Home.tsx — key section
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api } from '@/src/lib/api.js';
import { queryKeys } from '@/src/hooks/queries.js';

const navigate = useNavigate();
const queryClient = useQueryClient();

const analyzeMutation = useMutation({
  mutationFn: async (sentence: string) => {
    // Check cache first
    try {
      const cached = await api.checkSentence(sentence);
      return cached; // cached.id is included
    } catch {
      // Not cached — call AI then save
      const analysis = await analyzeSentence(sentence);
      const saved = await api.saveSentence(sentence, analysis);
      return { ...analysis, id: saved.id };
    }
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.history.all() });
    navigate(`/analysis/${data.id}`);
  },
  onError: (error) => {
    // No alert() — error is shown inline via mutation.isError
  },
});

// In JSX:
{analyzeMutation.isError && (
  <p className="text-red-600">{analyzeMutation.error.message}</p>
)}
```

### Library Page with Three useQuery Calls

```typescript
// src/pages/Library.tsx — key section
import { useQuery } from '@tanstack/react-query';
import { historyQueryOptions, savedSentencesQueryOptions, chunksQueryOptions } from '@/src/hooks/queries.js';

const historyQuery = useQuery(historyQueryOptions());
const savedQuery = useQuery(savedSentencesQueryOptions());
const chunksQuery = useQuery(chunksQueryOptions());

// All three fetch on mount; errors shown inline
{historyQuery.isError && <p>{historyQuery.error.message}</p>}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useEffect + fetch` for server data | `useQuery` + queryOptions factory | TanStack Query v5 (Oct 2023) | Automatic caching, background refetch, deduplication |
| `location.state` for page-to-page data | URL parameter + GET endpoint | React Router guidance | Survives page refresh, shareable links, bookmark-able |
| `alert()` for errors | Inline `{isError && <p>{error.message}</p>}` | Current best practice | Never blocks UI; accessible; testable |
| `useQuery(key, fn, options)` — multiple params | `useQuery({ queryKey, queryFn, ...options })` | TanStack Query v5 breaking change | Single object signature; required in v5 |
| `cacheTime` option | `gcTime` | TanStack Query v5 rename | Renamed for clarity; old name is a TypeScript error in v5 |
| `onSuccess` on `useQuery` | `useEffect` watching `isSuccess`, or global QueryCache callback | TanStack Query v5 removal | Removed to prevent duplicate executions with multiple subscribers |
| Custom key arrays `['analysis', id]` | `queryOptions` helper with type-tagged key | TanStack Query v5 best practice | `getQueryData` is now type-safe |

**Deprecated/outdated in this project's context:**
- `isInitialLoading` (v4): Replaced by `isLoading` in v5 (`isPending && isFetching`)
- `cacheTime`: Replaced by `gcTime`
- `keepPreviousData: true`: Replaced by `placeholderData: keepPreviousData` import

---

## Key Decision: Does `POST /api/save-sentence` Need to Return the Inserted ID?

**What we know:** Phase 2 `saveSentence()` service returns `void`, and the controller sends `{ success: true }`. The URL-based navigation (UX-01) requires the analysis ID immediately after saving.

**The gap:** The current API contract does not return the ID. Phase 3 must update `POST /api/save-sentence` to return `{ success: true, id: number }`. Similarly, `POST /api/check-sentence` (which finds an existing sentence) must return `{ ...analysis, id: number }`.

**Impact on plan:** Plan 03-01 (QueryClientProvider + typed API client) must also update the `saveSentence` controller/service to return the ID. This is a small backend touch but mandatory for UX-01.

---

## Open Questions

1. **Does `POST /api/check-sentence` currently return the analysis ID?**
   - What we know: Phase 2's `checkSentence()` service returns `AnalysisResult | null` — no ID field
   - What's unclear: Whether the controller was updated to include `id` in the response
   - Recommendation: Inspect `server/services/analysis.ts` — if `checkSentence()` returns only `AnalysisResult`, update it to include `id: row.id` in the return shape. This is a one-line change in the service.

2. **Should the Home analyze flow be a mutation or stay as local state + navigate?**
   - What we know: The AI call via `analyzeSentence()` is a side-effectful operation that saves to the DB; it is semantically a mutation
   - What's unclear: Whether `useMutation` works well with the async "check then generate" branching logic
   - Recommendation: Use `useMutation` — the `mutationFn` can contain the `try/catch` branching logic. This gives `isPending`, `isError`, and `error` state for free, eliminating `useState(isLoading)` and `alert()`.

3. **Where does the "Generating..." vs "Loading from cache" distinction appear in the UI?**
   - What we know: FEND-05 requires distinguishing these states; both go through `GET /api/analysis/:id` in the new design
   - What's unclear: If the analysis is already cached in TanStack Query (from a prior visit in the same session), the Analysis page will show data instantly with no spinner at all — this is the correct behavior
   - Recommendation: The "Generating..." state in Analysis.tsx only appears on true first load (`isPending && isFetching`). The "cache hit" case is simply instant data display. The distinction for "AI being called" lives in Home.tsx's mutation state, not Analysis.tsx.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 (already installed) |
| Config file | `vitest.config.ts` (exists — environment: "node") |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --reporter=verbose` |

**Note:** The current Vitest config uses `environment: "node"`. React component tests require `environment: "jsdom"` (or `happy-dom`). Phase 3 does not write component tests — those are Phase 4. Phase 3 validation is via TypeScript (`tsc --noEmit`) and manual smoke testing of the running app. If the planner adds any component tests to Phase 3 tasks, they will require an environment change in vitest.config.ts.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEND-01 | Analysis.tsx has no inline step JSX; 6 files exist in src/components/analysis/ | type-check + file existence | `npx tsc --noEmit && ls src/components/analysis/` | ❌ Wave 0 (files created during implementation) |
| FEND-02 | No useEffect+fetch in any page | type-check + grep | `npx tsc --noEmit` | ✅ verified by code review |
| FEND-03 | No alert() in codebase | grep | `grep -r "alert(" src/` (must return empty) | ✅ verified by code review |
| FEND-04 | src/hooks/queries.ts and mutations.ts exist with exported functions | type-check | `npx tsc --noEmit` | ❌ Wave 0 |
| FEND-05 | isPending&&isFetching used in Analysis.tsx | code review | `npx tsc --noEmit` | ❌ Wave 0 |
| FEND-06 | invalidateQueries called in onSuccess | code review | `npx tsc --noEmit` | ❌ Wave 0 |
| UX-01 | `/analysis/:id` route exists; useParams used; direct navigation works | manual smoke test | Open `localhost:3000/analysis/1` directly in browser | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (type check; ~2s)
- **Per wave merge:** `npx vitest run` (existing tests must stay green)
- **Phase gate:** `npx tsc --noEmit` green + manual smoke test (refresh `/analysis/:id`, save sentence and view Library) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools` — `npm install @tanstack/react-query @tanstack/react-query-devtools`
- [ ] Create `src/hooks/` directory — empty, no files yet
- [ ] Create `src/lib/api.ts` — typed fetch wrapper stub
- [ ] Create `src/components/analysis/` directory — empty, no step files yet
- [ ] `vitest.config.ts` does NOT need updating for Phase 3 (no component tests written in this phase)

---

## Sources

### Primary (HIGH confidence)

- TanStack Query v5 Quick Start — https://tanstack.com/query/v5/docs/react/quick-start — QueryClientProvider, useQuery, useMutation patterns
- TanStack Query v5 Queries Guide — https://tanstack.com/query/v5/docs/framework/react/guides/queries — isPending, isFetching, isLoading semantics
- TanStack Query v5 Query Options Guide — https://tanstack.com/query/v5/docs/framework/react/guides/query-options — queryOptions helper
- TkDodo's Blog on Query Options API — https://tkdodo.eu/blog/the-query-options-api — queryOptions factory pattern, type-safe getQueryData
- React Router v7 useParams — https://reactrouter.com/api/hooks/useParams — URL param extraction
- Codebase inspection of `server/services/analysis.ts` — Phase 2 confirmed `checkSentence()` returns `AnalysisResult | null` without ID; `saveSentence()` returns void

### Secondary (MEDIUM confidence)

- TanStack Query v5 Migration Guide — https://tanstack.com/query/v5/docs/react/guides/migrating-to-v5 — breaking changes: single object param, gcTime rename, onSuccess removal from useQuery
- WebSearch: queryOptions factory pattern (2025) — verified against official docs and TkDodo blog

### Tertiary (LOW confidence)

- N/A — all critical claims verified against official documentation or direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — TanStack Query v5 docs read directly; package.json confirmed library not yet installed; React version confirmed compatible (v19 > v18 requirement)
- Architecture: HIGH — queryOptions pattern verified from official v5 docs and tkdodo.eu; URL param pattern verified from react-router v7 official docs; component decomposition pattern is standard React
- Pitfalls: HIGH — `location.state` fragility is the stated problem UX-01 solves; v5 breaking changes (`onSuccess` removal, single object param) verified from migration guide; `useParams` string type is documented React Router behavior

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (TanStack Query v5 is stable; no fast-moving surface expected; React Router v7 is stable)
