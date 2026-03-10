---
phase: 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing
plan: 01
subsystem: api
tags: [zod, typescript, gemini, genai, schema, practice]

# Dependency graph
requires:
  - phase: 05-localize-ai-explanatory-content-to-user-language
    provides: Chinese-language field descriptions in GenAI schema and systemInstruction

provides:
  - AnalysisResultSchema with practice field (scenario + 2-3 tasks with cn/hint/reference)
  - GenAI analysisSchema mirroring the Zod practice structure
  - AI systemInstruction with OUTPUT PRACTICE guidance
  - Updated StepQuiz component rendering scenario-based translation tasks
  - Updated test fixtures using practice instead of quiz

affects:
  - 06-02 (backend feedback endpoint consuming AnalysisResult.practice)
  - 06-03 (frontend practice component rendering practice field)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod schema and GenAI Schema stay in sync: every Zod field has a parallel GenAI property with Chinese descriptions"
    - "Existing components updated in-place when schema changes break their props (Rule 3 auto-fix)"

key-files:
  created: []
  modified:
    - src/types/analysis.ts
    - src/services/ai.ts
    - src/types/analysis.test.ts
    - server/services/analysis.test.ts
    - src/components/analysis/StepQuiz.tsx
    - src/pages/Analysis.tsx

key-decisions:
  - "practice.tasks uses .min(2).max(3) Zod constraint to enforce 2-3 tasks per the product decision"
  - "StepQuiz.tsx renamed props from quiz to practice but kept component name StepQuiz for minimal diff surface"
  - "Cache clearing (DELETE FROM sentences) documented as a deployment step — existing rows store quiz JSON that will fail Zod parse after this change"

patterns-established:
  - "Practice task shape: { cn: string, hint: string, reference: string } — cn is Chinese source, hint names the chunk to use, reference is English model answer"

requirements-completed: [PRAC-01, PRAC-02, PRAC-05]

# Metrics
duration: 22min
completed: 2026-03-10
---

# Phase 6 Plan 01: Practice Schema Summary

**Zod AnalysisResultSchema updated from quiz array to practice object (scenario + 2-3 translation tasks with cn/hint/reference), GenAI schema mirrored, and StepQuiz component wired to render the new structure**

## Performance

- **Duration:** 22 min
- **Started:** 2026-03-10T07:52:00Z
- **Completed:** 2026-03-10T08:14:29Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- AnalysisResultSchema now has `practice` field with scenario + tasks[{cn, hint, reference}] replacing `quiz`
- GenAI analysisSchema fully mirrors the new Zod structure with Chinese-language field descriptions and required arrays
- AI systemInstruction extended with OUTPUT PRACTICE guidance for scenario-based generation
- All 20 tests pass with updated practice fixtures
- Zero TypeScript errors after updating StepQuiz component and Analysis.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace quiz with practice in Zod schema and GenAI schema** - `87378cf` (feat)
2. **Task 2: Update test fixtures and clear analysis cache** - `55a401e` (feat)

## Files Created/Modified
- `src/types/analysis.ts` - quiz field replaced with practice z.object (scenario + tasks .min(2).max(3))
- `src/services/ai.ts` - GenAI analysisSchema practice property, required array updated, systemInstruction extended
- `src/types/analysis.test.ts` - REAL_GEMINI_RESPONSE_SNAPSHOT updated from quiz to practice fixture
- `server/services/analysis.test.ts` - MOCK_ANALYSIS updated from quiz to practice fixture
- `src/components/analysis/StepQuiz.tsx` - Rewritten to render practice (scenario label + translation task cards)
- `src/pages/Analysis.tsx` - Updated prop from data.quiz to data.practice

## Decisions Made
- `practice.tasks` constrained with `.min(2).max(3)` — enforces the product decision of 2-3 tasks at runtime
- StepQuiz.tsx kept its filename and export name (`StepQuiz`) to minimize diff surface; props renamed from `quiz` to `practice`
- Cache clearing is a **deployment step**: run `DELETE FROM sentences` before deploying. Existing cached rows store `quiz` JSON that will fail `AnalysisResultSchema.parse()` after this change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated StepQuiz.tsx and Analysis.tsx to remove quiz references**
- **Found during:** Task 1 (TypeScript compile check after schema change)
- **Issue:** `StepQuiz.tsx` referenced `AnalysisResult["quiz"]` which no longer exists; `Analysis.tsx` passed `data.quiz` to StepQuiz — both caused TypeScript errors blocking compilation
- **Fix:** Rewrote StepQuiz to accept `practice: AnalysisResult["practice"]` and render scenario + task cards; updated Analysis.tsx to pass `data.practice`
- **Files modified:** src/components/analysis/StepQuiz.tsx, src/pages/Analysis.tsx
- **Verification:** `npx tsc --noEmit` reports zero errors
- **Committed in:** 87378cf (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for TypeScript compilation — frontend components consuming the schema must be updated whenever the schema changes. No scope creep.

## Issues Encountered
None beyond the blocking TypeScript errors described above.

## User Setup Required

**Deployment note:** Before deploying this change to production, run:
```sql
DELETE FROM sentences;
```
Existing cached analyses store `quiz` JSON. After this update, `AnalysisResultSchema.parse()` will reject those rows because `quiz` is no longer a valid field and `practice` is required. Clearing the cache forces fresh analyses that produce the new format.

## Next Phase Readiness
- Data contract established: `AnalysisResult.practice` is the source of truth for all downstream work
- Plan 06-02 (backend feedback endpoint) can now consume `practice.tasks` from the DB
- Plan 06-03 (frontend practice component) can import `AnalysisResult["practice"]` type directly

---
*Phase: 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing*
*Completed: 2026-03-10*
