---
phase: 05-localize-ai-explanatory-content-to-user-language
plan: "01"
subsystem: ai
tags: [gemini, prompt-engineering, i18n, localization, simplified-chinese]

# Dependency graph
requires:
  - phase: 03-frontend-core-refactor
    provides: TanStack Query wiring + Analysis.tsx step components that display AI-generated fields
provides:
  - Bilingual Gemini prompt configuration — Chinese explanations, English source material
  - Updated MOCK_ANALYSIS fixture with Chinese explanatory strings
affects: [04-testing, frontend-step-components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-category field rule: explanatory fields get Chinese descriptions, English-source fields get 'keep in English' descriptions"
    - "systemInstruction declares language contract globally; field descriptions reinforce it per-field"

key-files:
  created: []
  modified:
    - src/services/ai.ts
    - server/services/analysis.test.ts

key-decisions:
  - "Explanatory field descriptions written in Chinese (用中文) to reinforce language contract at the schema level, not just the systemInstruction"
  - "English-source fields (text, expression, examples, core_skeleton, subject, verb) retain English descriptions with explicit 'keep in English' qualifier"
  - "MOCK_ANALYSIS quiz reference_answer keeps quoted English ('The quick brown fox') since it's a source reference, not explanatory prose"

patterns-established:
  - "Two-category prompt rule: explanatory content -> 简体中文, source material -> English"

requirements-completed:
  - L10N-01
  - L10N-02
  - L10N-03

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 5 Plan 01: Localize AI Explanatory Content Summary

**Bilingual Gemini prompt via systemInstruction language rules and per-field Chinese/English schema descriptions, with Chinese MOCK_ANALYSIS fixture confirming roundtrip correctness**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T07:27:09Z
- **Completed:** 2026-03-10T07:29:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- systemInstruction now declares explicit bilingual contract: all explanatory content in 简体中文, all English source material stays in English, no mixing within a field
- All explanatory fields in analysisSchema (category, summary, role, modifies, explains, meaning, key_points, chunks.meaning, review_summary, quiz) have Chinese-language descriptions reinforcing the constraint
- English-source fields (subject, verb, core_skeleton, text, expression, examples) have English descriptions with "keep in English" qualifier
- MOCK_ANALYSIS updated to use Chinese strings in all explanatory fields — test suite validates Chinese content roundtrips correctly through save/retrieve

## Task Commits

Each task was committed atomically:

1. **Task 1: Update systemInstruction and analysisSchema field descriptions for bilingual output** - `6ff7b6e` (feat)
2. **Task 2: Update MOCK_ANALYSIS fixture to use Chinese explanatory strings** - `9b05502` (feat)

## Files Created/Modified
- `src/services/ai.ts` - Bilingual systemInstruction + Chinese/English field descriptions in analysisSchema
- `server/services/analysis.test.ts` - MOCK_ANALYSIS with Chinese strings in all explanatory fields

## Decisions Made
- Explanatory field descriptions written in Chinese directly (not just in systemInstruction) to give the model per-field language cues at schema level
- English-source fields get explicit "keep in English" qualifier so the model understands both sides of the contract
- MOCK_ANALYSIS quiz reference_answer retains quoted English text ("The quick brown fox") since it's a source-material reference, not explanatory prose

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Bilingual AI output configuration is complete; the next live Gemini call will produce Chinese explanatory text
- Optional manual smoke test: run `analyzeSentence("The cat sat on the mat.")` against live Gemini and verify explanatory fields contain Chinese
- No frontend or database changes required — the existing step components display whatever strings come from the analysis object

---
*Phase: 05-localize-ai-explanatory-content-to-user-language*
*Completed: 2026-03-10*
