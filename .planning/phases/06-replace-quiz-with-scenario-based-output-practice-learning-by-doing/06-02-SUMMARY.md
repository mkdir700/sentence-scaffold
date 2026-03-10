---
phase: 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing
plan: 02
subsystem: api
tags: [express, gemini, zod, vitest, feedback, tdd]

# Dependency graph
requires:
  - phase: 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing-01
    provides: practice schema with tasks array (cn, hint, reference fields) added to AnalysisResult

provides:
  - POST /api/feedback endpoint accepting userTranslation, reference, hint, cn
  - getFeedback service calling Gemini with Chinese comparison prompt
  - handleGetFeedback controller with Zod validation (400 on missing fields)
  - FeedbackRequest and FeedbackResponse types in src/types/api.ts

affects:
  - 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing-03
  - frontend-practice-component

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Three-layer backend: route -> controller -> service (same as analysis/library/chunks)
    - vi.hoisted() for mock variables used inside vi.mock() factory functions
    - Free-form text prompt for Gemini (not responseSchema) for ephemeral feedback content

key-files:
  created:
    - server/services/feedback.ts
    - server/services/feedback.test.ts
    - server/controllers/feedback.ts
    - server/controllers/feedback.test.ts
    - server/routes/feedback.ts
  modified:
    - server.ts
    - src/types/api.ts

key-decisions:
  - "Free-form text prompt used for Gemini feedback (not responseSchema) — feedback is ephemeral, 1-2 sentences, no structured parsing needed"
  - "vi.hoisted() required for mock variables referenced inside vi.mock() factory — hoisting order causes ReferenceError otherwise"

patterns-established:
  - "vi.hoisted(() => vi.fn()) for mocks used inside vi.mock() factories in vitest"
  - "GoogleGenAI constructor mock uses regular function (not arrow) to support new keyword"

requirements-completed: [PRAC-03]

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 6 Plan 02: Feedback API Endpoint Summary

**POST /api/feedback endpoint with Gemini-powered Chinese commentary, Zod validation, and three-layer route/controller/service architecture**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-10T08:17:10Z
- **Completed:** 2026-03-10T08:20:44Z
- **Tasks:** 3 (Task 0 TDD RED + Task 1 TDD GREEN + Task 2 route registration)
- **Files modified:** 7

## Accomplishments
- Feedback service calls Gemini with a Chinese comparison prompt; returns 1-2 sentence commentary
- Controller validates all 4 required fields (userTranslation, reference, hint, cn) via Zod, returning 400 with descriptive errors on missing/empty values
- feedbackRouter registered in server.ts at /api, completing the three-layer pattern
- 7 new tests pass (2 service, 5 controller); 27 total project tests green

## Task Commits

Each task was committed atomically:

1. **Task 0: Create test stubs (RED)** - `f17ac86` (test)
2. **Task 1: Implement service and controller (GREEN)** - `a27a1b0` (feat)
3. **Task 2: Create route and register in server.ts** - `12c1fd2` (feat)

_Note: TDD task 0 (RED) and task 1 (GREEN) committed separately per TDD protocol_

## Files Created/Modified
- `server/services/feedback.ts` - getFeedback calls Gemini with Chinese comparison prompt
- `server/services/feedback.test.ts` - Unit tests with mocked GoogleGenAI via vi.hoisted()
- `server/controllers/feedback.ts` - handleGetFeedback with Zod schema validation
- `server/controllers/feedback.test.ts` - 5 controller tests (4x 400 on missing fields, 1x 200 success)
- `server/routes/feedback.ts` - Express router mapping POST /feedback to handleGetFeedback
- `server.ts` - feedbackRouter imported and registered at /api
- `src/types/api.ts` - FeedbackRequest and FeedbackResponse interfaces added

## Decisions Made
- Free-form text prompt used for Gemini (not responseSchema) — feedback commentary is ephemeral and doesn't need structured parsing
- `vi.hoisted(() => vi.fn())` pattern required for service test — vi.mock() factory runs before variable declarations due to hoisting, causing ReferenceError with plain `const`
- GoogleGenAI mock uses regular `function` constructor (not arrow function) to support `new` keyword invocation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.mock() hoisting issue in service test**
- **Found during:** Task 0 (test stub creation)
- **Issue:** `const mockGenerateContent = vi.fn()` declared before `vi.mock()` call, but vi.mock() is hoisted by vitest transformer — the variable was not yet initialized when mock factory ran, causing ReferenceError
- **Fix:** Changed to `const mockGenerateContent = vi.hoisted(() => vi.fn())` which runs before hoisted vi.mock() factories
- **Files modified:** server/services/feedback.test.ts
- **Verification:** 2 service tests pass
- **Committed in:** a27a1b0 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed GoogleGenAI mock constructor — arrow function not usable with new**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** `vi.fn().mockImplementation(() => ({...}))` creates an arrow function which cannot be called with `new` — TypeError thrown at module load time
- **Fix:** Changed mock to use regular function syntax: `GoogleGenAI: function() { return {...}; }`
- **Files modified:** server/services/feedback.test.ts
- **Verification:** 2 service tests pass
- **Committed in:** a27a1b0 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs in test mock setup)
**Impact on plan:** Both fixes required for tests to work correctly. No scope creep — implementation files match plan exactly.

## Issues Encountered
- vitest mock hoisting order is non-obvious: variables declared with `const` in test file body are NOT available inside `vi.mock()` factory functions because vi.mock() is hoisted before variable initialization. Solution is `vi.hoisted()`.

## User Setup Required
None - no external service configuration required beyond existing GEMINI_API_KEY already in use.

## Next Phase Readiness
- POST /api/feedback is ready for the frontend PracticePanel component to call
- Endpoint accepts exactly the fields that practice.tasks contains: cn, hint, reference (plus userTranslation from user input)
- No blockers for phase 06-03

---
*Phase: 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing*
*Completed: 2026-03-10*

## Self-Check: PASSED

All files confirmed present. All commits confirmed in git log:
- f17ac86: test stubs (RED)
- a27a1b0: service + controller (GREEN)
- 12c1fd2: route + server registration
