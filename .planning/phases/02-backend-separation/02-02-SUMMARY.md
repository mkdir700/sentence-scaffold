---
phase: 02-backend-separation
plan: "02"
subsystem: api
tags: [express, zod, controllers, routes, typescript]

# Dependency graph
requires:
  - phase: 02-backend-separation-01
    provides: service layer (analysis.ts, library.ts, chunks.ts) with pure business logic functions
provides:
  - Controller layer with Zod request validation for all API endpoints
  - Route layer mapping Express paths to controller functions
  - Slim server.ts mounting modular routers instead of inline handlers
affects: [03-frontend-hooks, 04-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-layer Express API: routes (path) → controllers (req/res + Zod) → services (pure logic)"
    - "Zod v4 validation in controllers: z.record() requires two type args, ZodError.issues (not .errors)"
    - "All relative imports use .js extension for ESM compatibility"
    - "GET handlers receive _req parameter (prefixed underscore) to satisfy no-unused-vars"

key-files:
  created:
    - server/controllers/analysis.ts
    - server/controllers/library.ts
    - server/controllers/chunks.ts
    - server/routes/analysis.ts
    - server/routes/library.ts
    - server/routes/chunks.ts
  modified:
    - server.ts

key-decisions:
  - "Zod v4 ZodError uses .issues not .errors — fixed auto during Task 1 type check"
  - "z.record() in Zod v4 requires two arguments (keyType, valueType) — z.record(z.string(), z.unknown())"
  - "Controller functions for GET endpoints prefix unused req param with underscore (_req) for TypeScript compliance"

patterns-established:
  - "Controller pattern: parse body with Zod schema → call service → send response. ZodError → 400, other error → 500"
  - "Route files are pure path-to-controller mappings with no logic"
  - "server.ts mounts all routers at /api with app.use('/api', router)"

requirements-completed: [BEND-01, BEND-02]

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 02 Plan 02: Controller and Route Layer Summary

**Three-layer Express API complete: Zod-validated controllers and Express routers replace all inline server.ts handlers, reducing server.ts from 123 to 34 lines**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-10T06:04:06Z
- **Completed:** 2026-03-10T06:12:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created 3 controller files with Zod validation on all POST endpoints (400 on bad input, 404 on missing data, 500 on internal errors)
- Created 3 route files that purely map Express paths to controller functions
- Rewired server.ts to use `app.use('/api', router)` pattern — zero inline handlers remain
- All 20 tests pass after the rewire (Phase 1 smoke tests + Phase 2 service unit tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create controllers with Zod validation and route files** - `2daa7fa` (feat)
2. **Task 2: Rewire server.ts to use modular routers** - `df687c2` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `server/controllers/analysis.ts` - handleCheckSentence, handleSaveSentence, handleGetAnalysisById with Zod validation
- `server/controllers/library.ts` - handleSaveToLibrary (validates + maps 404), handleGetSaved, handleGetHistory
- `server/controllers/chunks.ts` - handleSaveChunk with Zod validation, handleGetChunks
- `server/routes/analysis.ts` - Router for /check-sentence, /save-sentence, /analysis/:id
- `server/routes/library.ts` - Router for /save, /saved, /history
- `server/routes/chunks.ts` - Router for /chunks (GET + POST)
- `server.ts` - Reduced to slim 34-line entry point mounting 3 routers

## Decisions Made
- Zod v4 `z.record()` requires two type arguments (key + value) — used `z.record(z.string(), z.unknown())` for the analysis body field
- Zod v4 `ZodError` exposes `.issues` array (not `.errors`) — updated all catch blocks accordingly
- GET controller functions prefix unused `req` parameter as `_req` to satisfy TypeScript strict mode

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod v4 API incompatibilities in controllers**
- **Found during:** Task 1 (type check after file creation)
- **Issue:** Plan specified `z.record(z.unknown())` but Zod v4 requires two args; plan specified `error.errors` but Zod v4 uses `error.issues`
- **Fix:** Changed to `z.record(z.string(), z.unknown())` and `error.issues[0]?.message` across all 3 controller files
- **Files modified:** server/controllers/analysis.ts, server/controllers/library.ts, server/controllers/chunks.ts
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** 2daa7fa (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug, Zod v4 API differences)
**Impact on plan:** Fix was necessary for type correctness. No scope creep.

## Issues Encountered
None beyond the Zod v4 API differences documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Three-layer separation complete: routes → controllers → services
- All 7 original API endpoints preserved at identical URLs
- BEND-01 and BEND-02 requirements satisfied
- Ready for Phase 3 (frontend hooks with TanStack Query) — API contract is now stable

---
*Phase: 02-backend-separation*
*Completed: 2026-03-10*
