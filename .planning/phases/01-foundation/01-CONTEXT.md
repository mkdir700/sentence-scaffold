# Phase 1: Foundation - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Define all TypeScript types, Zod schemas, and configure test infrastructure. Enable strict mode. This phase establishes the type-safe foundation that every subsequent phase depends on. No behavioral changes to the application.

</domain>

<decisions>
## Implementation Decisions

### Schema strategy
- Zod schemas and Google GenAI schemas coexist independently — Zod is NOT the source for Google schema
- Zod validates Gemini API responses at runtime; Google GenAI schema stays in ai.ts for Gemini's structured output
- Validation failure = strict rejection (throw error, let caller handle retry/error)
- Phase 1 scope: only Gemini response gets a Zod schema; API request body schemas deferred to Phase 2
- Database row types use plain TypeScript interfaces (no Zod) — DB is a trusted internal data source

### Type file organization
- `src/types/` organized by domain: `analysis.ts` (Gemini response + Zod), `database.ts` (DB row interfaces), `api.ts` (request/response contracts)
- Barrel file `src/types/index.ts` re-exports everything
- Zod schema and derived type (`z.infer<>`) live in the same file (e.g., `AnalysisResultSchema` and `AnalysisResult` both in `analysis.ts`)
- `src/types/` is shared between frontend and backend — single source of truth for the monorepo

### Strict mode migration
- Enable `strict: true` in one shot — project is small (~15 files), fix all errors at once
- For code that needs types from future phases (e.g., server.ts DB queries): use `@ts-expect-error` with `// TODO(phase-N)` comments
- Keep single tsconfig.json — split into base/server/client deferred to Phase 2 if needed

### Test infrastructure
- Vitest configured with Node environment only (no jsdom) — DOM testing deferred to Phase 4
- Two smoke tests: (1) Zod schema validates a real Gemini response snapshot, (2) DB CRUD with in-memory SQLite
- DB `:memory:` injection via environment variable (e.g., `DATABASE_URL=:memory:` or `TEST_DB=:memory:`)
- Test files colocated next to source files (e.g., `src/types/analysis.test.ts`)

### Claude's Discretion
- Exact Zod schema field naming and nesting decisions
- vitest.config.ts setup details
- Which specific `@ts-expect-error` annotations are needed and where
- Test assertion style and structure

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ai.ts` analysisSchema (~140 lines): Complete Gemini response structure definition — use as reference when writing Zod schema
- `db/index.ts` schema DDL: 3 tables (sentences, saved_sentences, chunks) — derive DB row interfaces from these column definitions
- shadcn-style UI primitives (Button, Card, Badge, Input): Not relevant for Phase 1 but available for later

### Established Patterns
- Google GenAI SDK with `Type`/`Schema` imports for structured output — must preserve this pattern alongside new Zod schemas
- Express + Vite dev middleware in single server.ts — affects how tsconfig paths resolve
- `clsx` + `tailwind-merge` via `src/lib/utils.ts` — cn() utility pattern established

### Integration Points
- `ai.ts` `analyzeSentence()` return type: currently `any` (JSON.parse) — Zod parse goes here
- `server.ts` DB queries: all use `as any` casts — DB row interfaces replace these
- `db/index.ts` singleton export: needs env var check for `:memory:` override

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-10*
