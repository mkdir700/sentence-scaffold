---
phase: 03-frontend-core-refactor
plan: "01"
subsystem: ui
tags: [tanstack-query, react-query, fetch, api-client, mutations, cache-invalidation]

requires:
  - phase: 02-backend-separation
    provides: "Typed service functions checkSentence/saveSentence returning clean results; three-layer backend architecture"

provides:
  - "Typed fetch wrapper api object covering all 8 endpoints (src/lib/api.ts)"
  - "queryKeys factory and 4 queryOptions factories for history, library, chunks, analysis-by-id"
  - "Mutation hooks useSaveSentenceToLibrary and useSaveChunk with cache invalidation"
  - "QueryClientProvider active in main.tsx wrapping entire app"
  - "Backend checkSentence returns AnalysisResult & { id } and saveSentence returns { id: number }"

affects: [03-frontend-core-refactor-02, plan-02-migration]

tech-stack:
  added:
    - "@tanstack/react-query v5"
    - "@tanstack/react-query-devtools"
  patterns:
    - "queryOptions factory pattern with staleTime: Infinity for immutable data"
    - "queryKeys object with nested factory functions for cache key management"
    - "Mutation hooks invalidate via queryClient.invalidateQueries using queryKeys"

key-files:
  created:
    - "src/lib/api.ts"
    - "src/hooks/queries.ts"
    - "src/hooks/mutations.ts"
  modified:
    - "src/main.tsx"
    - "src/types/api.ts"
    - "server/services/analysis.ts"
    - "server/controllers/analysis.ts"

key-decisions:
  - "analysisQueryOptions uses staleTime: Infinity — analysis results are immutable once saved"
  - "QueryClientProvider wraps BrowserRouter (not inside it) with defaultOptions staleTime=5min, retry=1"
  - "api object uses @/src/types/index import path consistent with project conventions"

patterns-established:
  - "api.* methods are thin typed wrappers — no caching logic, just fetch+error handling"
  - "queryKeys object co-located with queryOptions factories in queries.ts"
  - "Mutation hooks follow useQueryClient pattern with typed invalidateQueries on success"

requirements-completed: [FEND-02, FEND-04, FEND-06]

duration: 2min
completed: 2026-03-10
---

# Phase 03 Plan 01: TanStack Query Infrastructure Summary

**TanStack Query v5 wired with typed API client, queryOptions factories, and mutation hooks with cache invalidation; backend endpoints patched to return analysis IDs**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T06:32:43Z
- **Completed:** 2026-03-10T06:34:55Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Installed `@tanstack/react-query` v5 and devtools; QueryClientProvider active in main.tsx
- Created typed `api` object in `src/lib/api.ts` covering all 8 backend endpoints
- Created `queryKeys` factory + 4 `queryOptions` factories and 2 mutation hooks with cache invalidation
- Patched `checkSentence` to return `AnalysisResult & { id }` and `saveSentence` to return `{ id: number }` — required by Plan 02 URL navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Patch backend to return analysis IDs and install TanStack Query** - `936fb59` (feat)
2. **Task 2: Create typed API client, query factories, mutation hooks, wire QueryClientProvider** - `c8df778` (feat)

## Files Created/Modified

- `src/lib/api.ts` — Typed fetch wrapper (`apiFetch`) and `api` object with all 8 endpoint methods
- `src/hooks/queries.ts` — `queryKeys` factory object and `analysisQueryOptions`, `historyQueryOptions`, `savedSentencesQueryOptions`, `chunksQueryOptions`
- `src/hooks/mutations.ts` — `useSaveSentenceToLibrary` and `useSaveChunk` with cache invalidation
- `src/main.tsx` — Added `QueryClientProvider` (wrapping `BrowserRouter`) + `ReactQueryDevtools`
- `src/types/api.ts` — Added `SaveSentenceResponse`, updated `AnalysisResponse` to include `id`
- `server/services/analysis.ts` — `saveSentence` returns `{ id: number }`, `checkSentence` returns `AnalysisResult & { id }`
- `server/controllers/analysis.ts` — `handleSaveSentence` responds with `{ success: true, id }`

## Decisions Made

- `analysisQueryOptions` uses `staleTime: Infinity` — analysis results are immutable once stored in the DB
- `QueryClientProvider` placed outside `BrowserRouter` so router-level code can use query hooks if needed
- Used `Parameters<typeof api.saveChunk>[0]` in mutations.ts to stay DRY and avoid re-declaring `SaveChunkRequest`

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- TanStack Query infrastructure is ready; Plan 02 can immediately consume `api.*`, `queryOptions`, and mutation hooks
- `QueryClientProvider` is active — `useQuery` and `useMutation` will work in any component
- Backend returns IDs from both save and check endpoints — URL navigation in Plan 02 can use them directly

---
*Phase: 03-frontend-core-refactor*
*Completed: 2026-03-10*
