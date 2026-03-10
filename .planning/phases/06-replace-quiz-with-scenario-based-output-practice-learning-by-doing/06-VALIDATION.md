---
phase: 6
slug: replace-quiz-with-scenario-based-output-practice-learning-by-doing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | Schema change | unit | `npm test -- src/types/analysis.test.ts` | ✅ needs update | ⬜ pending |
| 06-01-02 | 01 | 1 | Fixture update | unit | `npm test -- server/services/` | ✅ needs update | ⬜ pending |
| 06-02-01 | 02 | 1 | getFeedback service | unit | `npm test -- server/services/feedback.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | handleGetFeedback controller | unit | `npm test -- server/controllers/feedback.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/services/feedback.test.ts` — stubs for getFeedback service
- [ ] `server/controllers/feedback.test.ts` — stubs for handleGetFeedback validation
- [ ] Update `src/types/analysis.test.ts` — replace `quiz` fixture with `practice` fixture
- [ ] Update `server/services/analysis.test.ts` `MOCK_ANALYSIS` — replace `quiz` with `practice`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scenario UI renders correctly | UI layout | Visual design verification | Load analysis, navigate to Step 6, verify scenario card layout |
| Feedback displays after submit | UX flow | Requires Gemini API interaction | Submit translation, verify feedback appears with reference + commentary |
| Sequential sentence submission | UX flow | Multi-step user interaction | Complete sentence 1, verify sentence 2 unlocks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
