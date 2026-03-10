# Codebase Concerns

**Analysis Date:** 2026-03-10

## Type Safety Issues

**Pervasive `any` type usage:**
- Issue: The codebase extensively uses `any` types, bypassing TypeScript type checking. This creates runtime bugs and makes refactoring dangerous
- Files: `src/pages/Analysis.tsx`, `src/pages/Home.tsx`, `src/pages/Library.tsx`
- Impact: Type errors go undetected at compile time. API responses are not validated. Refactoring is fragile
- Examples:
  - Line 49 in `src/pages/Analysis.tsx`: `const handleSaveChunk = async (chunk: any, index: number)`
  - Line 14 in `src/pages/Home.tsx`: `const [history, setHistory] = useState<any[]>([])`
  - Lines 217, 319, 350, 436, 462 in `src/pages/Analysis.tsx`: Multiple `.map((comp: any, i: number)...)`
  - Lines 15-17 in `src/pages/Library.tsx`: All state using `any[]` type
- Fix approach: Create proper TypeScript interfaces for all API responses and component data structures. Generate or define types that match Gemini API schema response

## Error Handling & User Feedback

**Poor error handling in frontend:**
- Issue: Errors from API calls and Gemini are caught but only shown via `alert()`, which is poor UX. Stack traces logged to console without proper error context
- Files: `src/pages/Home.tsx` (lines 53-55), `src/pages/Analysis.tsx` (lines 41-43, 57-59), `src/pages/Library.tsx` (lines 23, 28, 33)
- Impact: Users cannot understand what went wrong. No error recovery flow. Production errors are invisible
- Current pattern: `catch(console.error)` with no user notification
- Fix approach: Implement proper error boundary components. Create error state in components. Display specific error messages. Log to server-side monitoring

**No timeout handling:**
- Issue: Long-running Gemini API calls can hang without user feedback. No timeout mechanism
- Files: `src/pages/Home.tsx` (handleAnalyze function), `src/services/ai.ts` (analyzeSentence)
- Impact: User thinks application is frozen. Network timeouts leave UI in loading state indefinitely
- Fix approach: Add request timeout (suggest 30s). Show timeout error with retry option

## Input Validation

**No sentence validation before API calls:**
- Issue: Only basic `.trim()` check. No length limits, no validation of input before sending to Gemini
- Files: `src/pages/Home.tsx` line 26, `src/pages/Analysis.tsx` line 38
- Impact: Users can send empty strings after trimming. Very long sentences cause Gemini errors. No clear feedback on what's acceptable
- Fix approach: Add min/max length validation (suggest 20-2000 chars). Show validation errors before submitting. Validate on backend as well

**No API response validation:**
- Issue: Gemini response is assumed to match schema but no runtime validation. Missing or malformed fields will crash rendering
- Files: `src/services/ai.ts` line 169 (JSON.parse with no error handling), `src/pages/Analysis.tsx` destructuring analysis object
- Impact: If Gemini returns unexpected structure, JSON.parse silently fails or rendering crashes with unclear error
- Fix approach: Use runtime schema validator (zod, io-ts) to validate Gemini response. Fall back gracefully if validation fails

## Database & Data Persistence

**No data migration strategy:**
- Issue: Database schema is created on startup with no versioning. Schema changes will break existing databases
- Files: `src/db/index.ts` lines 13-42
- Impact: Cannot safely upgrade schema in production. No way to track schema versions
- Fix approach: Implement proper database migration system. Version schema. Create migration files

**No database constraints or validation:**
- Issue: Schema has no NOT NULL constraints where needed (except UNIQUE on sentences.text). No foreign key constraints enforced
- Files: `src/db/index.ts` - chunks table has source_sentence_id INT but no foreign key constraint
- Impact: Can create orphaned records. Data integrity not guaranteed. Query results may be incomplete
- Fix approach: Add NOT NULL constraints. Add FOREIGN KEY constraints. Add unique constraints where appropriate

**Unsafe database casting:**
- Issue: Raw `.get()` and `.run()` results cast to `any` without validation
- Files: `server.ts` lines 19, 56 (cast to `any`)
- Impact: Type safety lost in query results. Easy to access non-existent fields
- Fix approach: Define database row types. Use type-safe query results. Add runtime validation

## API Security

**No authentication or authorization:**
- Issue: All API endpoints are completely open. Any client can read, write, or delete any data
- Files: All endpoints in `server.ts`
- Impact: Users can steal others' data. Data can be maliciously deleted or modified. No concept of user identity
- Fix approach: Implement authentication (session or JWT). Add authorization checks. Enforce user isolation

**No rate limiting:**
- Issue: Endpoints have no rate limiting. Users can spam Gemini API calls or database writes
- Files: `server.ts` - all POST endpoints
- Impact: Can exhaust API quota. Denial of service by database writes. No cost control
- Fix approach: Add rate limiting middleware (express-rate-limit). Implement per-user quotas if multi-user

**No input sanitization:**
- Issue: Sentence text passed directly to database and Gemini without sanitization
- Files: `server.ts` line 37-39 (JSON.stringify of user data), `src/services/ai.ts` line 155 (template literal)
- Impact: Potential for prompt injection attacks on Gemini. Could cause unexpected AI behavior
- Fix approach: Sanitize/escape user input. Use parameterized queries (already done with `?` placeholders). Validate sentence format

**No CORS policy:**
- Issue: Application uses `express.static()` and implicit CORS. Frontend and backend are same-origin but no explicit policy
- Files: `server.ts` line 110
- Impact: If frontend ever hosted separately, no protection against cross-origin attacks
- Fix approach: Add explicit CORS middleware with whitelist

## Code Organization & Maintainability

**Monolithic Analysis component:**
- Issue: `src/pages/Analysis.tsx` is 547 lines with no component extraction. Multiple concerns mixed together
- Files: `src/pages/Analysis.tsx`
- Impact: Difficult to test. Difficult to reuse UI elements. Hard to maintain. Performance issues from re-rendering everything
- Fix approach: Extract components: `<SentenceDisplay>`, `<CoreSkeletonStep>`, `<ModifiersStep>`, `<StructureTreeStep>`, `<MeaningStep>`, `<ChunksStep>`, `<QuizStep>`. Each should be its own file

**No component composition for UI kit:**
- Issue: UI components like Button, Card are simple wrappers but modal/dialog components missing
- Files: `src/components/ui/`
- Impact: Inconsistent error dialogs (using alert()). No consistent loading states. No proper form error display
- Fix approach: Add Dialog component. Add Form components with validation. Extract confirmation modals

**Duplicate fetch/error patterns:**
- Issue: Same try-catch-alert pattern repeated across multiple components
- Files: `src/pages/Home.tsx`, `src/pages/Analysis.tsx`, `src/pages/Library.tsx`
- Impact: Error handling logic scattered. Hard to maintain consistent behavior
- Fix approach: Create custom hook for fetch (useFetch). Centralize error handling. Create error boundary

## Performance Concerns

**No loading state differentiation:**
- Issue: All async operations show same generic "loading" state without distinguishing between cache hit and fresh analysis
- Files: `src/pages/Home.tsx` (isLoading state used for both cache check and AI generation)
- Impact: Users cannot tell if response will be instant (cached) or slow (new AI call)
- Fix approach: Distinguish states: checking cache, generating analysis, saving. Show appropriate feedback

**Full page refresh on navigation to Analysis:**
- Issue: Analysis page relies on location.state for data. Refreshing page loses analysis, shows "No analysis found"
- Files: `src/pages/Analysis.tsx` lines 63-71
- Impact: Poor UX. Users cannot bookmark analysis. Cannot share links to analyses. Data loss on page refresh
- Fix approach: Use URL parameters or route parameters. Store analysis in database with ID. Create shareable links

**No caching strategy:**
- Issue: Identical sentences are checked against database, which is good, but no client-side caching. No cache headers on GET endpoints
- Files: `src/pages/Home.tsx` line 31-39 (checks server), `server.ts` (no Cache-Control headers)
- Impact: Repeated requests to same sentence cause repeated database queries
- Fix approach: Add HTTP caching headers on GET endpoints. Add client-side cache (React Query or similar). Index database queries

**Library page loads all data on mount:**
- Issue: useEffect loads all history, saved sentences, and chunks without pagination or filtering
- Files: `src/pages/Library.tsx` lines 19-34
- Impact: Scales poorly. If user has hundreds of records, page becomes slow and memory-heavy
- Fix approach: Add pagination or lazy loading. Add search/filter. Implement infinite scroll

## Testing & Verification

**No test files:**
- Issue: Zero test coverage. No unit tests, integration tests, or E2E tests
- Files: No `.test.ts` or `.spec.ts` files found
- Impact: Changes are risky. Bugs go undetected. Regression cannot be caught
- Fix approach: Add Jest or Vitest. Write unit tests for utils and hooks. Add integration tests for API flows. Add E2E tests for critical paths

**No schema validation tests:**
- Issue: No tests verifying Gemini response matches expected schema
- Files: `src/services/ai.ts`
- Impact: If Gemini API breaks contract, error is only discovered in production
- Fix approach: Add snapshot tests or contract tests for Gemini responses

## Environment & Configuration

**No environment configuration management:**
- Issue: API key only config (GEMINI_API_KEY). No way to configure database path, server port, or other settings
- Files: `server.ts` line 7 (hardcoded PORT 3000), `src/db/index.ts` line 5 (hardcoded data/app.db)
- Impact: Hard to run multiple environments. Port conflicts possible. Cannot customize for deployment
- Fix approach: Use dotenv for all configuration. Add .env.example with all required vars. Document setup

**Missing Node.js version specification:**
- Issue: No .nvmrc or engines field in package.json
- Files: `package.json`
- Impact: Different developers may use different Node versions, causing issues
- Fix approach: Add .nvmrc file. Add `engines` field to package.json. Document minimum version

**No build output configuration:**
- Issue: Vite builds to dist/ but no configuration for output path
- Files: `vite.config.ts`
- Impact: Cannot change build output location easily
- Fix approach: Explicit outDir in Vite config

## Dependencies & Versions

**Vite duplication in dependencies:**
- Issue: Vite appears in both dependencies and devDependencies
- Files: `package.json` lines 28, 39
- Impact: Unnecessary bloat. Vite should only be in devDependencies
- Fix approach: Remove from dependencies, keep only in devDependencies

**Old Google Genai SDK:**
- Issue: Using `@google/genai` 1.29.0 with older model reference `gemini-3.1-pro-preview`
- Files: `src/services/ai.ts` line 1, line 151
- Impact: May be using deprecated API. Model reference may be incorrect for current SDK version
- Fix approach: Update to latest @google/genai. Verify model name is current (check documentation)

## Documentation & Type Definitions

**No JSDoc comments:**
- Issue: Functions have no JSDoc documentation explaining parameters, return values, or side effects
- Files: All .ts and .tsx files
- Impact: IDE autocomplete is poor. API contracts unclear. Refactoring is harder
- Fix approach: Add JSDoc to all exported functions and components

**Unclear type definitions:**
- Issue: Analysis schema in `src/services/ai.ts` has many optional or unclear fields
- Files: `src/services/ai.ts` lines 5-147
- Impact: Rendering code doesn't know which fields are guaranteed vs optional
- Fix approach: Generate TypeScript types from schema. Export types that frontend can import

## Security Gaps - Data Privacy

**Sensitive data in database:**
- Issue: Sentences analyzed could contain personal information, but there's no data deletion or privacy controls
- Files: `src/db/index.ts` - sentences table persists indefinitely
- Impact: User privacy not protected. GDPR/privacy compliance issues
- Fix approach: Add ability to delete user data. Add data retention policy. Consider hashing sensitive fields

---

*Concerns audit: 2026-03-10*
