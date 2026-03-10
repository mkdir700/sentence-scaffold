# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**AI Generation:**
- Google Gemini 3.1 Pro - Sentence structure analysis and breakdown
  - SDK/Client: `@google/genai` (1.29.0)
  - Implementation: `src/services/ai.ts`
  - Auth: Environment variable `GEMINI_API_KEY`
  - Usage: Called via `analyzeSentence()` to generate structured JSON analysis
  - Schema: Structured output with specific schema for sentence components, translations, quizzes

## Data Storage

**Databases:**
- SQLite 3 (embedded) - Local relational database
  - Connection: File-based storage at `data/app.db`
  - Client: `better-sqlite3` (12.4.1) - Synchronous SQLite client
  - Location: `src/db/index.ts` - Database initialization and schema

**Database Schema:**
- `sentences` table - Stores analyzed sentences with JSON analysis results
  - Fields: id, text (unique), analysis_json, created_at
- `saved_sentences` table - User's saved/bookmarked sentences
  - Fields: id, sentence_id (FK), tags, notes, review_status, created_at
- `chunks` table - Extracted language chunks/expressions from sentences
  - Fields: id, expression, meaning, pattern, examples, source_sentence_id, tags, review_status, created_at

**File Storage:**
- Local filesystem only - Data directory at `data/`

**Caching:**
- None (relies on database caching via SQLite)

## Authentication & Identity

**Auth Provider:**
- Custom/None - No user authentication system
- API endpoints are public (no authentication middleware)
- All data is stored locally and shared across all users accessing the instance

## Environment Configuration

**Required env vars:**
- `GEMINI_API_KEY` - Google Gemini API authentication token (required for AI analysis)
- `APP_URL` - Deployed application URL (used for self-referential links, OAuth callbacks, API endpoints)
- `DISABLE_HMR` - Optional, set to 'true' to disable Hot Module Replacement (used in AI Studio)

**Secrets location:**
- Development: `.env.local` file (not committed)
- Production: Environment variables injected by deployment platform
- Template: `.env.example` (committed, contains placeholder documentation)

## API Endpoints

**Application serves:**
- `POST /api/check-sentence` - Check if sentence exists in history and return cached analysis
- `POST /api/save-sentence` - Save new sentence with AI analysis to database
- `GET /api/history` - Retrieve last 10 analyzed sentences
- `POST /api/save` - Mark a sentence as saved/bookmarked
- `GET /api/saved` - Retrieve all saved sentences with their analyses
- `POST /api/chunks` - Add new language chunk/expression
- `GET /api/chunks` - Retrieve all language chunks

## Monitoring & Observability

**Error Tracking:**
- None configured - Errors logged to console via Express error handlers

**Logs:**
- Console output only - No external logging service

**Server Info:**
- Logs startup message to console: "Server running on http://localhost:PORT"

## CI/CD & Deployment

**Hosting:**
- AI Studio (documented in README)
- Also supports standard Node.js hosting (Docker, Vercel, Cloud Run compatible)

**CI Pipeline:**
- None configured (no CI/CD files found)

**Entry Point:**
- `server.ts` - Express application server (runs on port 3000)
- Development: `npm run dev` (via tsx)
- Production: `npm start` or Node.js direct execution

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None configured

## Third-Party UI Dependencies

**Icons:**
- lucide-react - Icon components for UI

**Animations:**
- motion - Animation/motion library for interactive UI elements

**Styling Utilities:**
- clsx - Conditional CSS class composition
- tailwind-merge - Intelligent Tailwind CSS class merging

---

*Integration audit: 2026-03-10*
