---
phase: 5
slug: localize-ai-explanatory-content-to-user-language
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (already configured) |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- server/services/analysis.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | Prompt localization | unit (mock) | `npm test -- server/services/analysis.test.ts` | ✅ (needs fixture update) | ⬜ pending |
| 05-01-02 | 01 | 1 | Zod schema accepts Chinese | unit | `npm test -- src/types/analysis.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | English fields stay English | unit (mock) | `npm test -- server/services/analysis.test.ts` | ✅ (needs fixture update) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Update `MOCK_ANALYSIS` in `server/services/analysis.test.ts` — change explanatory fields to Chinese strings
- [ ] Live smoke test (manual): call `analyzeSentence()` against real Gemini API; verify Chinese text in explanatory fields

*Existing test infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chinese explanatory text from live Gemini | Prompt produces Chinese | Requires live API call | Run app, analyze a sentence, verify Chinese descriptions |
| English source material preserved | English fields stay English | Visual inspection of live output | Check `expression`, `examples`, `text` fields |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
