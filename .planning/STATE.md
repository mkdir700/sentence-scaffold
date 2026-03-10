---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Phase 7 context gathered
last_updated: "2026-03-10T08:50:08.344Z"
last_activity: 2026-03-10 — Roadmap created
progress:
  total_phases: 7
  completed_phases: 5
  total_plans: 10
  completed_plans: 10
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Sentence analysis workflow remains fully functional while codebase is restructured for maintainability
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 0 of 1 in current phase
Status: Ready to plan
Last activity: 2026-03-10 — Roadmap created

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation P01 | 3 | 2 tasks | 9 files |
| Phase 01-foundation P02 | 525637 | 1 tasks | 3 files |
| Phase 02-backend-separation P01 | 8 | 2 tasks | 8 files |
| Phase 02-backend-separation P02 | 8 | 2 tasks | 7 files |
| Phase 03-frontend-core-refactor P01 | 2 | 2 tasks | 7 files |
| Phase 03-frontend-core-refactor P02 | 20 | 2 tasks | 10 files |
| Phase 05-localize-ai-explanatory-content-to-user-language P01 | 2 | 2 tasks | 2 files |
| Phase 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing P01 | 525603 | 2 tasks | 6 files |
| Phase 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing P02 | 3 | 3 tasks | 7 files |
| Phase 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing P03 | 15 | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Types and Zod schemas must be defined before strict mode is enabled (avoids Pitfall 2)
- [Roadmap]: Backend separation precedes frontend hooks so API contract is stable when hooks are written
- [Roadmap]: TanStack Query migration + Analysis.tsx decomposition + URL navigation are one atomic Phase 3 (avoids Pitfall 1 + 3)
- [Roadmap]: Test infrastructure set up in Phase 1; comprehensive tests written in Phase 4 after architecture stabilizes
- [Phase 01-foundation]: Used zod v4 (npm default stable) — z.infer<> pattern identical, performance gains a bonus
- [Phase 01-foundation]: Zod and Google GenAI schemas coexist independently: Zod validates runtime responses, GenAI schema stays in ai.ts
- [Phase 01-foundation]: DB row types use plain TypeScript interfaces (no Zod) — DB is a trusted internal source
- [Phase 01-foundation]: TEST_DB env var set in vitest.config.ts test.env to ensure :memory: is active before module evaluation
- [Phase 01-foundation]: Strict mode was already clean before tsconfig change — Plan 01 types covered all strict-mode concerns, no @ts-expect-error needed
- [Phase 01-foundation]: Zod used only at external Gemini API boundary; DB queries use minimal typed casts (SentenceRow | undefined) — DB is trusted internal source
- [Phase 02-backend-separation]: saveToLibrary returns { success: false } for unknown sentence (matches server.ts 404 behavior but as typed value)
- [Phase 02-backend-separation]: Service layer uses pure functions with no Express dependency — BEND-04 proven by unit tests with in-memory SQLite
- [Phase 02-backend-separation]: Zod v4 ZodError uses .issues not .errors — fixed during controller creation
- [Phase 02-backend-separation]: z.record() in Zod v4 requires two args: z.record(z.string(), z.unknown())
- [Phase 02-backend-separation]: Three-layer separation complete: routes/controllers/services with no business logic in route handlers
- [Phase 03-frontend-core-refactor]: analysisQueryOptions uses staleTime: Infinity — analysis results are immutable once saved to DB
- [Phase 03-frontend-core-refactor]: QueryClientProvider wraps BrowserRouter with defaultOptions staleTime=5min, retry=1
- [Phase 03-frontend-core-refactor]: api object in src/lib/api.ts: thin typed wrappers with no caching logic, just fetch+error handling
- [Phase 03-frontend-core-refactor]: Step components are purely presentational — no data fetching, only typed props from Analysis.tsx
- [Phase 03-frontend-core-refactor]: analysisQueryOptions spread with enabled: !isNaN(analysisId) guards invalid IDs without conditional hook call
- [Phase 03-frontend-core-refactor]: History items navigate to /analysis/:id directly — no re-analysis, data already in DB
- [Phase 05-localize-ai-explanatory-content-to-user-language]: Explanatory field descriptions written in Chinese at schema level, not just in systemInstruction, to give per-field language cues
- [Phase 05-localize-ai-explanatory-content-to-user-language]: English-source fields (text, expression, examples, core_skeleton, subject, verb) retain explicit 'keep in English' qualifier in descriptions
- [Phase 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing]: practice.tasks uses .min(2).max(3) Zod constraint to enforce 2-3 tasks per the product decision
- [Phase 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing]: Cache clearing (DELETE FROM sentences) required as deployment step — existing rows store quiz JSON that fails Zod parse after this schema change
- [Phase 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing]: Free-form text prompt used for Gemini feedback (not responseSchema) — feedback is ephemeral 1-2 sentences needing no structured parse
- [Phase 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing]: vi.hoisted(() => vi.fn()) required for mock variables used inside vi.mock() factory — plain const causes ReferenceError due to hoisting
- [Phase 06]: useFeedback is the one exception to step components being purely presentational — feedback is per-card interactive state, not page-level data fetching
- [Phase 06]: Reference translation strictly hidden until submitted=true — locked product decision

### Roadmap Evolution

- Phase 5 added: Localize AI explanatory content to user language
- Phase 6 added: Replace quiz with scenario-based output practice (learning by doing)
- Phase 7 added: Integrate Vercel + Supabase with user auth (GitHub login) via better-auth, gate features behind login

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: Zod schema for Gemini response must be validated against a live API call early — schema may have drifted from actual response shape
- [Phase 1]: DB singleton needs an injection point (env var override for `:memory:`) before any tests are written
- [Phase 3]: Decide whether to implement TanStack Query key factory upfront or retrofit later (cheap at 4 keys, expensive at 10+)

## Session Continuity

Last session: 2026-03-10T08:50:08.340Z
Stopped at: Phase 7 context gathered
Resume file: .planning/phases/07-integrate-vercel-supabase-with-user-auth-github-login-via-better-auth-gate-features-behind-login/07-CONTEXT.md
