# Sentence Scaffold — Refactor

## What This Is

An AI-powered English sentence analysis tool that breaks down sentence structure using Google Gemini. Users enter a sentence and get a 6-step walkthrough (skeleton, modifiers, tree, meaning, chunks, quiz). They can save sentences and expression chunks to a personal library. This refactor aims to rebuild the codebase with proper TypeScript types, clean architecture, improved UX, and test coverage — without changing the core functionality.

## Core Value

The sentence analysis workflow must remain fully functional: enter sentence → get AI analysis → step through breakdown → save to library. The refactor must not break this flow at any point.

## Requirements

### Validated

- ✓ Sentence analysis via Google Gemini API — existing
- ✓ 6-step analysis walkthrough (skeleton, modifiers, tree, meaning, chunks, quiz) — existing
- ✓ Sentence caching in SQLite (avoid duplicate API calls) — existing
- ✓ Save sentences to personal library — existing
- ✓ Save expression chunks with examples — existing
- ✓ History of recent analyses — existing
- ✓ Library with tabbed views (history, saved, chunks) — existing

### Active

- [ ] Proper TypeScript types for all data structures (eliminate `any`)
- [ ] Component decomposition (break Analysis.tsx into focused components)
- [ ] Backend route/controller separation (extract from monolithic server.ts)
- [ ] TanStack Query for server state management
- [ ] Proper error handling (replace alert() with UI error states)
- [ ] Fix page refresh data loss on Analysis page (URL-based navigation)
- [ ] Loading state differentiation (cache check vs AI generation)
- [ ] Input validation (frontend + backend)
- [ ] Test infrastructure (Vitest) with key tests
- [ ] Custom hooks for shared logic

### Out of Scope

- Authentication/authorization — single-user tool, not needed for v1 refactor
- Database migrations — current schema is stable, add later if schema changes
- Rate limiting — single-user, not exposed publicly
- CORS policy — same-origin deployment
- Mobile app — web-only
- CI/CD pipeline — local development tool
- SSR/SSG — client-side SPA is fine for this use case

## Context

- Brownfield refactor of working application (~15 source files)
- React 19 + Express 4 + SQLite + Vite 6 + Tailwind CSS 4
- Google Gemini API integration with structured JSON schema output
- Existing UI uses shadcn-style component primitives (Button, Card, Badge, Input)
- Key pain points from codebase audit:
  - Pervasive `any` types across all pages
  - Analysis.tsx is 547 lines with no component extraction
  - All 7 API routes in a single server.ts file
  - Duplicate try-catch-alert patterns across components
  - Analysis page loses data on refresh (relies on router state)
  - No tests whatsoever

## Constraints

- **Tech stack**: Keep React + Express + SQLite + Vite + Tailwind (no framework switch)
- **Data**: Add TanStack Query for server state, keep local state for UI-only concerns
- **Backward compatibility**: Existing SQLite database must continue to work (no schema changes)
- **API contract**: Keep same REST endpoints (frontend/backend can be refactored independently)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep Express over Hono | Working stack, user preference, minimize migration risk | — Pending |
| TanStack Query for data fetching | Built-in caching, loading/error states, eliminates manual fetch boilerplate | — Pending |
| Vitest for testing | Vite-native, fast, good TypeScript support | — Pending |
| URL-based analysis navigation | Fix data loss on refresh, enable shareable links | — Pending |
| Extract Analysis.tsx into step components | Each step becomes testable, reusable, maintainable | — Pending |

---
*Last updated: 2026-03-10 after initialization*
