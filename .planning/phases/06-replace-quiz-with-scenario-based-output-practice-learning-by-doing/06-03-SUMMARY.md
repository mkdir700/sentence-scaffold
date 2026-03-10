---
phase: 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing
plan: 03
subsystem: ui
tags: [react, tanstack-query, mutation, gemini, feedback]

requires:
  - phase: 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing-01
    provides: practice schema (scenario + tasks with cn/hint/reference), test fixtures
  - phase: 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing-02
    provides: POST /api/feedback endpoint with Gemini integration

provides:
  - StepPractice component with per-card useFeedback mutation and submit-then-reveal flow
  - api.getFeedback() API client method
  - useFeedback() mutation hook (ephemeral, no cache invalidation)
  - StepQuiz.tsx removed entirely

affects:
  - Any future UI phases that build on Analysis.tsx step components

tech-stack:
  added: []
  patterns:
    - "Per-card useFeedback() mutation hook: each PracticeCard owns its own feedback state independently"
    - "Submit-then-reveal: reference translation and AI commentary hidden until submitted=true"
    - "Disabled button pattern: isPending || submitted || !answer.trim() prevents double-submit"

key-files:
  created:
    - src/components/analysis/StepPractice.tsx
  modified:
    - src/lib/api.ts
    - src/hooks/mutations.ts
    - src/pages/Analysis.tsx
  deleted:
    - src/components/analysis/StepQuiz.tsx

key-decisions:
  - "useFeedback is the one exception to step components being purely presentational — feedback is per-card interactive state, not page-level data fetching"
  - "Reference translation strictly hidden until submitted=true — locked product decision from plan"
  - "Emerald for AI feedback, indigo for reference translation, amber for scenario/hint badge — per design system color semantics"

requirements-completed: [PRAC-04]

duration: 15min
completed: 2026-03-10
---

# Phase 6 Plan 03: StepPractice Frontend Component Summary

**Interactive scenario-based practice component with per-card Gemini feedback, replacing StepQuiz, wired into Analysis.tsx at step 6**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-10T08:20:00Z
- **Completed:** 2026-03-10T08:35:00Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 3 modified, 1 deleted)

## Accomplishments
- Created `StepPractice.tsx` with per-card `useFeedback()` mutation integration — each task card independently submits and receives AI feedback
- Implemented submit-then-reveal flow: reference translation and AI commentary are strictly hidden until user submits
- Submit button disabled during API call (`isPending`), after submission (`submitted`), and when input is empty (`!answer.trim()`) — prevents double-submit
- Deleted `StepQuiz.tsx` entirely — no quiz references remain in the frontend
- Updated `Analysis.tsx` to import `StepPractice` and pass `data.practice` at step 6

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getFeedback to api client and create useFeedback mutation hook** - `12c1fd2` (feat — already committed in prior session as part of Plan 02 cleanup)
2. **Task 2: Create StepPractice component, delete StepQuiz, update Analysis.tsx** - `e9102e3` (feat)

## Files Created/Modified
- `src/components/analysis/StepPractice.tsx` - New component: scenario card (amber), PracticeCard per task with textarea/submit, reveals feedback after submission
- `src/lib/api.ts` - Added `api.getFeedback()` POST method to `/api/feedback`
- `src/hooks/mutations.ts` - Added `useFeedback()` mutation (ephemeral, no cache invalidation needed)
- `src/pages/Analysis.tsx` - Replaced `StepQuiz` import/usage with `StepPractice`
- `src/components/analysis/StepQuiz.tsx` - Deleted

## Decisions Made
- `useFeedback()` is called inside `PracticeCard` rather than `StepPractice` — each card manages its own mutation state independently, enabling parallel independent submissions across cards
- Reference translation is strictly hidden before `submitted === true`, even if the mutation is pending — matches the "one-shot, no rewrite" product decision
- Emerald used for AI feedback commentary (success/summary semantic), indigo for reference translation (primary accent), amber for scenario/hints (tips semantic) — follows the CLAUDE.md design system

## Deviations from Plan

None — plan executed exactly as written.

(Note: Task 1 work was already present in git history from prior Plan 02 session. Files were verified to match spec and tests pass. No re-implementation was necessary.)

## Issues Encountered
- Initial TypeScript check showed an error for `server/services/feedback.test.ts` referencing `./feedback.js`, but `feedback.ts` already existed as an untracked file in the working tree from Plan 02's prior partial execution. Once verified as complete and correct, the build compiled cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 6 is complete: quiz replaced with scenario-based practice, full end-to-end flow functional
- The `data.practice` field from `AnalysisResult` flows through Analysis.tsx to StepPractice to each PracticeCard
- POST /api/feedback endpoint is live and wired to Gemini for real-time commentary

---
*Phase: 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing*
*Completed: 2026-03-10*
