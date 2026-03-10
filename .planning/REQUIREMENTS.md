# Requirements: Sentence Scaffold Refactor

**Defined:** 2026-03-10
**Core Value:** Sentence analysis workflow remains fully functional while codebase is restructured for maintainability

## v1 Requirements

Requirements for the refactor release. Each maps to roadmap phases.

### Type Safety

- [x] **TYPE-01**: All data structures have explicit TypeScript interfaces in `src/types/`
- [x] **TYPE-02**: Gemini API response validated at runtime with Zod schema
- [x] **TYPE-03**: Zod schemas serve as single source of truth for TypeScript types via `z.infer<>`
- [x] **TYPE-04**: Database query results use better-sqlite3 generics (no `any` casts)
- [x] **TYPE-05**: `strict: true` enabled in tsconfig.json with zero `any` types remaining

### Frontend Architecture

- [x] **FEND-01**: Analysis.tsx decomposed into 6 step components (skeleton, modifiers, tree, meaning, chunks, quiz)
- [x] **FEND-02**: All server data fetching uses TanStack Query (no manual useEffect+fetch patterns)
- [x] **FEND-03**: Error states shown in UI components (no alert() calls anywhere)
- [x] **FEND-04**: Custom hooks encapsulate shared logic (data fetching, form handling)
- [x] **FEND-05**: Loading states differentiate cache check vs AI generation
- [x] **FEND-06**: Query mutations properly invalidate related caches after saves

### Backend Architecture

- [x] **BEND-01**: Express routes separated into route/controller/service layers
- [x] **BEND-02**: Request bodies validated with Zod middleware on all POST endpoints
- [x] **BEND-03**: `GET /api/analysis/:id` endpoint exists for URL-based analysis retrieval
- [x] **BEND-04**: Service layer functions are independently testable (no req/res dependency)

### UX Fixes

- [x] **UX-01**: Analysis page uses URL parameter (`/analysis/:id`) — survives page refresh
- [ ] **UX-02**: Sentence input validates min/max length with inline error messages (frontend)
- [ ] **UX-03**: Backend validates sentence input length before processing
- [ ] **UX-04**: Gemini API calls have timeout (30s) with user-visible retry option

### Testing

- [x] **TEST-01**: Vitest + React Testing Library configured and running
- [ ] **TEST-02**: Backend service layer has unit tests for all service functions
- [ ] **TEST-03**: TanStack Query hooks have tests with mock API responses
- [ ] **TEST-04**: Analysis step components have rendering tests
- [ ] **TEST-05**: Database operations testable with in-memory SQLite

### Localization

- [ ] **L10N-01**: All AI-generated explanatory fields (summaries, role labels, explanations, tips, quiz Q&A) output in Simplified Chinese
- [ ] **L10N-02**: All English source material fields (sentence, text spans, skeleton, expressions, examples) remain in English
- [ ] **L10N-03**: systemInstruction and per-field schema descriptions enforce bilingual output contract

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Security

- **SEC-01**: Authentication/authorization for multi-user support
- **SEC-02**: Rate limiting on API endpoints
- **SEC-03**: CORS policy for cross-origin deployment

### Infrastructure

- **INFRA-01**: Database migration system for schema versioning
- **INFRA-02**: CI/CD pipeline with automated testing
- **INFRA-03**: Error monitoring/logging service integration

### Features

- **FEAT-01**: Shareable analysis links (public access)
- **FEAT-02**: Pagination/infinite scroll for Library page

## Out of Scope

| Feature | Reason |
|---------|--------|
| ORM (Drizzle/Prisma) | 3-table schema doesn't warrant ORM complexity |
| Global state management (Redux/Zustand) | TanStack Query handles server state; local state is sufficient for UI |
| SSR/SSG | Client-side SPA is appropriate for this use case |
| Mobile app | Web-only tool |
| Optimistic updates | Complexity not justified for current save patterns |
| 100% test coverage | Diminishing returns; target meaningful coverage of critical paths |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPE-01 | Phase 1 | Complete |
| TYPE-02 | Phase 1 | Complete |
| TYPE-03 | Phase 1 | Complete |
| TYPE-04 | Phase 1 | Complete |
| TYPE-05 | Phase 1 | Complete |
| TEST-01 | Phase 1 | Complete |
| BEND-01 | Phase 2 | Complete |
| BEND-02 | Phase 2 | Complete |
| BEND-03 | Phase 2 | Complete |
| BEND-04 | Phase 2 | Complete |
| FEND-01 | Phase 3 | Complete |
| FEND-02 | Phase 3 | Complete |
| FEND-03 | Phase 3 | Complete |
| FEND-04 | Phase 3 | Complete |
| FEND-05 | Phase 3 | Complete |
| FEND-06 | Phase 3 | Complete |
| UX-01 | Phase 3 | Complete |
| UX-02 | Phase 4 | Pending |
| UX-03 | Phase 4 | Pending |
| UX-04 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |
| TEST-03 | Phase 4 | Pending |
| TEST-04 | Phase 4 | Pending |
| TEST-05 | Phase 4 | Pending |
| L10N-01 | Phase 5 | Pending |
| L10N-02 | Phase 5 | Pending |
| L10N-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after Phase 5 planning*
