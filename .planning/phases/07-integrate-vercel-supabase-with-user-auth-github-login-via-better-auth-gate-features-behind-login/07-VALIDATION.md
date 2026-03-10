---
phase: 7
slug: integrate-vercel-supabase-with-user-auth-github-login-via-better-auth-gate-features-behind-login
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-10
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test -- --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test -- --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 0 | Scaffold Next.js app shell and tooling baseline | unit / smoke | `npm test` | ❌ W0 | ⬜ pending |
| 7-01-02 | 01 | 0 | Configure better-auth with GitHub OAuth and auth route handler | unit | `npm test -- auth` | ❌ W0 | ⬜ pending |
| 7-01-03 | 01 | 0 | Add protected/public routing and middleware gate | unit | `npm test -- middleware` | ❌ W0 | ⬜ pending |
| 7-02-01 | 02 | 1 | Create Supabase schema and data access layer | unit | `npm test -- services` | ❌ W0 | ⬜ pending |
| 7-02-02 | 02 | 1 | Enforce per-user access for saved items and chunks | unit | `npm test -- services` | ❌ W0 | ⬜ pending |
| 7-03-01 | 03 | 1 | Rebuild landing page and login flow | component / smoke | `npm test -- auth` | ❌ W0 | ⬜ pending |
| 7-03-02 | 03 | 1 | Rebuild authenticated app shell with avatar menu | component | `npm test -- app-shell` | ❌ W0 | ⬜ pending |
| 7-04-01 | 04 | 2 | Port analysis and library API routes to Next Route Handlers | unit / integration | `npm test -- api` | ❌ W0 | ⬜ pending |
| 7-04-02 | 04 | 2 | Handle 401 redirects and protected data fetching | unit / integration | `npm test -- api` | ❌ W0 | ⬜ pending |
| 7-05-01 | 05 | 2 | Deploy-ready Vercel and environment configuration | smoke | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/auth.ts` — better-auth server config
- [ ] `src/lib/auth-client.ts` — better-auth client hooks
- [ ] `src/app/api/auth/[...all]/route.ts` — auth handler
- [ ] `src/middleware.ts` — route protection
- [ ] `src/lib/supabase/server.ts` — server Supabase client
- [ ] `src/lib/supabase/client.ts` — browser Supabase client
- [ ] Updated `vitest.config.ts` for Next.js App Router structure
- [ ] Test stubs for auth, middleware, services, and route handlers

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub OAuth redirect flow works end-to-end | GitHub login is the only auth method | Requires real provider credentials and callback round-trip | Open landing page → click Sign in with GitHub → complete OAuth → confirm redirect to `/home` |
| Protected routes redirect unauthenticated users to login | Full-site login gate | Middleware + browser navigation flow is easier to confirm manually | Visit `/home`, `/library`, `/analysis/[id]` while signed out → confirm redirect to `/login` |
| Logout returns user to landing page | Logout behavior | Involves browser session teardown and redirect timing | Open avatar menu → click logout → confirm redirect to `/` and protected routes no longer load |
| Header avatar/dropdown reflects logged-in GitHub account | Header auth UX | Visual behavior and menu interaction are UI-specific | Sign in → confirm avatar renders in header and dropdown contains logout action |
| Vercel deployment has correct env wiring | Deploy on Vercel | Depends on hosted environment and secrets | Deploy preview → confirm auth callback, DB access, and analysis requests succeed |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
