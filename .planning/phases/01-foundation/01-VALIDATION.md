---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` (Wave 0 installs) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | TEST-01 | smoke | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | TYPE-01 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | TYPE-02 | unit | `npx vitest run src/types/analysis.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | TYPE-03 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | TYPE-04 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-06 | 01 | 2 | TYPE-05 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration with `environment: "node"` and `env: { TEST_DB: ":memory:" }`
- [ ] `src/types/analysis.test.ts` — Smoke test for Zod schema against fixture snapshot (covers TYPE-02)
- [ ] `src/db/index.test.ts` — Smoke test for in-memory DB CRUD (covers TEST-01)
- [ ] Framework install: `npm install -D vitest` — Vitest not in package.json
- [ ] Library install: `npm install zod` — Zod not in package.json
- [ ] Library install: `npm install -D @types/better-sqlite3` — needed for typed DB queries (TYPE-04)
- [ ] `package.json` test script: `"test": "vitest run"` — not present

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
