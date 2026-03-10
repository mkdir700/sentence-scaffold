---
phase: 2
slug: backend-separation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 (already installed) |
| **Config file** | `vitest.config.ts` (needs `include` updated for `server/**/*.test.ts`) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | BEND-01 | type-check + unit | `npx tsc --noEmit && npx vitest run server/` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | BEND-02 | unit | `npx vitest run server/services/` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | BEND-03 | unit | `npx vitest run server/services/analysis.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | BEND-04 | unit | `npx vitest run server/services/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Update `include` to add `"server/**/*.test.ts"` alongside existing `"src/**/*.test.ts"`
- [ ] `server/services/analysis.test.ts` — Unit tests for `checkSentence()`, `getAnalysisById()`, `saveSentence()` (covers BEND-03, BEND-04)
- [ ] `server/services/library.test.ts` — Unit tests for library service functions (covers BEND-04)
- [ ] `server/services/chunks.test.ts` — Unit tests for chunks service functions (covers BEND-04)
- [ ] Create `server/routes/`, `server/controllers/`, `server/services/` directories

*Wave 0 tasks must be completed before any implementation tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Route registration works end-to-end | BEND-01 | Integration requires running server | Start server, hit each endpoint with curl |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
