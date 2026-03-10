# Phase 6: Replace Quiz with Scenario-Based Output Practice - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current Step 6 quiz (rigid Q&A cards) with a scenario-based output practice. Users are given a concrete scenario in Chinese, then translate 2-3 Chinese sentences into English using the chunks and structures learned from the current sentence analysis. AI provides real-time feedback (reference translation + brief commentary) after each submission. The goal is "learning by doing" — active output practice instead of passive recall.

</domain>

<decisions>
## Implementation Decisions

### Scenario Design
- AI generates 1 scenario per sentence analysis, included in the Gemini structured response
- Scenario is described in Chinese (e.g., "你在给同事发邮件，解释为什么项目要延期")
- Scenario is concrete with a clear task, not vague or open-ended
- Scenario is contextually related to the analyzed sentence's content and structures

### Practice Format
- Each scenario contains 2-3 Chinese sentences for the user to translate into English
- Each Chinese sentence has an explicit hint indicating which chunk/structure to use (e.g., "请用 despite/in spite of")
- Users submit translations one sentence at a time (sequential, not batch)
- Each sentence has its own input field and submit button

### Data Structure
- **Replace** the existing `quiz` field entirely with a new `practice` field in the schema
- The `practice` field contains: scenario description (Chinese), and 2-3 translation tasks each with Chinese source text, hint (suggested chunk/structure), and pre-generated reference translation
- Pre-generated reference translations are included in the schema response from Gemini
- **Clear the SQLite analysis cache** when deploying this change — old quiz-format data will not be compatible
- A new API endpoint is needed for real-time AI feedback (separate Gemini call when user submits each translation)

### Feedback Mechanism
- After user submits a translation, call Gemini to compare user's answer with the pre-generated reference translation
- Feedback includes: reference translation + brief commentary in Chinese (1-2 sentences, e.g., "结构正确，但 despite 后应接名词短语")
- Reference translation and feedback are only shown **after** the user submits — no peeking
- One-shot submission per sentence — no rewrite option, user moves to next sentence after viewing feedback
- Feedback language: Chinese (consistent with Phase 5 localization decision)

### Claude's Discretion
- Exact Zod schema field names and nesting for the new `practice` structure
- Gemini prompt engineering for generating contextually relevant scenarios
- Gemini prompt for the feedback/commentary API call
- UI layout and animation details for the practice cards
- Error handling for the feedback API call (timeout, retry)
- How to handle edge cases (very simple sentences with few chunks)

</decisions>

<specifics>
## Specific Ideas

- User's preview example: "🎬 场景：你在给同事发邮件，解释为什么项目要延期。✒️ 任务：用 'despite' 或 'in spite of' 写一句说明延期原因"
- The core philosophy is "干中学" (learning by doing) — users should feel like they're practicing real communication, not answering textbook questions
- Each translation task targets a specific chunk or structure from the analysis, making the practice directly tied to what was just learned

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StepQuiz.tsx`: Current Step 6 component — will be replaced/rewritten as the new practice component
- `Card`, `CardContent`, `Button`: UI primitives used in current quiz cards — reuse for practice cards
- `textarea` pattern in QuizCard: Existing input pattern with styling — adapt for translation input
- TanStack Query mutations: Established pattern for API calls with loading/error states

### Established Patterns
- Step components are purely presentational — props from Analysis.tsx, no data fetching inside steps
- Zod schema in `src/types/analysis.ts` is single source of truth for types
- AI prompt in `src/services/ai.ts` with structured JSON schema output
- Chinese explanatory content, English source material (Phase 5 bilingual contract)
- `animate-in fade-in slide-in-from-bottom-4` animation pattern on step components

### Integration Points
- `src/types/analysis.ts`: Replace `quiz` schema with new `practice` schema
- `src/services/ai.ts`: Update Gemini prompt and schema for practice generation
- `src/components/analysis/StepQuiz.tsx`: Rewrite as StepPractice.tsx (or rename)
- `src/pages/Analysis.tsx`: Update Step 6 to render new practice component
- New API endpoint needed: POST `/api/feedback` for real-time translation feedback
- Backend route/controller/service: New feedback service calling Gemini
- SQLite `sentences` table: Clear cached analysis data (schema change)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-replace-quiz-with-scenario-based-output-practice-learning-by-doing*
*Context gathered: 2026-03-10*
