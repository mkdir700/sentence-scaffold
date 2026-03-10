# Roadmap: Sentence Scaffold Refactor

## Overview

A 4-phase brownfield refactor of a working React + Express sentence analysis tool. The ordering is non-negotiable: shared TypeScript types and Zod schemas must be established first because every subsequent phase depends on them. Backend separation comes second to stabilize the API contract before frontend hooks are built against it. The core frontend refactor — TanStack Query adoption, Analysis.tsx decomposition, and URL-based navigation — happens as one atomic phase to avoid stale-state bugs. Polish and test coverage close out the refactor once the architecture is stable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Define all TypeScript types, Zod schemas, and configure test infrastructure (completed 2026-03-10)
- [x] **Phase 2: Backend Separation** - Split monolithic server.ts into routes/controllers/services with typed contracts (completed 2026-03-10)
- [x] **Phase 3: Frontend Core Refactor** - TanStack Query, Analysis decomposition, and URL navigation as one atomic change (completed 2026-03-10)
- [ ] **Phase 4: Polish and Test Coverage** - Input validation, Gemini timeout handling, and comprehensive tests

## Phase Details

### Phase 1: Foundation
**Goal**: Shared TypeScript interfaces and Zod schemas exist; test infrastructure is running; strict mode is enabled
**Depends on**: Nothing (first phase)
**Requirements**: TYPE-01, TYPE-02, TYPE-03, TYPE-04, TYPE-05, TEST-01
**Success Criteria** (what must be TRUE):
  1. All data structures (`AnalysisResult`, `Chunk`, `HistoryEntry`, etc.) have explicit interfaces in `src/types/` with zero `any` types
  2. Zod schema validates a real Gemini API response without error, and TypeScript types are derived from it via `z.infer<>`
  3. `"strict": true` is enabled in tsconfig and the project compiles with zero errors
  4. `vitest run` executes at least one passing smoke test
**Plans:** 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md — Install deps, create type definitions and Zod schemas, configure Vitest, write smoke tests
- [x] 01-02-PLAN.md — Enable strict mode, fix all errors, integrate Zod parse into ai.ts

### Phase 2: Backend Separation
**Goal**: Monolithic server.ts is replaced by route/controller/service layers with a new GET `/api/analysis/:id` endpoint
**Depends on**: Phase 1
**Requirements**: BEND-01, BEND-02, BEND-03, BEND-04
**Success Criteria** (what must be TRUE):
  1. All API routes are organized into `server/routes/`, `server/controllers/`, and `server/services/` — no business logic remains in the route handler
  2. `GET /api/analysis/:id` returns a cached analysis by ID with correct typed response
  3. Sending a POST with a missing or too-short sentence body returns a 400 response with a descriptive error message
  4. Service functions can be called directly in a test (no HTTP server required) and return correct results
**Plans:** 2/2 plans complete

Plans:
- [ ] 02-01-PLAN.md — Create API contract types, service layer with unit tests
- [ ] 02-02-PLAN.md — Create controllers with Zod validation, route files, and rewire server.ts

### Phase 3: Frontend Core Refactor
**Goal**: All server state is managed by TanStack Query; Analysis.tsx is decomposed into 6 step components; the analysis page survives a browser refresh
**Depends on**: Phase 2
**Requirements**: FEND-01, FEND-02, FEND-03, FEND-04, FEND-05, FEND-06, UX-01
**Success Criteria** (what must be TRUE):
  1. Navigating to `/analysis/:id` directly (or refreshing the analysis page) loads and displays the correct analysis without data loss
  2. Saving a sentence or chunk and then viewing the Library page shows the newly saved item without a manual refresh
  3. When a save or fetch fails, an inline error message appears in the UI — no `alert()` dialog fires anywhere in the app
  4. The loading indicator distinguishes between a cache-hit (fast, no spinner) and a new AI generation (shows "Generating..." state)
  5. Analysis.tsx contains no inline step rendering — each of the 6 steps is a standalone component in `src/components/analysis/`
**Plans:** 2/2 plans complete

Plans:
- [ ] 03-01-PLAN.md — Install TanStack Query, patch backend to return IDs, create typed API client and query/mutation hooks
- [ ] 03-02-PLAN.md — Decompose Analysis.tsx into 6 step components, migrate all pages to TanStack Query, URL-based navigation

### Phase 4: Polish and Test Coverage
**Goal**: Input validation and Gemini timeout handling are in place; critical-path behavior is covered by tests
**Depends on**: Phase 3
**Requirements**: UX-02, UX-03, UX-04, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. Submitting a sentence shorter than 10 or longer than 2000 characters shows an inline validation error and does not call the API
  2. When Gemini does not respond within 30 seconds, the UI shows a "taking longer than expected" message with a retry option
  3. All backend service functions have unit tests that pass using in-memory SQLite (no real database file touched)
  4. Each of the 6 Analysis step components renders correctly in a test given typed mock data
**Plans**: TBD

Plans:
- [ ] 04-01: Add frontend input validation and Gemini timeout handling
- [ ] 04-02: Write unit tests for services, hooks, and step components

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-10 |
| 2. Backend Separation | 2/2 | Complete   | 2026-03-10 |
| 3. Frontend Core Refactor | 2/2 | Complete   | 2026-03-10 |
| 4. Polish and Test Coverage | 0/2 | Not started | - |
