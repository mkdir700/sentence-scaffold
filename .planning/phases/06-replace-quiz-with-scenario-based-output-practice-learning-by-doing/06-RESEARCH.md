# Phase 6: Replace Quiz with Scenario-Based Output Practice - Research

**Researched:** 2026-03-10
**Domain:** Full-stack feature replacement — Zod schema, Gemini prompt engineering, Express API endpoint, React component
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scenario Design**
- AI generates 1 scenario per sentence analysis, included in the Gemini structured response
- Scenario is described in Chinese (e.g., "你在给同事发邮件，解释为什么项目要延期")
- Scenario is concrete with a clear task, not vague or open-ended
- Scenario is contextually related to the analyzed sentence's content and structures

**Practice Format**
- Each scenario contains 2-3 Chinese sentences for the user to translate into English
- Each Chinese sentence has an explicit hint indicating which chunk/structure to use (e.g., "请用 despite/in spite of")
- Users submit translations one sentence at a time (sequential, not batch)
- Each sentence has its own input field and submit button

**Data Structure**
- Replace the existing `quiz` field entirely with a new `practice` field in the schema
- The `practice` field contains: scenario description (Chinese), and 2-3 translation tasks each with Chinese source text, hint (suggested chunk/structure), and pre-generated reference translation
- Pre-generated reference translations are included in the schema response from Gemini
- Clear the SQLite analysis cache when deploying this change — old quiz-format data will not be compatible
- A new API endpoint is needed for real-time AI feedback (separate Gemini call when user submits each translation)

**Feedback Mechanism**
- After user submits a translation, call Gemini to compare user's answer with the pre-generated reference translation
- Feedback includes: reference translation + brief commentary in Chinese (1-2 sentences, e.g., "结构正确，但 despite 后应接名词短语")
- Reference translation and feedback are only shown after the user submits — no peeking
- One-shot submission per sentence — no rewrite option, user moves to next sentence after viewing feedback
- Feedback language: Chinese (consistent with Phase 5 localization decision)

### Claude's Discretion
- Exact Zod schema field names and nesting for the new `practice` structure
- Gemini prompt engineering for generating contextually relevant scenarios
- Gemini prompt for the feedback/commentary API call
- UI layout and animation details for the practice cards
- Error handling for the feedback API call (timeout, retry)
- How to handle edge cases (very simple sentences with few chunks)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 6 is a focused feature replacement: the existing `quiz` field in the Gemini analysis schema gets replaced with a `practice` field that drives a scenario-based translation exercise. The change touches four layers: Zod schema, Gemini analysis prompt, a new feedback API endpoint, and the Step 6 React component.

The key architectural insight is that this phase follows the same full-stack pattern already established in this codebase: Zod schema as single source of truth → Google GenAI schema mirrors it → Express route/controller/service adds the endpoint → TanStack Query mutation calls it from the frontend. No new libraries are needed; every layer already exists and needs only targeted modification or addition.

The most technically novel part is the feedback endpoint: it makes a Gemini call at user-submit time rather than at analysis time. This is a different data-flow from the current `analyzeSentence` function (which is called once per sentence). The feedback call is lightweight (comparison task, not full analysis), so prompt design should keep it concise and deterministic.

**Primary recommendation:** Treat this as two parallel workstreams — (1) schema + analysis prompt update (replace `quiz` with `practice`) and (2) new feedback endpoint + frontend mutation. The two workstreams can be developed sequentially: schema first (establishes type contract), then backend endpoint, then frontend component.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | ^4.3.6 | Schema definition and runtime validation | Established pattern — single source of truth for types |
| `@google/genai` | ^1.29.0 | Gemini API calls (analysis + feedback) | Existing AI service layer |
| `@tanstack/react-query` | ^5.90.21 | Frontend mutation for feedback API call | Existing pattern for all API mutations |
| `express` | ^4.21.2 | New route/controller for `/api/feedback` | Established three-layer backend pattern |
| `better-sqlite3` | ^12.4.1 | Cache clear — DELETE FROM sentences | Existing DB layer |

### No New Dependencies Required

This phase introduces no new npm packages. All required tools are in place.

---

## Architecture Patterns

### Recommended Project Structure Changes

```
src/
├── types/
│   └── analysis.ts          # MODIFY: replace quiz schema with practice schema
├── components/analysis/
│   ├── StepQuiz.tsx          # REPLACE: rewrite as StepPractice.tsx
│   └── StepPractice.tsx      # NEW: scenario-based practice component
├── hooks/
│   └── mutations.ts          # ADD: useFeedback() mutation
├── lib/
│   └── api.ts                # ADD: api.getFeedback() method
└── pages/
    └── Analysis.tsx          # MODIFY: import StepPractice, pass practice prop

server/
├── routes/
│   └── feedback.ts           # NEW: POST /api/feedback route
├── controllers/
│   └── feedback.ts           # NEW: handleGetFeedback controller
└── services/
    └── feedback.ts           # NEW: getFeedback service (Gemini call)

server.ts                     # ADD: app.use('/api', feedbackRouter)
```

### Pattern 1: Zod Schema Replacement

**What:** Replace the `quiz` array with a nested `practice` object in `AnalysisResultSchema`.
**When to use:** This is the locked decision — no alternatives to research.

Recommended Zod schema shape (Claude's discretion over field names):

```typescript
// src/types/analysis.ts
// Replace quiz: z.array(...) with:
practice: z.object({
  scenario: z.string(),           // Chinese scenario description
  tasks: z.array(z.object({
    cn: z.string(),               // Chinese sentence to translate
    hint: z.string(),             // Which chunk/structure to use (e.g., "请用 despite")
    reference: z.string(),        // Pre-generated English reference translation
  })).min(2).max(3),
}),
```

The `tasks` array enforces 2-3 items with `.min(2).max(3)` — this matches the locked decision and prevents edge cases.

### Pattern 2: Google GenAI Schema Mirror

**What:** The `analysisSchema` in `src/services/ai.ts` uses `@google/genai` `Type.*` constants. It must be updated to mirror the new Zod schema. These two schemas are maintained separately (established pattern from Phase 1).

```typescript
// src/services/ai.ts — inside analysisSchema.properties
// Replace quiz: {...} with:
practice: {
  type: Type.OBJECT,
  properties: {
    scenario: {
      type: Type.STRING,
      description: "用中文描述一个具体场景，让用户在该场景下练习翻译，场景应与被分析句子的内容和结构直接相关",
    },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          cn: {
            type: Type.STRING,
            description: "需要用户翻译成英文的中文句子",
          },
          hint: {
            type: Type.STRING,
            description: "明确提示用户应使用的词块或结构，例如：请用 despite 或 in spite of",
          },
          reference: {
            type: Type.STRING,
            description: "标准参考译文，用英文写，仅在用户提交后展示 (keep in English)",
          },
        },
        required: ["cn", "hint", "reference"],
      },
    },
  },
  required: ["scenario", "tasks"],
},
```

Also update `required` array: replace `"quiz"` with `"practice"`.

### Pattern 3: New Feedback API Endpoint

**What:** A new Express route following the existing three-layer pattern.
**When to use:** Called when user submits each translation.

```
POST /api/feedback
Body: { userTranslation: string, reference: string, hint: string, cn: string }
Response: { commentary: string }
```

The service function calls Gemini with a simple comparison prompt (not structured JSON — free-form Chinese commentary):

```typescript
// server/services/feedback.ts
export async function getFeedback(params: {
  userTranslation: string;
  reference: string;
  hint: string;
  cn: string;
}): Promise<{ commentary: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `用户将以下中文翻译成英文：
中文原句：${params.cn}
提示：${params.hint}
用户译文：${params.userTranslation}
参考译文：${params.reference}

请用1-2句中文点评用户的翻译，指出结构是否正确，必要时说明参考译文与用户译文的关键区别。直接给出点评，不要重复题目内容。`,
  });
  const text = response.text ?? "";
  return { commentary: text.trim() };
}
```

Note: This call does NOT use `responseSchema` (no structured output needed — free-form Chinese text is simpler and more natural for commentary).

### Pattern 4: TanStack Query Mutation for Feedback

**What:** Add `useFeedback` to `mutations.ts`. This follows the established pattern for mutations that don't invalidate any caches (feedback is ephemeral).

```typescript
// src/hooks/mutations.ts — add:
export function useFeedback() {
  return useMutation({
    mutationFn: (params: {
      userTranslation: string;
      reference: string;
      hint: string;
      cn: string;
    }) => api.getFeedback(params),
  });
}
```

No cache invalidation needed — feedback is per-submission state, not server state that other views need.

### Pattern 5: StepPractice Component Structure

**What:** Replaces `StepQuiz.tsx`. Sequential task cards with submit-then-reveal flow.

State model per task card:
- `answer: string` — controlled textarea value
- `submitted: boolean` — toggles between input view and feedback view
- `commentary: string | null` — API response
- Task progression: tracked in parent `StepPractice` as `currentTask: number` (0-indexed)

The "Show All" mode in `Analysis.tsx` skips the sequential gate — all tasks should be visible but still require individual submission. This matches current quiz behavior.

### Anti-Patterns to Avoid

- **Do not batch translate:** User submits one sentence at a time, locked decision. Do not add a "Submit All" button.
- **Do not show reference before submit:** The reference translation must not be visible before `submitted === true`.
- **Do not reuse `StepQuiz.tsx` variable name:** Rename the import in `Analysis.tsx` to `StepPractice` to avoid confusion during transition.
- **Do not skip required array in Gemini schema:** Omitting `required` in the GenAI schema causes Gemini to treat all fields as optional, producing unpredictable partial responses.
- **Do not call feedback API optimistically:** Feedback is stateful per-card. Loading state (`isPending`) must visually block the submit button to prevent double submissions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sequential task progression | Custom state machine | Simple `currentTask: number` state | Overkill; 2-3 tasks, not n tasks |
| Error boundary for feedback | Custom error component | Existing TanStack Query `isError` + inline message | Pattern already established in Analysis.tsx |
| Feedback response parsing | Custom text cleaner | Trust Gemini's free-form text directly | Commentary is always 1-2 sentences, not structured |
| Schema validation on feedback response | Zod schema | Skip — just check `response.text` exists | Feedback endpoint is not cached; validation complexity not justified |

**Key insight:** The feedback endpoint is lightweight by design. Avoid over-engineering it with the same validation rigor as the analysis endpoint. The analysis result is stored in SQLite and must be validated; the feedback commentary is ephemeral and disposable.

---

## Common Pitfalls

### Pitfall 1: Old Cached Quiz Data Breaking the New Schema

**What goes wrong:** The `sentences` table stores `analysis_json` blobs. After deploying the schema change, existing rows have `quiz` instead of `practice`. `AnalysisResultSchema.parse()` will throw on cache hits, crashing the analysis page.

**Why it happens:** SQLite stores JSON as text; no schema enforcement. The Zod parse is the only guard.

**How to avoid:** Clear the `sentences` table before deploying. The CONTEXT.md explicitly calls this out. Add a one-time migration step (DELETE FROM sentences) in the deployment notes or as a Wave 0 task.

**Warning signs:** `ZodError: Required at "practice"` in server logs for existing sentence IDs.

### Pitfall 2: GenAI Schema Missing `required` Fields

**What goes wrong:** Gemini returns partial objects with `reference` missing from some tasks. The Zod parse fails; analysis crashes.

**Why it happens:** `@google/genai` schema `required` array is not automatically derived from `properties`. It must be declared explicitly.

**How to avoid:** Always declare `required: ["cn", "hint", "reference"]` in the `tasks` items schema, and `required: ["scenario", "tasks"]` at the practice level.

**Warning signs:** Zod parse error at `practice.tasks[n].reference` on live API calls.

### Pitfall 3: Double-Submission on Slow Feedback Calls

**What goes wrong:** User clicks submit twice while the Gemini call is in-flight, triggering two feedback API calls for the same task.

**Why it happens:** React re-renders don't block the button unless `disabled` is tied to mutation pending state.

**How to avoid:** Set `disabled={mutation.isPending || submitted}` on the submit button.

**Warning signs:** Two feedback cards appearing, or `commentary` flickering between two values.

### Pitfall 4: Forgetting to Update `server.ts`

**What goes wrong:** New feedback route/controller/service exist, but `app.use('/api', feedbackRouter)` is never added to `server.ts`.

**Why it happens:** The router file alone doesn't activate the endpoint.

**How to avoid:** `server.ts` is the single registration file — it must import and register every router. Make this an explicit task checklist item.

**Warning signs:** `POST /api/feedback` returns 404.

### Pitfall 5: `MOCK_ANALYSIS` in Tests Still Has `quiz`

**What goes wrong:** After replacing the Zod schema, existing test fixtures in `server/services/analysis.test.ts` and `src/types/analysis.test.ts` still contain the `quiz` field. Tests fail at schema validation.

**Why it happens:** Test fixtures are manually maintained snapshots; they don't auto-update with schema changes.

**How to avoid:** Update both MOCK_ANALYSIS fixtures as part of the schema-change task. The `src/types/analysis.test.ts` snapshot is especially important since it directly tests `AnalysisResultSchema.parse()`.

**Warning signs:** `ZodError` in `AnalysisResultSchema` tests after schema change.

---

## Code Examples

### Existing Mutation Pattern to Follow

```typescript
// Source: src/hooks/mutations.ts (current)
export function useSaveChunk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chunk: Parameters<typeof api.saveChunk>[0]) =>
      api.saveChunk(chunk),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.library.chunks(),
      });
    },
  });
}

// useFeedback follows same pattern but with NO invalidateQueries
// (feedback is ephemeral, not server state)
```

### Existing Controller Pattern to Follow

```typescript
// Source: server/controllers/analysis.ts (current handleCheckSentence)
export function handleCheckSentence(req: Request, res: Response): void {
  try {
    const { sentence } = checkSentenceSchema.parse(req.body);
    const result = checkSentence(sentence);
    if (result === null) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.issues[0]?.message ?? "Invalid request" });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}

// handleGetFeedback follows exact same try/catch/ZodError pattern
```

### Existing Animation Pattern (from StepQuiz.tsx)

```typescript
// Source: src/components/analysis/StepQuiz.tsx
<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
  <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wider text-sm mt-12">
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
      6
    </span>
    Output Practice
  </div>
  {/* ... */}
</div>

// After submit, reveal feedback with:
// className="space-y-4 animate-in fade-in"
```

### Zod v4 Record Pattern (established in Phase 2)

```typescript
// From STATE.md: z.record() in Zod v4 requires two args
z.record(z.string(), z.unknown())
// NOT z.record(z.unknown()) — will error
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| quiz (Q&A recall) | practice (output production) | Phase 6 | Active vs passive learning; user generates English, not selects/recalls |
| Single Gemini call per analysis | Analysis call + on-demand feedback call | Phase 6 | Feedback is real-time, not pre-computed commentary |

**Deprecated/outdated:**
- `quiz` field in `AnalysisResultSchema`: Replaced by `practice`. Delete entirely.
- `StepQuiz.tsx`: Replaced by `StepPractice.tsx`. Can be deleted after migration.
- `quiz` field in `analysisSchema` (GenAI): Replace with `practice`.
- `MOCK_ANALYSIS.quiz` in test fixtures: Must be updated to `MOCK_ANALYSIS.practice`.

---

## Open Questions

1. **Gemini model name consistency**
   - What we know: `src/services/ai.ts` uses `"gemini-3.1-pro-preview"` — this appears to be a project-specific or internal model name; the public naming is `gemini-2.0-flash` etc.
   - What's unclear: Whether the feedback service should use the same model name or a lighter model.
   - Recommendation: Use the same `"gemini-3.1-pro-preview"` string for the feedback call to be consistent with the existing service. Do not change model names.

2. **Edge case: sentence with only 1 chunk**
   - What we know: Locked decision says 2-3 tasks; Claude has discretion on how to handle simple sentences with few chunks.
   - What's unclear: Should Gemini still generate 2 tasks, potentially reusing a structure, or generate 1?
   - Recommendation: Keep `.min(2)` on the Zod schema and instruct Gemini in the prompt to generate 2 tasks minimum even for simple sentences, allowing structural variation if chunks are limited. A Gemini failure here produces a Zod error caught in the service, which surfaces as a 500 to the user — acceptable given low frequency.

3. **Cache-clearing mechanism**
   - What we know: SQLite `sentences` table must be cleared; no migration system exists (INFRA-01 is v2).
   - What's unclear: Should this be a manual SQL command, a one-time startup script, or a documented step?
   - Recommendation: Document as a Wave 0 setup step: `node -e "import('./src/db/index.js').then(({db}) => db.exec('DELETE FROM sentences'))"` or equivalent. Keep it simple — no migration framework needed for a single DELETE.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| `AnalysisResultSchema` validates `practice` field, rejects `quiz` field | unit | `npm test -- src/types/analysis.test.ts` | Exists — needs update |
| `MOCK_ANALYSIS` fixture in service tests updated to use `practice` | unit | `npm test -- server/services/` | Exists — needs update |
| `getFeedback` service returns `{ commentary: string }` | unit | `npm test -- server/services/feedback.test.ts` | Wave 0 gap |
| `handleGetFeedback` controller returns 400 on missing fields | unit | `npm test -- server/controllers/feedback.test.ts` | Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `server/services/feedback.test.ts` — covers getFeedback service
- [ ] `server/controllers/feedback.test.ts` — covers handleGetFeedback validation
- [ ] Update `src/types/analysis.test.ts` — replace `quiz` fixture with `practice` fixture
- [ ] Update `server/services/analysis.test.ts` `MOCK_ANALYSIS` — replace `quiz` with `practice`

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection:
  - `src/types/analysis.ts` — current Zod schema, `quiz` field shape
  - `src/services/ai.ts` — current Gemini GenAI schema + `analyzeSentence` function
  - `server/routes/analysis.ts`, `server/controllers/analysis.ts`, `server/services/analysis.ts` — established three-layer backend pattern
  - `src/hooks/mutations.ts`, `src/hooks/queries.ts` — TanStack Query mutation pattern
  - `src/lib/api.ts` — `apiFetch` wrapper and API object pattern
  - `src/components/analysis/StepQuiz.tsx` — component to replace (textarea, animation, Card patterns)
  - `src/pages/Analysis.tsx` — how Step 6 is rendered and props passed
  - `src/db/index.ts` — SQLite schema, no migration system
  - `server.ts` — router registration pattern
  - `vitest.config.ts` — test configuration
  - `server/services/analysis.test.ts` — MOCK_ANALYSIS fixture (has `quiz`, needs update)
  - `src/types/analysis.test.ts` — Zod schema snapshot test (has `quiz`, needs update)
- `.planning/phases/06-.../06-CONTEXT.md` — all locked decisions and discretion areas
- `.planning/STATE.md` — accumulated architectural decisions from Phases 1-5

### Secondary (MEDIUM confidence)

- `@google/genai` `Type.*` constants and `Schema` type: verified by reading existing `src/services/ai.ts` which already uses them correctly

### Tertiary (LOW confidence)

- Gemini prompt effectiveness for scenario generation: untested, requires live API validation after implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all patterns are established in existing codebase
- Architecture: HIGH — follows existing route/controller/service + mutation patterns exactly
- Pitfalls: HIGH — derived from direct code inspection of schema validation flow and component patterns
- Gemini prompt quality: LOW — effectiveness can only be verified with a live API call

**Research date:** 2026-03-10
**Valid until:** 2026-04-09 (stable stack, 30-day window)
