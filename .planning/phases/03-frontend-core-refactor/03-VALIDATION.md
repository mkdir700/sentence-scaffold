---
phase: 3
slug: frontend-core-refactor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 (already installed) |
| **Config file** | `vitest.config.ts` (exists — environment: "node") |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke test
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | FEND-04 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | FEND-02 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | FEND-01, FEND-05 | type-check + file existence | `npx tsc --noEmit && ls src/components/analysis/` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | FEND-02, FEND-03, FEND-06, UX-01 | type-check + grep + manual | `npx tsc --noEmit && grep -r "alert(" src/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install @tanstack/react-query @tanstack/react-query-devtools` — TanStack Query v5
- [ ] Create `src/hooks/` directory — empty, no files yet
- [ ] Create `src/lib/api.ts` — typed fetch wrapper stub
- [ ] Create `src/components/analysis/` directory — empty, no step files yet

*vitest.config.ts does NOT need updating for Phase 3 (no component tests written in this phase)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/analysis/:id` direct navigation works | UX-01 | Requires browser interaction | Open `localhost:3000/analysis/1` directly; page shows analysis without data loss |
| Cache-hit vs new generation UX | FEND-05 | Visual behavior | 1) Navigate to cached analysis (no spinner) 2) Submit new sentence (shows "Generating..." state) |
| Save + Library refresh | FEND-06 | Cross-page navigation | Save sentence, navigate to Library, new item visible without manual refresh |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
