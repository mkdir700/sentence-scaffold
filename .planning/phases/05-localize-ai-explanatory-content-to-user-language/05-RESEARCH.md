# Phase 5: Localize AI Explanatory Content to User Language - Research

**Researched:** 2026-03-10
**Domain:** Gemini API prompt engineering — multilingual structured output
**Confidence:** HIGH

## Summary

The app analyzes English sentences for Chinese-speaking learners. Currently `src/services/ai.ts` sends a single English system instruction to Gemini, and the model returns all explanatory text fields in English. Because users are learning English (not already fluent), they cannot understand the English explanations — defeating the product's purpose.

The fix is entirely prompt-side: no schema changes, no new libraries, no database migrations. The `AnalysisResult` schema already has `meaning.literal_cn` and `meaning.natural_cn` correctly in Chinese, which proves the model respects per-field language instructions. The remaining 10+ explanatory fields need the same treatment: their `description` attributes in `analysisSchema` (the GenAI `Schema` object in `ai.ts`) should explicitly instruct the model to write that field's value in Chinese.

Additionally, the system instruction in `analyzeSentence()` must be updated to reinforce the bilingual constraint: keep English source material in English, write all explanations/descriptions/tips in Chinese.

**Primary recommendation:** Update `src/services/ai.ts` — add Chinese-language instructions to each explanatory field's `description` property in the GenAI schema, and rewrite the `systemInstruction` string to explicitly declare the bilingual output contract.

---

## Standard Stack

### Core (already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google/genai` | ^1.29.0 | Gemini API client | Already installed; `analysisSchema` and `systemInstruction` live here |

### No New Dependencies

This phase requires zero new packages. The entire change is prompt text within `src/services/ai.ts`.

---

## Architecture Patterns

### Which Fields to Localize

The `AnalysisResult` schema has two categories of string fields:

**Must stay English** — these ARE the English content being studied:
- `sentence` — the input sentence
- `main_clause.subject`, `main_clause.verb`, `main_clause.complement` — quoted words from the sentence
- `core_skeleton` — minimal English structural skeleton (e.g., "fox jumps")
- `components[].text` — exact English span from the sentence
- `structure_tree[].label` — grammatical notation labels (e.g., "NP", "VP", "S") — these are universal grammar symbols
- `chunks[].expression` — the English expression/phrase being catalogued
- `chunks[].examples[]` — English example sentences

**Must be in Chinese** — these are explanations for the learner:
- `sentence_type.category` — grammatical category label (e.g., "simple" → "简单句"); could go either way, but Chinese is more useful
- `sentence_type.summary` — structural description for the learner
- `components[].role` — grammatical role label (e.g., "adverbial clause" → "状语从句")
- `components[].modifies` — explanation of what this component modifies
- `components[].explains` — free-text explanation of the component
- `meaning.literal_cn` — already Chinese (confirmed working)
- `meaning.natural_cn` — already Chinese (confirmed working)
- `key_points[].point` — learning tips/insights
- `chunks[].meaning` — the meaning of the English expression
- `review_summary.look_first` — advice on parsing strategy
- `review_summary.easy_to_misread` — common misreading warning
- `review_summary.how_to_parse_next_time` — parsing guidance
- `quiz[].question` — comprehension question
- `quiz[].reference_answer` — model answer

### Pattern: Per-Field `description` as Language Instruction

The `description` property on each field in `analysisSchema` serves as a per-field prompt to the model. The model reads the description to understand what content to put in that field.

**Current pattern (English description, English output):**
```typescript
// Source: src/services/ai.ts (existing code)
sentence_type: {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Brief summary of the sentence structure",
    },
  },
},
```

**Target pattern (Chinese instruction in description, Chinese output):**
```typescript
sentence_type: {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description: "句子类型，用中文写，例如：简单句、复合句、复杂句",
    },
    summary: {
      type: Type.STRING,
      description: "对句子结构的简要中文说明，面向正在学英语的中文读者",
    },
  },
},
```

### Pattern: System Instruction Reinforcement

The `systemInstruction` string in `analyzeSentence()` must declare the bilingual contract explicitly. This serves as a global constraint that all per-field descriptions reinforce.

**Target system instruction:**
```typescript
systemInstruction: `You are an expert English teacher helping Chinese learners understand complex English sentence structures.

LANGUAGE RULES (strictly follow):
- All explanatory content (descriptions, explanations, tips, questions, answers, summaries) MUST be written in Simplified Chinese (简体中文).
- All English source material MUST stay in English: the original sentence, quoted words/phrases, code skeletons, grammar notation labels (NP, VP, S, etc.), and example English sentences in chunks.
- Do NOT mix languages within a single field value.

ANALYSIS APPROACH:
Always prioritize structure over simple translation. Identify the main skeleton first, then explain what each modifier attaches to. Provide literal translations that map to the structure, followed by natural translations.`,
```

### Anti-Patterns to Avoid

- **Changing Zod schema**: The Zod `AnalysisResultSchema` in `src/types/analysis.ts` does NOT need any changes. All fields are `z.string()` — they accept Chinese text just fine. Do not add separate `_cn` variants.
- **Post-processing translation**: Do NOT add a second Gemini call to translate output after generation. This doubles API cost, adds latency, and introduces desync risk between cached English results and translated content.
- **Database migration**: Do NOT add a `language` column or create a separate `analysis_json_cn` column. Existing cached analyses will simply be English; new analyses after the prompt change will be Chinese. The app is single-user; cache invalidation is acceptable via database reset or leaving old records as-is.
- **Frontend i18n libraries**: Do NOT add react-i18next or similar. The UI chrome labels ("Core Skeleton", "Modifiers & Components", etc.) are fixed UI text — they can be updated directly in the TSX files as a separate concern. This phase is about the AI-generated content only.
- **Partial per-language flag in API**: Gemini does not have a native "respond in language X" parameter — it is entirely prompt-driven.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Per-field language control | Custom post-processing translation service | `description` field in GenAI schema (already supported) |
| Language enforcement | Runtime Chinese character detection + retry loop | Correct system instruction + per-field descriptions |
| Cache invalidation for old English results | Migration script | Accept that pre-Phase-5 cached results stay English; new analyses will be Chinese |

**Key insight:** The Gemini structured output `description` property is the standard per-field prompt mechanism. It already works (proven by `literal_cn` / `natural_cn` fields returning Chinese). This is purely a prompt text edit — no infrastructure needed.

---

## Common Pitfalls

### Pitfall 1: Updating Only the System Instruction
**What goes wrong:** If you only update `systemInstruction` without updating field `description` properties, the model may partially comply — some fields in Chinese, some still in English. The description provides the most proximate signal for each field.
**How to avoid:** Update BOTH `systemInstruction` AND every explanatory field's `description` property.
**Warning signs:** `sentence_type.category` still returns "simple" instead of "简单句".

### Pitfall 2: Over-specifying English Fields
**What goes wrong:** If you add a Chinese-language description to `chunks[].expression` (e.g., "用中文写出表达式"), the model will put Chinese text in an English-expression field.
**How to avoid:** Fields that ARE the English content must have English descriptions explicitly saying "keep in English" or simply describe what the English content should be.
**Example fix:**
```typescript
chunks: {
  items: {
    properties: {
      expression: {
        type: Type.STRING,
        description: "The English expression or phrase (keep in English)",
      },
      meaning: {
        type: Type.STRING,
        description: "该表达式的中文含义解释",
      },
    },
  },
},
```

### Pitfall 3: Cached Old Analyses Showing English
**What goes wrong:** `checkSentence()` returns cached DB results. If a sentence was analyzed before Phase 5, it returns English explanations even after the prompt change.
**Why it happens:** The DB stores raw `analysis_json` with no language metadata. Cache hit bypasses the AI call entirely.
**How to avoid:** This is acceptable for a single-user app. Document this behavior. Optionally add a note in REQUIREMENTS/UI that re-analysis clears the cache. Do NOT attempt to retroactively translate cached JSON — that adds complexity with minimal value.

### Pitfall 4: `sentence_type.category` Ambiguity
**What goes wrong:** Category could be "simple" (English) or "简单句" (Chinese). Some component code might pattern-match on English values.
**How to avoid:** Check all components for any `if (category === "simple")` style conditionals. In the current codebase, `StepSkeleton.tsx` renders `{sentence_type.category}` as a Badge — no conditional logic found. Safe to localize.

### Pitfall 5: Test Fixtures Use English Strings
**What goes wrong:** `MOCK_ANALYSIS` in `server/services/analysis.test.ts` has English strings in explanatory fields (e.g., `summary: "A simple declarative sentence."`). Tests will still pass since Zod accepts any string, but the mock no longer reflects realistic data.
**How to avoid:** Update mock fixture to use Chinese strings for explanatory fields. This is cosmetic but improves test readability and catches any accidental type constraints.

---

## Code Examples

### Updated `analyzeSentence` in `src/services/ai.ts`

The full system instruction target:
```typescript
// Source: Gemini API system instruction pattern (per-field descriptions as language hints)
config: {
  responseMimeType: "application/json",
  responseSchema: analysisSchema,
  systemInstruction: `You are an expert English teacher helping Chinese learners understand complex English sentence structures.

LANGUAGE RULES — follow strictly:
- Write ALL explanatory content in Simplified Chinese (简体中文): descriptions, summaries, role labels, explanations, tips, questions, answers, meanings.
- Keep ALL English source material in English: the original sentence, quoted words, core skeleton, grammar notation (NP, VP, S), and example sentences in chunks.
- Never mix languages within a single field value.

ANALYSIS APPROACH:
Identify the main skeleton first, then explain what each modifier attaches to in Chinese. Provide a literal Chinese translation that mirrors the English structure, then a natural Chinese translation.`,
},
```

### Schema `description` Fields — Chinese-Targeted Fields

```typescript
// Key examples for per-field description update
sentence_type: {
  properties: {
    category: {
      description: "句子类型，用中文，例如：简单句、复合句、复杂句、复合复杂句",
    },
    summary: {
      description: "用中文简要描述该句子的结构特点，面向正在学英语的中文读者",
    },
  },
},
components: {
  items: {
    properties: {
      text: { description: "The exact English text span from the sentence (keep in English)" },
      role: { description: "该成分的语法角色，用中文，例如：主语、谓语、状语从句、定语" },
      modifies: { description: "该成分修饰的对象，用中文说明" },
      explains: { description: "对该成分的详细中文解释" },
    },
  },
},
key_points: {
  items: {
    properties: {
      point: { description: "一条学习要点或语法提示，用中文写" },
    },
  },
},
chunks: {
  items: {
    properties: {
      expression: { description: "The English expression or phrase (keep in English)" },
      meaning: { description: "该英文表达的中文含义" },
      examples: { description: "English example sentences using this expression (keep in English)" },
    },
  },
},
review_summary: {
  properties: {
    look_first: { description: "解读这类句子时第一眼应该找什么，用中文写" },
    easy_to_misread: { description: "这个句子容易被误读的地方，用中文写" },
    how_to_parse_next_time: { description: "下次遇到类似句子的解析策略，用中文写" },
  },
},
quiz: {
  items: {
    properties: {
      question: { description: "关于句子结构的测试题，用中文写" },
      reference_answer: { description: "参考答案，用中文写" },
    },
  },
},
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prompt-only language hints | Per-field `description` + system instruction | Available since Gemini 1.5 | High reliability for per-field bilingual control |
| Separate translation call | In-prompt language constraint | — | Zero extra API cost |

**Deprecated/outdated:**
- Post-generation translation (second API call): adds cost, latency, and desync; not needed.
- Runtime language detection + retry: fragile, slow; field descriptions are sufficient.

---

## Open Questions

1. **`sentence_type.category` format in Chinese**
   - What we know: Currently returns English values like "simple", "compound", "complex"
   - What's unclear: Should it be "简单句" or "简单" or "Simple (简单句)"? The Badge in `StepSkeleton.tsx` renders it directly.
   - Recommendation: Use "简单句" / "复合句" / "复杂句" — pure Chinese, matches the target audience.

2. **Handling pre-existing English cached results**
   - What we know: `checkSentence()` returns DB-cached results without re-calling AI
   - What's unclear: Should the plan include a one-time DB wipe or migration?
   - Recommendation: Document the behavior. For a single-user dev app, wipe `data/app.db` once after Phase 5 deploys. Do NOT add migration complexity to this phase.

3. **`structure_tree[].label` localization**
   - What we know: Currently renders grammar labels like "S", "NP", "VP", "Main Clause", "Subject Noun Phrase"
   - What's unclear: Universal grammar symbols (S, NP, VP) are used in Chinese linguistics too. Full Chinese labels ("主语名词短语") are more readable but break with standard notation.
   - Recommendation: Use Chinese for full labels (e.g., "主语名词短语") but keep standard symbols (S, NP, VP) where applicable. Add a description: "语法结构标签，可使用通用语法符号（如NP、VP），完整标签用中文".

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (already configured) |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| (no formal req IDs) | `analyzeSentence()` prompt produces Chinese explanatory fields | unit (mock) | `npm test -- server/services/analysis.test.ts` | ✅ (needs fixture update) |
| (no formal req IDs) | Zod schema still validates Chinese-string analysis results | unit | `npm test -- src/types/analysis.test.ts` | ❌ Wave 0 |
| (no formal req IDs) | English fields (expression, examples, text, skeleton) stay English | unit (mock) | `npm test -- server/services/analysis.test.ts` | ✅ (needs fixture update) |

**Note:** Because this phase only modifies prompt text (not code logic), the key validation is:
1. Updating `MOCK_ANALYSIS` fixture in `analysis.test.ts` to use Chinese strings in explanatory fields
2. A manual smoke test: run a live Gemini call and inspect the returned JSON

### Sampling Rate
- **Per task commit:** `npm test -- server/services/analysis.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Update `MOCK_ANALYSIS` in `server/services/analysis.test.ts` — change explanatory fields to Chinese strings (e.g., `summary: "简单陈述句，主谓宾结构"`, `role: "主语"`)
- [ ] Live smoke test (manual): call `analyzeSentence("The cat sat on the mat.")` against real Gemini API; verify Chinese text in `sentence_type.summary`, `components[].role`, `key_points[].point`, etc.

---

## Sources

### Primary (HIGH confidence)
- Official Gemini structured output docs: https://ai.google.dev/gemini-api/docs/structured-output — confirmed `description` field in schema properties acts as per-field prompt hint
- Direct inspection of `src/services/ai.ts` — existing `literal_cn` / `natural_cn` fields with Chinese descriptions already work, proving the mechanism
- Direct inspection of `src/types/analysis.ts` — Zod schema uses `z.string()` throughout; no type changes needed

### Secondary (MEDIUM confidence)
- WebSearch: Gemini API `description` field in JSON Schema acts as per-field language instruction — verified against official structured output docs pattern
- Gemini prompt design strategies: https://ai.google.dev/gemini-api/docs/prompting-strategies — system instruction + field descriptions combination

### Tertiary (LOW confidence)
- Community reports of Gemini language "bleed" issues when system instruction alone is used — suggests per-field descriptions are important alongside global system instruction; not verified against official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; change is entirely within existing `ai.ts`
- Architecture: HIGH — per-field `description` mechanism confirmed working (existing `literal_cn`/`natural_cn` fields prove it)
- Pitfalls: MEDIUM — pitfall #3 (cached results) and #4 (category conditional) verified by code inspection; pitfall re: language bleed is LOW (community reports only)

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (Gemini API prompt behavior is stable; schema support for descriptions is well-established)
