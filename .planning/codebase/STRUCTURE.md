# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
sentence-scaffold/
├── src/                          # Frontend source code
│   ├── main.tsx                 # React entry point with BrowserRouter
│   ├── App.tsx                  # Root layout with header nav and route config
│   ├── index.css                # Global styles (imported in main.tsx)
│   ├── components/
│   │   └── ui/                  # Shadcn-style UI primitives
│   │       ├── button.tsx       # Reusable button component
│   │       ├── card.tsx         # Card container (CardHeader, CardContent, CardTitle)
│   │       ├── badge.tsx        # Label badge component
│   │       └── input.tsx        # Form input component
│   ├── pages/                   # Page-level components (React Router routes)
│   │   ├── Home.tsx             # Sentence entry and recent history
│   │   ├── Analysis.tsx         # 6-step analysis walkthrough
│   │   └── Library.tsx          # Tabbed library view (history/saved/chunks)
│   ├── services/
│   │   └── ai.ts                # Google Gemini API integration
│   ├── lib/
│   │   └── utils.ts             # CSS utility helpers (clsx + tailwind-merge)
│   └── db/
│       └── index.ts             # SQLite initialization and schema
├── server.ts                     # Express server with API routes
├── vite.config.ts               # Vite build and dev config
├── tsconfig.json                # TypeScript compiler config
├── package.json                 # Dependencies and scripts
├── package-lock.json            # Locked dependency versions
├── .planning/
│   └── codebase/                # Planning documents directory
└── data/                        # Created at runtime
    └── app.db                   # SQLite database file
```

## Directory Purposes

**src/:**
- Purpose: All client-side frontend code and shared utilities
- Contains: React components, pages, services, styling, types
- Key files: main.tsx (entry), App.tsx (routing), pages/* (routes)

**src/components/ui/:**
- Purpose: Reusable UI component library
- Contains: Styled React functional components with Tailwind CSS
- Key files: button.tsx, card.tsx (most used in pages)

**src/pages/:**
- Purpose: Route-level page components corresponding to URL paths
- Contains: Full-page components with local state, API integration
- Key files: Home.tsx (/), Analysis.tsx (/analysis), Library.tsx (/library)

**src/services/:**
- Purpose: External API integration and business logic
- Contains: Google Genai client initialization and analyzeSentence() function
- Key files: ai.ts (only file - single service)

**src/lib/:**
- Purpose: Shared utility functions and helpers
- Contains: Non-component helpers used across pages/components
- Key files: utils.ts (CSS class merging)

**src/db/:**
- Purpose: Database initialization and schema management
- Contains: SQLite connection and table definitions
- Key files: index.ts (exports db singleton)

**data/ (runtime-created):**
- Purpose: Local file storage
- Contains: SQLite database file
- Key files: app.db (created on first run)

## Key File Locations

**Entry Points:**

- `src/main.tsx`: React root mounting with BrowserRouter wrapper (12 lines)
- `server.ts`: Express app initialization and API route handlers (119 lines)
- `.planning/codebase/`: Planning documents consumed by GSD orchestrator

**Configuration:**

- `package.json`: Dependencies (React 19, Express, better-sqlite3, @google/genai, Tailwind)
- `vite.config.ts`: React plugin, Tailwind plugin, @ path alias resolution
- `tsconfig.json`: TypeScript target ES2022, paths configuration, JSX setup
- `.env` (not in repo): Expected to contain GEMINI_API_KEY

**Core Logic:**

- `src/services/ai.ts`: Gemini API integration with structured response schema (171 lines)
- `src/db/index.ts`: SQLite setup with 3 tables schema (43 lines)
- `server.ts`: 7 API routes for analysis cache, persistence, and retrieval (119 lines)

**Presentation:**

- `src/App.tsx`: Route configuration and header navigation (49 lines)
- `src/pages/Home.tsx`: Input form, cache checking, example sentences (169 lines)
- `src/pages/Analysis.tsx`: 6-step breakdown with Tree and QuizCard components (548 lines)
- `src/pages/Library.tsx`: Tabbed interface for three data views (207 lines)

**Styling & Utilities:**

- `src/index.css`: Global styles (imported in main.tsx)
- `src/components/ui/*`: Button (37 lines), Card (41 lines), Badge (20 lines), Input (25 lines)
- `src/lib/utils.ts`: clsx + tailwind-merge wrapper (6 lines)

**Testing:**

- None present - no test files found

## Naming Conventions

**Files:**

- Pages: PascalCase with .tsx extension (Home.tsx, Analysis.tsx, Library.tsx)
- UI Components: PascalCase with .tsx extension (Card.tsx, Button.tsx)
- Services: camelCase with .ts extension (ai.ts)
- Index files: index.ts for barrel exports and initialization
- Schemas/Types: Defined inline, no separate .types.ts files

**Directories:**

- Feature directories: lowercase plural (pages/, components/, services/, lib/)
- UI subdirectory: ui/ folder within components/
- API endpoints: kebab-case with leading slash (/api/check-sentence, /api/save-sentence)

**Functions and Variables:**

- React hooks: camelCase with handle prefix for event handlers (handleAnalyze, handleSaveSentence)
- State variables: camelCase (sentence, isLoading, savedChunks)
- API functions: camelCase (analyzeSentence, startServer)
- Constants: UPPERCASE (GEMINI_API_KEY in env, PORT = 3000)

**Types/Interfaces:**

- Inline with `any` in many places (Home.tsx, Library.tsx, Analysis.tsx)
- No explicit interfaces defined for API response/request shapes
- Schema definitions use Google Genai Type/Schema objects (ai.ts)

## Where to Add New Code

**New Feature (sentence analysis enhancement):**

- Primary code: Add endpoint in `server.ts` following pattern of existing routes (POST/GET to /api/new-feature)
- Database table: Add schema definition to `src/db/index.ts` CREATE TABLE section
- Frontend trigger: Add UI in relevant page (Home.tsx for input, Analysis.tsx for display)
- Service function: Export from `src/services/ai.ts` if using Gemini API
- Tests: None - no test structure in place

**New Component (UI reusable):**

- Implementation: Add .tsx file to `src/components/ui/` following Button.tsx/Card.tsx patterns
- Export: Test by importing in relevant page component
- Styling: Use Tailwind className strings with clsx utility for conditional classes
- Example location: `src/components/ui/modal.tsx`

**New Page (route):**

- File: Create in `src/pages/NewPage.tsx` as functional component
- Route: Add `<Route path="/new-page" element={<NewPage />} />` to App.tsx Routes
- Navigation: Add link in App.tsx header nav if needed
- API calls: Use fetch() with /api/* endpoints, follow Home.tsx pattern

**New Utility (helper function):**

- Shared helpers: Add to `src/lib/utils.ts`
- Page-specific utils: Keep in same file or create utils.ts in page's parent directory
- Service integration: Create new file in `src/services/` following ai.ts pattern

**New Database Table:**

- Schema: Add CREATE TABLE IF NOT EXISTS to `src/db/index.ts` db.exec() call
- Access: Query via `db.prepare()` in server.ts route handlers
- No ORM - use raw SQL with better-sqlite3 API

## Special Directories

**data/:**
- Purpose: SQLite database storage
- Generated: Yes (created on first run if missing)
- Committed: No (should be in .gitignore, gitignored by default)
- Structure: Single app.db file

**.planning/codebase/:**
- Purpose: GSD orchestrator documentation
- Generated: Yes (filled by /gsd:map-codebase commands)
- Committed: Yes (source of truth for code generation)
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

## Import Path Aliases

**@ alias:**
- Definition: `tsconfig.json` paths: `"@/*": ["./*"]`
- Usage: `import Button from "@/src/components/ui/button"`
- Scope: Absolute from project root (unusual - typically points to src/)
- Examples: All imports in pages use `@/src/` prefix

---

*Structure analysis: 2026-03-10*
