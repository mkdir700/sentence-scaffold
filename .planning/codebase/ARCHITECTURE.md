# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Full-stack monolithic SPA with server-side rendering pipeline and client-side state management

**Key Characteristics:**
- Full-stack TypeScript with React frontend and Express backend
- AI-powered analysis pipeline (Google Gemini API)
- SQLite persistent data layer with three interconnected entity models
- Client-server communication via REST API with caching mechanism
- Vite-based dev server with HMR support during development, static serving in production
- Responsive UI with Tailwind CSS and shadcn-inspired component library

## Layers

**Presentation Layer:**
- Purpose: Interactive user interface for sentence analysis and library management
- Location: `src/pages/`, `src/components/`
- Contains: React functional components with hooks, page routing, UI primitives
- Depends on: React Router for navigation, Lucide icons, services layer via HTTP
- Used by: Browser client

**Service Layer:**
- Purpose: Encapsulate external integrations and reusable business logic
- Location: `src/services/ai.ts`
- Contains: Google Gemini API integration with structured output (JSON schema definition)
- Depends on: @google/genai package, environment configuration
- Used by: Pages and components via direct imports

**API Layer:**
- Purpose: REST endpoints bridging frontend and data persistence
- Location: `server.ts` (routes 12-100)
- Contains: HTTP handlers for sentence CRUD, history retrieval, chunk management
- Depends on: Express, database layer via db object
- Used by: Frontend via fetch() calls

**Data Access Layer:**
- Purpose: Database initialization and connection management
- Location: `src/db/index.ts`
- Contains: SQLite database setup, schema definition (3 tables), shared db instance
- Depends on: better-sqlite3 library
- Used by: API layer for all persistence operations

**Utilities Layer:**
- Purpose: Shared helper functions for styling
- Location: `src/lib/utils.ts`
- Contains: CSS class name utilities (clsx + tailwind-merge)
- Used by: Components and pages for dynamic class binding

## Data Flow

**Sentence Analysis Workflow:**

1. User enters sentence in Home page input (`src/pages/Home.tsx`)
2. Frontend calls POST `/api/check-sentence` to check cache
3. **Cache hit:** Return stored analysis_json from sentences table
4. **Cache miss:** Call `analyzeSentence()` from `src/services/ai.ts` with Google Gemini
5. Gemini returns structured JSON following analysisSchema (defined in `src/services/ai.ts`)
6. Frontend calls POST `/api/save-sentence` to store (sentence text + analysis JSON blob)
7. Frontend navigates to Analysis page, passing analysis via Router state
8. Analysis page displays 6-step breakdown: skeleton → modifiers → tree → meaning → chunks → quiz

**Library Management:**

1. From Analysis page, user clicks "Save Sentence" → POST `/api/save` links sentence to saved_sentences table
2. User saves chunks individually via handleSaveChunk → POST `/api/chunks`
3. Library page fetches three separate datasets:
   - GET `/api/history` → last 10 analyzed sentences
   - GET `/api/saved` → full saved sentences with joined analysis_json
   - GET `/api/chunks` → all saved expression chunks

**State Management:**

- Client: Local component state (useState) for form input, loading states, UI toggles
- Server: Express request/response cycle, no persistent session state
- Persistence: SQLite database with three normalized tables (sentences, saved_sentences, chunks)

## Key Abstractions

**Analysis Schema:**
- Purpose: Enforces strict structure for Gemini API responses
- Location: `src/services/ai.ts` (lines 5-147)
- Pattern: Google Genai Type/Schema objects defining nested object and array shapes
- Used by: analyzeSentence() to ensure consistent analysis structure across all results

**Database Models:**

1. `sentences` table: Caches analyzed sentences with their full analysis JSON
2. `saved_sentences` table: User-marked important sentences (foreign key to sentences)
3. `chunks` table: Reusable expression patterns with examples (independent, optional reference to source_sentence_id)

**UI Component Library:**
- Location: `src/components/ui/`
- Components: Button, Card (CardHeader, CardContent, CardTitle), Badge, Input
- Pattern: Functional components with Tailwind styling and clsx utilities
- Used by: All pages and feature components

**Page Components:**
- Home: Analysis entry point with cache check and example suggestions
- Analysis: 6-step walkthrough with step progression and "Show All" mode toggle
- Library: Tabbed interface for three views (history, saved sentences, chunks)

## Entry Points

**Client Entry Point:**
- Location: `src/main.tsx`
- Triggers: Browser loads HTML, script tag loads bundle
- Responsibilities: React root mount, BrowserRouter setup, App component render

**Server Entry Point:**
- Location: `server.ts`
- Triggers: `npm run dev` or `node server.ts`
- Responsibilities: Express app initialization, middleware setup, API route handlers, Vite dev middleware in dev mode or static serving in production

**API Entry Points (all in `server.ts`):**
- POST `/api/check-sentence` (line 12-28): Check database cache before AI analysis
- POST `/api/save-sentence` (line 30-46): Persist new analysis
- GET `/api/history` (line 48-51): List recent analyses
- POST `/api/save` (line 53-71): Mark sentence as saved
- GET `/api/saved` (line 73-81): Fetch saved sentences with analysis
- POST `/api/chunks` (line 83-95): Save expression chunk
- GET `/api/chunks` (line 97-100): Fetch all chunks

## Error Handling

**Strategy:** Try-catch at API layer with JSON error responses; client-side alert feedback

**Patterns:**

- API layer (server.ts): Catch blocks return 500 status with error message object
- Validation: Request validation with early 400 returns for missing/malformed data
- Client: Try-catch in async handlers with alert() user feedback and console.error logging
- No global error boundary or recovery mechanisms for AI API failures

## Cross-Cutting Concerns

**Logging:** console.error for client-side errors; server errors logged implicitly in catch blocks

**Validation:**
- Client: Trim checks and basic string validation (Home.tsx line 26)
- Server: Required field checks with 400 status returns
- AI: Schema-based validation via Google Genai response schema enforcement

**Authentication:** None implemented - public access to all endpoints

**API Key Management:** GEMINI_API_KEY loaded via:
1. Environment variable at runtime (process.env.GEMINI_API_KEY)
2. Vite config defines it (vite.config.ts line 11)
3. Can be loaded from .env file via dotenv

---

*Architecture analysis: 2026-03-10*
