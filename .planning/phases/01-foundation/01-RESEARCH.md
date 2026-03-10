# Phase 1: Foundation - Research

**Researched:** 2026-03-10
**Domain:** TypeScript strict mode, Zod schema definition, Vitest setup, better-sqlite3 typed queries
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Schema strategy:**
- Zod schemas and Google GenAI schemas coexist independently — Zod is NOT the source for Google schema
- Zod validates Gemini API responses at runtime; Google GenAI schema stays in ai.ts for Gemini's structured output
- Validation failure = strict rejection (throw error, let caller handle retry/error)
- Phase 1 scope: only Gemini response gets a Zod schema; API request body schemas deferred to Phase 2
- Database row types use plain TypeScript interfaces (no Zod) — DB is a trusted internal data source

**Type file organization:**
- `src/types/` organized by domain: `analysis.ts` (Gemini response + Zod), `database.ts` (DB row interfaces), `api.ts` (request/response contracts)
- Barrel file `src/types/index.ts` re-exports everything
- Zod schema and derived type (`z.infer<>`) live in the same file (e.g., `AnalysisResultSchema` and `AnalysisResult` both in `analysis.ts`)
- `src/types/` is shared between frontend and backend — single source of truth for the monorepo

**Strict mode migration:**
- Enable `strict: true` in one shot — project is small (~15 files), fix all errors at once
- For code that needs types from future phases (e.g., server.ts DB queries): use `@ts-expect-error` with `// TODO(phase-N)` comments
- Keep single tsconfig.json — split into base/server/client deferred to Phase 2 if needed

**Test infrastructure:**
- Vitest configured with Node environment only (no jsdom) — DOM testing deferred to Phase 4
- Two smoke tests: (1) Zod schema validates a real Gemini response snapshot, (2) DB CRUD with in-memory SQLite
- DB `:memory:` injection via environment variable (e.g., `DATABASE_URL=:memory:` or `TEST_DB=:memory:`)
- Test files colocated next to source files (e.g., `src/types/analysis.test.ts`)

### Claude's Discretion
- Exact Zod schema field naming and nesting decisions
- vitest.config.ts setup details
- Which specific `@ts-expect-error` annotations are needed and where
- Test assertion style and structure

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TYPE-01 | All data structures have explicit TypeScript interfaces in `src/types/` | Domain-based file organization pattern; DB row interfaces derived from DDL |
| TYPE-02 | Gemini API response validated at runtime with Zod schema | Zod `z.object()` + `.parse()` pattern; schema mirrored from existing `analysisSchema` in `ai.ts` |
| TYPE-03 | Zod schemas serve as single source of truth for TypeScript types via `z.infer<>` | `type AnalysisResult = z.infer<typeof AnalysisResultSchema>` pattern; same file colocation |
| TYPE-04 | Database query results use better-sqlite3 generics (no `any` casts) | `db.prepare(...).get(id) as SentenceRow` pattern with plain interfaces — no native generics in @types/better-sqlite3 |
| TYPE-05 | `strict: true` enabled in tsconfig.json with zero `any` types remaining | Add `"strict": true` to existing tsconfig; fix errors; use `@ts-expect-error` for forward-reference spots |
| TEST-01 | Vitest + React Testing Library configured and running | Install `vitest`; create `vitest.config.ts` with `environment: "node"`; two smoke tests colocated with source |
</phase_requirements>

---

## Summary

Phase 1 is a pure foundation phase: no behavioral changes, only type definitions, schema validation, and test infrastructure. The existing codebase has ~15 TypeScript files with no `src/types/` directory, no `strict` mode, and no test runner. The Gemini response structure is already fully documented in `src/services/ai.ts` as a Google GenAI `Schema` object — this serves as the authoritative reference for building the corresponding Zod schema.

The critical integration point is `db/index.ts`, which exports a module-level singleton `db` wired to a file path. In-memory test injection requires an env var check at the singleton construction site before any test can run against it. The tsconfig currently has no `strict` flag, which means adding it will surface errors (primarily `any` casts in `server.ts` and untyped DB query returns) that need to be resolved or annotated.

Vitest is the natural choice because the project already uses Vite and TypeScript 5.8. The `node` environment is sufficient — no `jsdom` needed for Phase 1 smoke tests. Zod v4 (current stable) provides the `z.infer<>` pattern that satisfies TYPE-03 out of the box.

**Primary recommendation:** Install Zod + Vitest, create `src/types/` with three domain files + barrel, replace `JSON.parse(text)` in `analyzeSentence()` with `AnalysisResultSchema.parse(JSON.parse(text))`, enable `strict: true`, fix all errors, add two smoke tests colocated with their modules.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^3.x (v3) or ^4.x (v4) | Runtime schema validation + TypeScript inference | De facto standard for TypeScript runtime validation; `z.infer<>` eliminates manual type duplication |
| vitest | ^3.x | Test runner | Native Vite integration; faster than Jest; same config file as vite.config.ts |
| @types/better-sqlite3 | ^7.6.x | TypeScript types for better-sqlite3 | Required for typed `db.prepare().get() as T` pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/coverage-v8 | optional | Coverage reporting | If coverage gates are needed later |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zod | valibot, typebox | Zod is most widely adopted; valibot is smaller bundle but adds migration risk; typebox needs JSON Schema tooling |
| vitest | jest | Jest works but requires separate config; Vitest reuses vite.config.ts plugins and paths automatically |

### Installation

```bash
npm install zod
npm install -D vitest @types/better-sqlite3
```

Note: `@types/better-sqlite3` may already be needed — check if it is present in devDependencies. `better-sqlite3` itself is already in `dependencies`.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── types/
│   ├── analysis.ts      # Zod schema (AnalysisResultSchema) + z.infer<> type
│   ├── database.ts      # Plain TS interfaces for DB rows (SentenceRow, SavedSentenceRow, ChunkRow)
│   ├── api.ts           # Request/response contract interfaces (empty or minimal in Phase 1)
│   └── index.ts         # Barrel re-export of all types
├── services/
│   └── ai.ts            # MODIFIED: JSON.parse → AnalysisResultSchema.parse(JSON.parse(...))
├── db/
│   └── index.ts         # MODIFIED: env var check for :memory: injection
└── ...existing files
```

### Pattern 1: Zod Schema + Derived Type in Same File

**What:** Define a Zod schema and immediately derive the TypeScript type from it using `z.infer<>`. Export both. The schema handles runtime, the type handles compile time.

**When to use:** Any time external data enters the system (API responses, form inputs, etc.)

**Example:**
```typescript
// src/types/analysis.ts
// Source: https://zod.dev/basics
import { z } from "zod";

export const ComponentSchema = z.object({
  text: z.string(),
  role: z.string(),
  modifies: z.string().optional(),
  explains: z.string().optional(),
});

export const AnalysisResultSchema = z.object({
  sentence: z.string(),
  sentence_type: z.object({
    category: z.string(),
    summary: z.string(),
  }),
  main_clause: z.object({
    subject: z.string(),
    verb: z.string(),
    complement: z.string().optional(),
  }),
  core_skeleton: z.string(),
  components: z.array(ComponentSchema),
  structure_tree: z.array(z.object({
    label: z.string(),
    children: z.array(z.object({ label: z.string() })).optional(),
  })),
  meaning: z.object({
    literal_cn: z.string(),
    natural_cn: z.string(),
  }),
  key_points: z.array(z.object({ point: z.string() })),
  chunks: z.array(z.object({
    expression: z.string(),
    meaning: z.string(),
    examples: z.array(z.string()),
  })),
  review_summary: z.object({
    look_first: z.string(),
    easy_to_misread: z.string(),
    how_to_parse_next_time: z.string(),
  }),
  quiz: z.array(z.object({
    question: z.string(),
    reference_answer: z.string(),
  })),
});

// Single source of truth: TypeScript type derived from schema
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
```

### Pattern 2: Plain Interfaces for DB Rows

**What:** Use plain TypeScript interfaces (no Zod) for database row types. The DB is a trusted internal data source. Use `as RowType` assertion after `.get()` / `.all()`.

**When to use:** Any query result from better-sqlite3.

**Example:**
```typescript
// src/types/database.ts
export interface SentenceRow {
  id: number;
  text: string;
  analysis_json: string;
  created_at: string;
}

export interface SavedSentenceRow {
  id: number;
  sentence_id: number;
  tags: string | null;
  notes: string | null;
  review_status: string;
  created_at: string;
}

export interface ChunkRow {
  id: number;
  expression: string;
  meaning: string;
  pattern: string | null;
  examples: string | null;          // JSON-serialized string[]
  source_sentence_id: number | null;
  tags: string | null;
  review_status: string;
  created_at: string;
}
```

Usage in server.ts:
```typescript
import { SentenceRow } from "./src/types/index.js";

// Before: db.prepare(...).get(sentence) as any
// After:
const existing = db.prepare('SELECT * FROM sentences WHERE text = ?').get(sentence) as SentenceRow | undefined;
```

### Pattern 3: DB Singleton with :memory: Injection

**What:** Check an environment variable at module initialization time; use `:memory:` path when running tests.

**When to use:** Any singleton DB setup needing test isolation.

**Example:**
```typescript
// src/db/index.ts (modified)
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = process.env.TEST_DB === ":memory:"
  ? ":memory:"
  : path.join(process.cwd(), "data", "app.db");

if (dbPath !== ":memory:") {
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

export const db = new Database(dbPath);

// schema init DDL unchanged below...
```

### Pattern 4: Vitest Node Environment Config

**What:** Standalone `vitest.config.ts` separate from `vite.config.ts` to avoid mixing browser/node plugins.

**When to use:** Phase 1 (node only). Can be merged into vite.config.ts later if needed.

**Example:**
```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

### Pattern 5: Zod Parse at API Boundary

**What:** Replace `JSON.parse(text)` with `AnalysisResultSchema.parse(JSON.parse(text))` at the point where external data enters. Throws on invalid shape — caller handles the error.

**Example:**
```typescript
// src/services/ai.ts (modified)
import { AnalysisResultSchema, AnalysisResult } from "../types/index.js";

export async function analyzeSentence(sentence: string): Promise<AnalysisResult> {
  // ... existing genAI call ...
  const text = response.text;
  if (!text) throw new Error("Failed to generate analysis");
  return AnalysisResultSchema.parse(JSON.parse(text));
}
```

### Anti-Patterns to Avoid

- **`JSON.parse(text) as any`:** Defeats type safety silently. Use Zod parse instead.
- **Separate Zod schemas and manual interfaces for the same shape:** Creates drift. Use `z.infer<>` as the type.
- **Putting `as any` on every DB query:** Now that interfaces exist, use `as SentenceRow` (honest about what the type is).
- **`strict: true` without fixing the errors first:** TypeScript will refuse to compile. Fix or annotate all errors before the phase is done.
- **Using `@ts-ignore` instead of `@ts-expect-error`:** `@ts-ignore` silently does nothing if the error disappears; `@ts-expect-error` fails loudly if the annotation is no longer needed. Always use `@ts-expect-error // TODO(phase-N)`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime type validation | Custom type guards with manual field checks | `zod` `.parse()` | Zod handles nested objects, arrays, optional fields, error messages, and type inference automatically |
| Type derivation from schema | Manual `interface` that mirrors schema | `z.infer<typeof Schema>` | Manual duplication drifts; `z.infer<>` stays in sync by definition |
| Test runner setup | Custom test harness | `vitest` | Native Vite integration; handles ESM, paths, and TypeScript without extra config |
| In-memory DB for tests | Custom SQLite fixture | `new Database(":memory:")` | Built into better-sqlite3; zero setup cost |

**Key insight:** The entire value of Zod is that you define the shape once and get both runtime validation and compile-time types for free. Any manual interface that mirrors a Zod schema is redundant by definition.

---

## Common Pitfalls

### Pitfall 1: Zod Schema Drifting from Actual Gemini Response

**What goes wrong:** The Zod schema is written based on the Google GenAI schema definition, but the actual Gemini API response has slightly different field shapes (e.g., `complement` in `main_clause` is sometimes absent, or `modifies` in components is sometimes null vs. omitted).

**Why it happens:** Structured output from LLMs can deviate from the schema definition in edge cases. The existing `analysisSchema` marks `complement`, `modifies`, and `explains` as not required — their actual presence is unpredictable.

**How to avoid:** Mark all optional fields in Zod with `.optional()`. Test the Zod schema against a captured real API response snapshot before considering this done. The smoke test (validate real Gemini response snapshot) is the validation mechanism.

**Warning signs:** `ZodError: Required at 'main_clause.complement'` during smoke test.

### Pitfall 2: `strict: true` Breaks More Than Expected

**What goes wrong:** Enabling `strict: true` activates `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and several others simultaneously. The `server.ts` file uses `error: any` in catch blocks and `as any` on every DB query. There may be 10-20 errors.

**Why it happens:** The project was started without strict mode; catch blocks with `: any` are common, and DB queries return `unknown` without typing.

**How to avoid:** Run `tsc --noEmit --strict` BEFORE making any other changes to get the full error list. Fix errors systematically: DB queries get `as RowType`, catch blocks become `catch (error) { const msg = error instanceof Error ? error.message : String(error) }` or `catch (error: unknown)`, forward-reference spots get `@ts-expect-error // TODO(phase-2)`.

**Warning signs:** More than 30 TypeScript errors — may indicate a missed pattern that needs a systemic fix.

### Pitfall 3: DB Singleton Already Initialized Before Test Env Var

**What goes wrong:** `src/db/index.ts` runs at module import time. If `TEST_DB` is not set before the first import, the real `app.db` file is created even in test context.

**Why it happens:** Node.js module evaluation is eager; the `new Database(path)` call at module level runs on first import.

**How to avoid:** Check `process.env.TEST_DB` in the db/index.ts module body, before calling `new Database()`. In Vitest, set the env var in `vitest.config.ts` under `test.env`:
```typescript
test: {
  environment: "node",
  env: { TEST_DB: ":memory:" },
}
```

**Warning signs:** A real `data/app.db` file is created when running `vitest run`.

### Pitfall 4: `vitest` Cannot Resolve `@/*` Path Alias

**What goes wrong:** `vitest.config.ts` does not inherit path aliases from `vite.config.ts`. Imports using `@/src/types/...` fail at test runtime.

**Why it happens:** A standalone `vitest.config.ts` does not automatically pick up `resolve.alias` from `vite.config.ts`.

**How to avoid:** Either (a) add `resolve.alias` to `vitest.config.ts`, or (b) use relative imports in test files and source files (safer for Phase 1). Since `src/types/` is new, relative imports are simplest.

**Warning signs:** `Error: Cannot find module '@/src/types/analysis'` in test output.

### Pitfall 5: ESM Import Extensions

**What goes wrong:** The project uses `"type": "module"` in package.json and `"module": "ESNext"` in tsconfig. Imports of local `.ts` files in server-side code require `.js` extensions (e.g., `import { db } from "./src/db/index.js"`).

**Why it happens:** Node.js ESM resolution requires explicit extensions; TypeScript with `allowImportingTsExtensions: true` accepts `.ts` extensions in source but outputs `.js` in runtime.

**How to avoid:** Use `.js` extensions on all relative imports in server-side files. Vitest handles this correctly when `moduleResolution: "bundler"` is set.

**Warning signs:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find module ... (imported as './src/db/index')`.

---

## Code Examples

Verified patterns from official sources:

### Zod Schema + Type in One File

```typescript
// Source: https://zod.dev/basics
import { z } from "zod";

export const AnalysisResultSchema = z.object({ /* fields */ });
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
```

### Vitest Node Config

```typescript
// Source: https://vitest.dev/guide/
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: { TEST_DB: ":memory:" },
  },
});
```

### Smoke Test: Zod Schema Validates Snapshot

```typescript
// src/types/analysis.test.ts
import { describe, it, expect } from "vitest";
import { AnalysisResultSchema } from "./analysis.js";

const REAL_GEMINI_RESPONSE_SNAPSHOT = {
  sentence: "The quick brown fox jumps over the lazy dog.",
  sentence_type: { category: "simple", summary: "A simple declarative sentence." },
  main_clause: { subject: "The quick brown fox", verb: "jumps" },
  core_skeleton: "Fox jumps over dog.",
  components: [{ text: "The quick brown fox", role: "subject" }],
  structure_tree: [{ label: "S", children: [{ label: "NP" }, { label: "VP" }] }],
  meaning: { literal_cn: "这只敏捷的棕色狐狸跳过了那只懒狗。", natural_cn: "敏捷的棕色狐狸跳过了懒狗。" },
  key_points: [{ point: "Main verb is 'jumps'." }],
  chunks: [{ expression: "jump over", meaning: "跳过", examples: ["The athlete jumped over the hurdle."] }],
  review_summary: { look_first: "Main verb", easy_to_misread: "fox vs dog", how_to_parse_next_time: "Find subject first" },
  quiz: [{ question: "What is the subject?", reference_answer: "The quick brown fox" }],
};

describe("AnalysisResultSchema", () => {
  it("validates a Gemini response snapshot without error", () => {
    expect(() => AnalysisResultSchema.parse(REAL_GEMINI_RESPONSE_SNAPSHOT)).not.toThrow();
  });
});
```

### Smoke Test: DB CRUD with In-Memory SQLite

```typescript
// src/db/index.test.ts
import { describe, it, expect } from "vitest";
import { db } from "./index.js";

describe("DB smoke test", () => {
  it("inserts and retrieves a sentence row", () => {
    db.prepare("INSERT INTO sentences (text, analysis_json) VALUES (?, ?)").run(
      "Test sentence",
      JSON.stringify({ sentence: "Test sentence" })
    );
    const row = db.prepare("SELECT text FROM sentences WHERE text = ?").get("Test sentence") as { text: string };
    expect(row.text).toBe("Test sentence");
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `interface` + separate type guard | Zod schema + `z.infer<>` | Zod v3 (2021), v4 performance gains 2025 | Single source of truth for shape and type |
| Jest as default test runner | Vitest for Vite projects | ~2022, mainstream by 2024 | Zero-config with Vite; much faster |
| `strict: false` TypeScript | `"strict": true` as baseline | Established best practice since TS 2.3 | Catches null, undefined, implicit any errors at compile time |

**Deprecated/outdated:**
- `JSON.parse(text) as MyType`: Bypasses runtime validation entirely; replaced by Zod parse
- `as any` on DB query results: Replaced by `as SpecificRowType` with plain interfaces

---

## Open Questions

1. **Zod v3 vs v4**
   - What we know: npm currently ships both; v4 has ~14x string parse speedup; `z.infer<>` works identically in both; v4 has minor API differences (`z.strictObject()`, `z.input`/`z.output`)
   - What's unclear: Whether `zod@^4` is stable enough or whether the project should pin to v3 for now
   - Recommendation: Install `zod@^3` for maximum ecosystem stability (RTL, form libraries all tested against v3); upgrade to v4 in a later phase if performance matters. The planner should decide.

2. **Actual Gemini response shape for optional fields**
   - What we know: The Google GenAI schema marks `complement`, `modifies`, `explains`, `children` as not required
   - What's unclear: Whether the actual API response omits them entirely or sends `null`/`""`
   - Recommendation: Mark all non-required fields as `.optional()` in Zod (not `.nullable()`); if the API returns `null`, add `.nullable()` after seeing real output. The smoke test validates this early.

3. **`@ts-expect-error` count in server.ts**
   - What we know: server.ts has at least 6 `as any` casts and multiple `catch (error: any)` usages
   - What's unclear: Some may be fixable in Phase 1 (DB query returns → `as RowType`), others may depend on Phase 2 types
   - Recommendation: Fix all DB query casts in Phase 1 (they map to DB row interfaces defined here). Use `@ts-expect-error // TODO(phase-2)` only for things that genuinely need Phase 2 types.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (not yet installed — Wave 0 gap) |
| Config file | `vitest.config.ts` — see Wave 0 Gaps |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TYPE-01 | All DB row types are interfaces with no `any` | unit (type-check) | `npx tsc --noEmit` | ❌ Wave 0 |
| TYPE-02 | Zod schema validates real Gemini response | unit | `npx vitest run src/types/analysis.test.ts` | ❌ Wave 0 |
| TYPE-03 | `AnalysisResult` type derived via `z.infer<>` | type-check | `npx tsc --noEmit` | ❌ Wave 0 |
| TYPE-04 | DB queries return typed rows (no `any`) | type-check | `npx tsc --noEmit` | ❌ Wave 0 |
| TYPE-05 | `strict: true` compiles with zero errors | type-check | `npx tsc --noEmit` | ❌ Wave 0 |
| TEST-01 | `vitest run` executes at least one passing smoke test | smoke | `npx vitest run` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (type check only, fast)
- **Per wave merge:** `npx vitest run` (all smoke tests)
- **Phase gate:** Both `npx tsc --noEmit` and `npx vitest run` green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest configuration with `environment: "node"` and `env: { TEST_DB: ":memory:" }`
- [ ] `src/types/analysis.test.ts` — Smoke test for Zod schema against fixture snapshot (covers TYPE-02)
- [ ] `src/db/index.test.ts` — Smoke test for in-memory DB CRUD (covers TEST-01)
- [ ] Framework install: `npm install -D vitest` — Vitest not in package.json
- [ ] Library install: `npm install zod` — Zod not in package.json
- [ ] Library install: `npm install -D @types/better-sqlite3` — needed for typed DB queries (TYPE-04)
- [ ] `package.json` test script: `"test": "vitest run"` — not present

---

## Sources

### Primary (HIGH confidence)

- [Zod official docs — basics](https://zod.dev/basics) — `z.infer<>` pattern, `z.object()`, `.optional()`
- [Zod official docs — API](https://zod.dev/api) — schema methods, `safeParse`, `z.strictObject()`
- [Vitest Getting Started guide](https://vitest.dev/guide/) — installation, config, environment options
- [Vitest config reference](https://vitest.dev/config/) — `environment`, `include`, `env`, `globals`

### Secondary (MEDIUM confidence)

- [Vitest Test Environments — DeepWiki](https://deepwiki.com/vitest-dev/vitest/3.5-test-environments) — `node` vs `jsdom` environment details (verified against official guide)
- [better-sqlite3 GitHub](https://github.com/WiseLibs/better-sqlite3) — `:memory:` database support (standard SQLite feature)

### Tertiary (LOW confidence)

- [DefinitelyTyped discussion on better-sqlite3 generics](https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/69358) — confirms no native generic inference; `as Type` assertion is accepted pattern
- [JavaScript Testing Guide 2026 — calmops](https://calmops.com/programming/javascript/javascript-testing-guide-2026/) — Vitest as standard for Vite projects in 2026

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Zod and Vitest are official, well-documented, and verified via primary sources
- Architecture: HIGH — patterns derived directly from existing codebase analysis + official docs
- Pitfalls: MEDIUM — Pitfalls 1-3 are direct observations from the codebase; Pitfalls 4-5 are verified from community patterns

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries; Zod v4 GA status worth re-checking if install is deferred)
