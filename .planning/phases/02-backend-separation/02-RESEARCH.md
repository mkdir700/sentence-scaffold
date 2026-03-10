# Phase 2: Backend Separation - Research

**Researched:** 2026-03-10
**Domain:** Express.js route/controller/service layering, Zod request validation middleware, REST endpoint design
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BEND-01 | Express routes separated into route/controller/service layers | Three-layer pattern: router registers paths, controller handles req/res, service contains pure business logic |
| BEND-02 | Request bodies validated with Zod middleware on all POST endpoints | `z.object().parse(req.body)` in controller or dedicated middleware; 400 on ZodError |
| BEND-03 | `GET /api/analysis/:id` endpoint exists for URL-based analysis retrieval | New route reading `req.params.id`, service queries `sentences` table by primary key |
| BEND-04 | Service layer functions are independently testable (no req/res dependency) | Services accept plain arguments, return typed values; no Express types in service files |
</phase_requirements>

---

## Summary

Phase 2 is a pure structural refactor of the existing `server.ts` monolith. No new business logic is introduced except one new endpoint (`GET /api/analysis/:id`). The current `server.ts` has six route handlers all defined inline in the `startServer()` function, with DB calls and JSON serialization mixed together. The goal is to move those into a three-layer hierarchy: `server/routes/` registers URL paths, `server/controllers/` handles request parsing and response formatting, `server/services/` contains the testable business logic.

The critical Phase 2 constraint (from Phase 1 STATE.md) is that the API contract must be stable before Phase 3 (frontend hooks). That means the new endpoint `GET /api/analysis/:id` and all existing endpoints must be correct and typed before Phase 3 starts. The `src/types/api.ts` file already exists as a placeholder for Phase 2 — it is currently empty (`export {}`) and will receive the request/response contract types in this phase.

Zod v4 is already installed (`"zod": "^4.3.6"` in `package.json`). The Zod middleware approach for BEND-02 integrates directly into controllers using `z.object().parse(req.body)` wrapped in try/catch; a 400 response is sent on `ZodError`. Services receive the already-validated plain data, not `req`.

**Primary recommendation:** Create `server/routes/`, `server/controllers/`, `server/services/` directories under the project root (not under `src/` — server-side code, not shared frontend code). Move the monolithic `server.ts` route handlers into these layers one endpoint group at a time. Add `GET /api/analysis/:id` as the first fully new route. Populate `src/types/api.ts` with typed request/response interfaces.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express | ^4.21.2 (already installed) | HTTP routing and middleware | Already in project; mature, typed |
| zod | ^4.3.6 (already installed) | Request body validation | Already installed from Phase 1; same `z.object().parse()` pattern at API boundary |
| @types/express | ^4.17.21 (already installed) | Express TypeScript types | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.0.18 (already installed) | Service layer unit tests | Already installed; service functions tested without HTTP server |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Controller-in-a-class | Plain functions | Classes add ceremony; plain exported functions are simpler, easier to test, idiomatic for small projects |
| Dedicated middleware file for Zod validation | Inline `req.body` parse in controller | For 6 endpoints, inline is simpler and more explicit; a shared `validateBody(schema)` middleware is useful at 10+ endpoints |

### Installation

No new packages required — all needed libraries are already installed in the project.

---

## Architecture Patterns

### Recommended Project Structure

The `server/` directory lives at the project root alongside `server.ts` (not under `src/` which is the Vite/React frontend). This matches the existing convention where `server.ts` is at root level.

```
server/
├── routes/
│   ├── analysis.ts      # /api/analysis/:id, /api/check-sentence, /api/save-sentence
│   ├── library.ts       # /api/save, /api/saved, /api/history
│   └── chunks.ts        # /api/chunks (GET + POST)
├── controllers/
│   ├── analysis.ts      # req parsing, Zod validation, res formatting for analysis routes
│   ├── library.ts       # req parsing, res formatting for library routes
│   └── chunks.ts        # req parsing, res formatting for chunk routes
└── services/
    ├── analysis.ts      # checkSentence(), saveSentence(), getAnalysisById()
    ├── library.ts       # saveSentenceToLibrary(), getSaved(), getHistory()
    └── chunks.ts        # saveChunk(), getChunks()

src/types/api.ts         # MODIFIED: add request/response contract types (was placeholder)
server.ts                # MODIFIED: import routers instead of defining handlers inline
```

### Pattern 1: Route File

**What:** A route file only registers URL paths and HTTP methods; delegates to controller functions.

**When to use:** Every route group.

**Example:**
```typescript
// server/routes/analysis.ts
import { Router } from "express";
import {
  handleCheckSentence,
  handleSaveSentence,
  handleGetAnalysisById,
} from "../controllers/analysis.js";

const router = Router();

router.post("/check-sentence", handleCheckSentence);
router.post("/save-sentence", handleSaveSentence);
router.get("/analysis/:id", handleGetAnalysisById);

export default router;
```

Server registration in `server.ts`:
```typescript
import analysisRouter from "./server/routes/analysis.js";
import libraryRouter from "./server/routes/library.js";
import chunksRouter from "./server/routes/chunks.js";

app.use("/api", analysisRouter);
app.use("/api", libraryRouter);
app.use("/api", chunksRouter);
```

### Pattern 2: Controller Function

**What:** A controller function handles exactly one endpoint: parses `req`, validates input, calls the service, sends `res`. It contains no business logic.

**When to use:** Every route handler. Controller is the ONLY layer that touches `req` and `res`.

**Example (with Zod validation for BEND-02):**
```typescript
// server/controllers/analysis.ts
import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { checkSentence, getAnalysisById } from "../services/analysis.js";

const CheckSentenceBodySchema = z.object({
  sentence: z.string().min(3, "Sentence must be at least 3 characters"),
});

export function handleCheckSentence(req: Request, res: Response): void {
  try {
    const { sentence } = CheckSentenceBodySchema.parse(req.body);
    const result = checkSentence(sentence);
    if (!result) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function handleGetAnalysisById(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const result = getAnalysisById(id);
    if (!result) {
      res.status(404).json({ error: "Analysis not found" });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
```

### Pattern 3: Service Function (BEND-04 compliant)

**What:** A service function accepts plain typed arguments, returns a typed value, and imports NOTHING from Express. It can be called directly in a Vitest test without an HTTP server.

**When to use:** All business logic that touches the database or other I/O.

**Example:**
```typescript
// server/services/analysis.ts
import { db } from "../../src/db/index.js";
import { type SentenceRow } from "../../src/types/index.js";
import { type AnalysisResult } from "../../src/types/index.js";

export function checkSentence(sentence: string): AnalysisResult | null {
  const existing = db
    .prepare("SELECT * FROM sentences WHERE text = ?")
    .get(sentence) as SentenceRow | undefined;
  if (!existing) return null;
  return JSON.parse(existing.analysis_json) as AnalysisResult;
}

export function getAnalysisById(id: number): AnalysisResult | null {
  const row = db
    .prepare("SELECT * FROM sentences WHERE id = ?")
    .get(id) as SentenceRow | undefined;
  if (!row) return null;
  return JSON.parse(row.analysis_json) as AnalysisResult;
}

export function saveSentence(sentence: string, analysis: AnalysisResult): void {
  db.prepare("INSERT INTO sentences (text, analysis_json) VALUES (?, ?)").run(
    sentence,
    JSON.stringify(analysis)
  );
}
```

### Pattern 4: API Contract Types in `src/types/api.ts`

**What:** Define request body shapes and response contract types in the shared `src/types/api.ts` file. Both frontend and backend can import from this.

**When to use:** Any typed API boundary.

**Example:**
```typescript
// src/types/api.ts
import { type AnalysisResult } from "./analysis.js";

// Request bodies
export interface CheckSentenceRequest {
  sentence: string;
}

export interface SaveSentenceRequest {
  sentence: string;
  analysis: AnalysisResult;
}

// Response types
export interface AnalysisResponse extends AnalysisResult {}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}
```

### Anti-Patterns to Avoid

- **Business logic in route handlers:** Any `db.prepare()` call in a route file or controller is wrong. DB access lives exclusively in services.
- **`req` or `res` in service functions:** Importing `Request`/`Response` from Express in a service file is the failure mode BEND-04 is designed to prevent. Services must be plain-function testable.
- **Skipping Zod on `GET` params:** `req.params.id` is always a string; `parseInt` + NaN check is the correct guard, not Zod (Zod is overkill for a single URL param).
- **Catching `ZodError` in the service layer:** Zod validation belongs in the controller layer only. Services receive already-validated data.
- **Returning `void` from route handlers in Express 4 without `return`:** In Express 4, forgetting `return` after `res.json()` causes "Cannot set headers after they are sent." Always `return` after every response.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request body validation | Custom `if (!body.sentence \|\| body.sentence.length < 3)` chains | `z.object({ sentence: z.string().min(3) }).parse(req.body)` | Zod produces typed results, composable schemas, and structured errors automatically |
| Error message formatting | Custom error serializers | Catch `ZodError` and use `error.errors[0].message` | ZodError already produces human-readable messages |
| Express router grouping | Custom middleware chains | `express.Router()` | Router is the built-in Express mechanism; no library needed |

**Key insight:** The service layer's ONLY job is isolation from Express. Keep it dumb and pure: plain inputs → plain outputs. Controllers own all HTTP concerns.

---

## Common Pitfalls

### Pitfall 1: `return res.json()` vs. `res.json()` in Express 4

**What goes wrong:** A controller function calls `res.status(404).json(...)` and then falls through to call `res.json(result)` on the next line because the `return` was omitted.

**Why it happens:** `res.json()` does not terminate the function; it just writes to the socket. Without `return`, both responses are attempted.

**How to avoid:** Every `res.json()` or `res.status(N).json()` in a controller MUST be preceded by `return`. Pattern: `return res.json(...)`.

**Warning signs:** `Error: Cannot set headers after they are sent to the client` in server logs.

### Pitfall 2: ESM Import Path Extensions Required

**What goes wrong:** `import { checkSentence } from "../services/analysis"` fails at runtime because the project uses `"type": "module"` in `package.json`.

**Why it happens:** Node.js ESM requires explicit file extensions. TypeScript with `moduleResolution: "bundler"` lets you omit them in source, but `tsx` (the dev runner) still resolves from Node.js ESM rules at runtime.

**How to avoid:** All relative imports must end in `.js` (e.g., `"../services/analysis.js"`). This is already the pattern in `server.ts` (`import { db } from './src/db/index.js'`).

**Warning signs:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...' (imported as '../services/analysis')`.

### Pitfall 3: `server/` Imports Cannot Use `@/*` Path Alias

**What goes wrong:** `import { SentenceRow } from "@/src/types/index.js"` fails in files under `server/` because the `@/*` alias is processed by Vite (for the frontend) but not by `tsx` when running the server.

**Why it happens:** `tsconfig.json` defines `"@/*": ["./*"]` but `tsx` does not apply tsconfig path mappings by default the same way Vite does.

**How to avoid:** Use relative imports from `server/` files to `src/` (e.g., `"../../src/db/index.js"`). The existing `server.ts` already uses relative imports, not `@/*` aliases.

**Warning signs:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '@/src/types/index.js'`.

### Pitfall 4: `parseInt` on `req.params.id` Without NaN Check

**What goes wrong:** `parseInt("abc", 10)` returns `NaN`. Passing `NaN` to `db.prepare("... WHERE id = ?").get(NaN)` either throws or returns `undefined` silently, depending on the driver version.

**Why it happens:** `req.params` values are always strings; URL params are not type-safe.

**How to avoid:** After `parseInt`, check `if (isNaN(id))` and return 400 immediately. Never pass `NaN` to SQLite.

**Warning signs:** `GET /api/analysis/abc` returns a 500 instead of a 400.

### Pitfall 5: Vitest `include` Pattern Doesn't Cover `server/` Directory

**What goes wrong:** Service tests in `server/services/analysis.test.ts` are not discovered by Vitest because `vitest.config.ts` currently includes only `src/**/*.test.ts`.

**Why it happens:** The include glob was set in Phase 1 for `src/` only.

**How to avoid:** Update `vitest.config.ts` `include` to `["src/**/*.test.ts", "server/**/*.test.ts"]` as part of Wave 0 before writing service tests.

**Warning signs:** `vitest run` outputs "No test files found" for service tests, or runs but silently skips `server/services/*.test.ts`.

---

## Code Examples

### GET /api/analysis/:id — Full Stack Example

```typescript
// server/services/analysis.ts
import { db } from "../../src/db/index.js";
import { type SentenceRow, type AnalysisResult } from "../../src/types/index.js";

export function getAnalysisById(id: number): AnalysisResult | null {
  const row = db
    .prepare("SELECT * FROM sentences WHERE id = ?")
    .get(id) as SentenceRow | undefined;
  if (!row) return null;
  return JSON.parse(row.analysis_json) as AnalysisResult;
}
```

```typescript
// server/controllers/analysis.ts (GET /api/analysis/:id handler)
export function handleGetAnalysisById(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "id must be a number" });
    return;
  }
  const result = getAnalysisById(id);
  if (!result) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }
  res.json(result);
}
```

### Zod 400 Validation Pattern (BEND-02)

```typescript
// In any POST controller
import { z, ZodError } from "zod";

const BodySchema = z.object({
  sentence: z.string().min(3, "Sentence must be at least 3 characters"),
});

export function handleCheckSentence(req: Request, res: Response): void {
  try {
    const { sentence } = BodySchema.parse(req.body);
    // ... call service ...
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
```

### Service Unit Test (No HTTP Server)

```typescript
// server/services/analysis.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/index.js";
import { getAnalysisById, checkSentence } from "./analysis.js";

const MOCK_ANALYSIS = {
  sentence: "Test sentence.",
  sentence_type: { category: "simple", summary: "Test." },
  main_clause: { subject: "Test", verb: "is" },
  core_skeleton: "Test is.",
  components: [],
  structure_tree: [],
  meaning: { literal_cn: "测试句。", natural_cn: "测试。" },
  key_points: [],
  chunks: [],
  review_summary: { look_first: "verb", easy_to_misread: "none", how_to_parse_next_time: "find verb" },
  quiz: [],
};

describe("analysis service", () => {
  beforeEach(() => {
    db.exec("DELETE FROM sentences");
  });

  it("getAnalysisById returns null for unknown id", () => {
    expect(getAnalysisById(9999)).toBeNull();
  });

  it("getAnalysisById returns analysis for known id", () => {
    const result = db
      .prepare("INSERT INTO sentences (text, analysis_json) VALUES (?, ?)")
      .run("Test sentence.", JSON.stringify(MOCK_ANALYSIS));
    const analysis = getAnalysisById(result.lastInsertRowid as number);
    expect(analysis?.sentence).toBe("Test sentence.");
  });

  it("checkSentence returns null when sentence not in DB", () => {
    expect(checkSentence("nonexistent")).toBeNull();
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic route file | Route/Controller/Service separation | Standard pattern since Express 4.x | Services are independently testable; controllers are thin |
| Manual `if (!body.field)` validation | Zod middleware/inline parse | Zod adoption ~2021+ | Typed, composable, error-message-generating validation |
| `express.Router()` per file | Same — Router per file | Unchanged since Express 4.0 | `Router()` is the canonical Express modularization mechanism |

**Deprecated/outdated:**
- `express.Router({ mergeParams: true })`: Only needed when child routers need parent route params — not needed here since all routes are flat under `/api`.
- Express 5 `asyncHandler` auto-error propagation: Project uses Express 4. In Express 4, async route handlers MUST catch errors manually; uncaught promise rejections from async handlers do NOT go to Express error handlers automatically.

---

## Open Questions

1. **Min/max sentence length for BEND-02**
   - What we know: The success criterion says "missing or too-short sentence body returns a 400"; BEND-02 says "validated with Zod middleware"
   - What's unclear: What is the exact minimum character count? The existing handler just checks `if (!sentence)` (truthiness only)
   - Recommendation: Use `z.string().min(3)` as a reasonable lower bound; the planner should pick an exact value. The UX requirement UX-03 (backend validates sentence input length) is scoped to Phase 4, but the basic min-length check can be set now with a TODO comment if the exact value is uncertain.

2. **Where exactly does `analyzeSentence()` (AI call) live?**
   - What we know: `analyzeSentence()` currently lives in `src/services/ai.ts`; it is NOT in `server.ts` at all — the current monolith does NOT call the AI directly, it only reads from the DB
   - What's unclear: Phase 2 only splits `server.ts` routes; `ai.ts` is out of scope unless a controller needs to call it
   - Recommendation: Leave `src/services/ai.ts` untouched in Phase 2. The refactor only moves the six existing route handlers. Any future endpoint that calls `analyzeSentence()` is a Phase 3+ concern.

3. **Should `server/services/` re-export via a barrel?**
   - What we know: `src/types/` uses a barrel `index.ts`; services are currently scattered across one file
   - What's unclear: Whether a `server/services/index.ts` barrel adds value or just indirection
   - Recommendation: Skip the barrel for services — controllers import directly from specific service files (e.g., `"../services/analysis.js"`). Barrel is only worth it when the consumer count exceeds ~5 files importing from the same directory.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 (already installed) |
| Config file | `vitest.config.ts` (exists — needs `include` updated) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BEND-01 | Routes register paths; controllers handle req/res; services have no req/res imports | type-check + unit | `npx tsc --noEmit` + `npx vitest run server/` | ❌ Wave 0 |
| BEND-02 | POST with missing/short body returns 400 with message | unit (service layer) | `npx vitest run server/services/` | ❌ Wave 0 |
| BEND-03 | `GET /api/analysis/:id` returns cached analysis | unit (service layer) | `npx vitest run server/services/analysis.test.ts` | ❌ Wave 0 |
| BEND-04 | Service functions callable without HTTP server | unit (direct call) | `npx vitest run server/services/` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (type check; fast)
- **Per wave merge:** `npx vitest run` (all tests including new service tests)
- **Phase gate:** Both `npx tsc --noEmit` and `npx vitest run` green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Update `include` to add `"server/**/*.test.ts"` alongside existing `"src/**/*.test.ts"`
- [ ] `server/services/analysis.test.ts` — Unit tests for `checkSentence()`, `getAnalysisById()`, `saveSentence()` (covers BEND-03, BEND-04)
- [ ] `server/services/library.test.ts` — Unit tests for library service functions (covers BEND-04)
- [ ] `server/services/chunks.test.ts` — Unit tests for chunks service functions (covers BEND-04)
- [ ] Create `server/routes/`, `server/controllers/`, `server/services/` directories (empty placeholders)

---

## Sources

### Primary (HIGH confidence)

- Express.js official docs (https://expressjs.com/en/guide/routing.html) — Router, route parameter handling, `express.Router()`
- Express.js 4.x API reference (https://expressjs.com/en/4x/api.html) — `Request`, `Response` types, `req.params`, `req.body`
- Zod v4 official docs (https://zod.dev/) — `z.object().parse()`, `ZodError`, `z.string().min()`

### Secondary (MEDIUM confidence)

- Codebase inspection of `server.ts` — six existing route handlers documented directly from source; no inference needed
- `package.json` inspection — confirmed all required libraries already installed; no new deps needed
- `src/types/api.ts` inspection — confirmed empty placeholder; Phase 2 will populate it

### Tertiary (LOW confidence)

- N/A — all claims verified from codebase inspection or official Express/Zod docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; no new deps to evaluate
- Architecture: HIGH — three-layer Express pattern is well-established; verified against existing codebase conventions (ESM imports, tsx runner, relative paths)
- Pitfalls: HIGH for ESM/import issues (observed pattern in existing code); HIGH for `return res.json()` (documented Express 4 behavior); MEDIUM for Vitest include gap (inferred from config inspection)

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (Express 4 and Zod v4 are stable; no fast-moving surface area in this phase)
