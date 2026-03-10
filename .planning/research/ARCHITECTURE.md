# Architecture Research

**Domain:** Full-stack SPA — React frontend + Express backend, AI-powered analysis tool
**Researched:** 2026-03-10
**Confidence:** HIGH (grounded in codebase audit + current ecosystem patterns)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                       │
├──────────────┬───────────────┬──────────────────────────────┤
│   Pages       │   Features    │   Shared UI                  │
│  (route glue) │  (step comps) │  (ui/ primitives)            │
├──────────────┴───────────────┴──────────────────────────────┤
│              Custom Hooks (useAnalysis, useLibrary)           │
├─────────────────────────────────────────────────────────────┤
│         API Client Layer  (src/api/*.ts)                      │
│         TanStack Query cache sits here                        │
├─────────────────────────────────────────────────────────────┤
│              Shared Types  (src/types/*.ts)                   │
└──────────────────────────────────────────────────────────────┘
                         HTTP / REST
┌─────────────────────────────────────────────────────────────┐
│                     Express Server                            │
├───────────────┬──────────────────────────────────────────────┤
│  Routes       │  /api/sentences  /api/chunks  /api/history   │
│  (wire only)  │                                               │
├───────────────┴──────────────────────────────────────────────┤
│  Controllers  │  SentenceController  ChunkController          │
│  (HTTP layer) │  — validates req, calls service, returns res  │
├───────────────┴──────────────────────────────────────────────┤
│  Services     │  SentenceService  ChunkService                │
│  (business)   │  — AI call, cache logic, persistence          │
├─────────────────────────────────────────────────────────────┤
│  Data Access  │  db singleton (better-sqlite3)                │
│               │  SQL prepared statements                       │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| Pages (Home, Analysis, Library) | Route-level glue — compose features, no logic | Feature components, hooks |
| Feature components (AnalysisStep, ChunkCard, etc.) | One analysis step or one domain widget | UI primitives, hooks |
| UI primitives (Button, Card, Badge) | Visual building blocks with no business knowledge | Nothing |
| Custom hooks (useAnalysis, useLibrary) | Encapsulate data-fetching + mutation logic | API client, TanStack Query |
| API client (src/api/*.ts) | Typed fetch wrappers per domain | Express REST endpoints |
| Shared types (src/types/*.ts) | Single source of truth for request/response shapes | Both frontend and backend import these |
| Express routes (server/routes/*.ts) | URL + middleware wiring only, no logic | Controllers |
| Controllers (server/controllers/*.ts) | Parse req, validate, call service, format res | Services |
| Services (server/services/*.ts) | Business logic — AI call, cache lookup, DB write | Data access layer (db) |
| Data access (src/db/index.ts) | SQLite singleton, table schema | Controllers via services |

---

## Recommended Project Structure

```
sentence-scaffold/
├── src/                              # Frontend (React)
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── types/                        # Shared TypeScript interfaces
│   │   ├── analysis.ts               # AnalysisResult, AnalysisStep, Chunk
│   │   ├── api.ts                    # Request/response payload types
│   │   └── index.ts                  # Re-exports
│   │
│   ├── api/                          # Typed API client functions
│   │   ├── sentences.ts              # checkSentence(), saveSentence(), saveToLibrary()
│   │   ├── chunks.ts                 # saveChunk(), getChunks()
│   │   ├── history.ts                # getHistory(), getSaved()
│   │   └── client.ts                 # Base fetch wrapper (error handling, JSON parse)
│   │
│   ├── hooks/                        # Custom React hooks (data + UI logic)
│   │   ├── useAnalysis.ts            # Orchestrates check-sentence + AI + save flow
│   │   ├── useLibrary.ts             # Fetches history, saved, chunks
│   │   └── useSaveChunk.ts           # Mutation hook for saving a chunk
│   │
│   ├── components/
│   │   ├── ui/                       # Primitives (Button, Card, Badge, Input) — unchanged
│   │   └── analysis/                 # Analysis feature components
│   │       ├── SkeletonStep.tsx
│   │       ├── ModifiersStep.tsx
│   │       ├── TreeStep.tsx
│   │       ├── MeaningStep.tsx
│   │       ├── ChunksStep.tsx
│   │       ├── QuizStep.tsx
│   │       └── StepNav.tsx           # Step progress indicator
│   │
│   ├── pages/                        # Route-level components (glue only)
│   │   ├── Home.tsx
│   │   ├── Analysis.tsx
│   │   └── Library.tsx
│   │
│   ├── services/
│   │   └── ai.ts                     # Google Gemini integration — unchanged
│   │
│   ├── db/
│   │   └── index.ts                  # SQLite singleton — unchanged
│   │
│   └── lib/
│       └── utils.ts
│
├── server/                           # Backend (Express) — extracted from server.ts
│   ├── index.ts                      # Entry point: app setup + Vite middleware
│   ├── routes/
│   │   ├── sentences.ts              # POST /api/check-sentence, POST /api/save-sentence, POST /api/save
│   │   ├── chunks.ts                 # POST /api/chunks, GET /api/chunks
│   │   └── history.ts                # GET /api/history, GET /api/saved
│   ├── controllers/
│   │   ├── SentenceController.ts
│   │   └── ChunkController.ts
│   └── services/
│       ├── SentenceService.ts        # Cache check, AI delegation, persistence
│       └── ChunkService.ts           # Chunk CRUD
│
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Structure Rationale

- **src/types/:** Importing the same interface from both frontend and backend eliminates the most common class of API integration bugs. Since this is a single-repo project (not a monorepo), `src/types/` is imported by both `src/api/` and `server/` — TypeScript resolves both from the same root.
- **src/api/:** Centralising fetch calls in one layer means changing a URL or adding an auth header requires one edit. Components never call `fetch()` directly.
- **src/hooks/:** Custom hooks own the TanStack Query setup (queryKey, queryFn, staleTime). Components only call hooks and receive `{ data, isLoading, error }`.
- **src/components/analysis/:** Each of the 6 analysis steps becomes a standalone component. The Analysis page assembles them; it no longer contains rendering logic.
- **server/routes/:** Route files contain only `router.get(path, middleware, controller.method)` — no inline logic.
- **server/controllers/:** Controllers validate the request and delegate to a service. They never touch the database.
- **server/services/:** Services contain all business logic. Easy to unit test because they have no `req`/`res` dependency.

---

## Architectural Patterns

### Pattern 1: Typed API Client with Domain Modules

**What:** Each domain (sentences, chunks, history) gets its own file in `src/api/`. Each function has typed parameters and return types derived from `src/types/`. All files call a shared `client.ts` base function that handles JSON parsing and HTTP error translation.

**When to use:** Always — this is the foundation everything else builds on.

**Trade-offs:** Small upfront cost for a lot of ongoing benefit. No alternative fetch patterns proliferating in components.

**Example:**
```typescript
// src/api/client.ts
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// src/api/sentences.ts
import type { AnalysisResult, CheckSentenceResponse } from '@/src/types';
export async function checkSentence(sentence: string): Promise<CheckSentenceResponse> {
  return request('/api/check-sentence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence }),
  });
}
```

### Pattern 2: TanStack Query Hooks Wrapping API Functions

**What:** Custom hooks in `src/hooks/` wrap TanStack Query's `useQuery` / `useMutation` around the API client functions. The hook owns the `queryKey`, `staleTime`, and cache invalidation logic. Components receive plain `{ data, isLoading, isError }` — they have no knowledge of TanStack Query internals.

**When to use:** For all server state. Local UI state (which step is active, dropdown open/closed) stays in `useState` inside the component.

**Trade-offs:** An extra abstraction layer, but it makes components testable without mocking TanStack Query. The hook is also the right place to add `select` projections if a component only needs a slice of the data.

**Example:**
```typescript
// src/hooks/useLibrary.ts
import { useQuery } from '@tanstack/react-query';
import { getHistory } from '@/src/api/history';

export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: getHistory,
    staleTime: 30_000,
  });
}

// Usage in Library.tsx (component stays clean)
const { data: history, isLoading, isError } = useHistory();
```

### Pattern 3: Analysis Step Components with Controlled Props

**What:** The 547-line `Analysis.tsx` is decomposed into 6 step components plus a `StepNav` component. Each step component receives its data slice as typed props and renders one concern. The `Analysis` page manages only: which step is active, show-all toggle, and navigation back to home.

**When to use:** When a single component crosses ~150 lines or contains logically distinct rendering sections.

**Trade-offs:** More files, but each is testable in isolation. The step components are also reusable if a "summary" view is ever needed elsewhere.

**Example:**
```typescript
// src/components/analysis/SkeletonStep.tsx
interface SkeletonStepProps {
  coreSkeleton: string;
  mainClause: string;
  sentenceType: string;
}
export function SkeletonStep({ coreSkeleton, mainClause, sentenceType }: SkeletonStepProps) {
  // renders only skeleton content
}

// src/pages/Analysis.tsx — becomes thin glue
const { data: analysis } = useAnalysis(sentence);
return (
  <StepNav step={step} total={6} onNext={...} />
  {step === 1 && <SkeletonStep {...analysis.skeleton} />}
  {step === 2 && <ModifiersStep {...analysis.modifiers} />}
  ...
)
```

### Pattern 4: Express Route / Controller / Service Separation

**What:** Three distinct layers in the backend. Routes declare the path and wire middleware. Controllers extract `req.body`, validate required fields, call service methods, and return HTTP responses. Services contain all business logic and never reference `req` or `res`.

**When to use:** As soon as there is more than one route — which is already the case here.

**Trade-offs:** More files than the current monolithic `server.ts`, but each service method is independently unit-testable. Validation errors and business errors are cleanly separated.

**Example:**
```typescript
// server/routes/sentences.ts
router.post('/check-sentence', SentenceController.check);

// server/controllers/SentenceController.ts
static async check(req: Request, res: Response) {
  const { sentence } = req.body;
  if (!sentence) return res.status(400).json({ error: 'sentence required' });
  const result = await SentenceService.checkCache(sentence);
  return result
    ? res.json(result)
    : res.status(404).json({ error: 'Not found' });
}

// server/services/SentenceService.ts
static checkCache(sentence: string): AnalysisResult | null {
  const row = db.prepare('SELECT analysis_json FROM sentences WHERE text = ?').get(sentence);
  return row ? JSON.parse((row as any).analysis_json) : null;
}
```

### Pattern 5: URL-Based Navigation for Analysis Page

**What:** Instead of passing analysis data via React Router `state` (which is lost on page refresh), the analysis sentence is encoded in the URL (e.g., `/analysis?sentence=...` or `/analysis/:id`). The Analysis page reads the sentence from the URL parameter, then calls the API to fetch the analysis — using TanStack Query to cache the result.

**When to use:** Whenever a page's primary data comes from user input that should survive refresh and be shareable.

**Trade-offs:** Slightly more complex hook (needs to handle loading and 404), but eliminates the data loss bug that currently exists. Using the sentence ID from the `sentences` table as the URL parameter (`/analysis/42`) is cleaner than encoding raw text in the URL.

---

## Data Flow

### Primary Flow: Sentence Analysis

```
User types sentence in Home.tsx
    ↓
useAnalysis(sentence) hook fires
    ↓
api/sentences.ts → POST /api/check-sentence
    ↓
    ├── Cache HIT → returns analysis_json → TanStack Query caches → Analysis page renders
    └── Cache MISS → Home calls ai.ts → analyzeSentence(sentence)
            ↓
        ai.ts → Google Gemini API → structured JSON
            ↓
        api/sentences.ts → POST /api/save-sentence (persist to SQLite)
            ↓
        navigate to /analysis/:id
```

### Secondary Flow: Save to Library

```
User clicks "Save Sentence" in Analysis page
    ↓
useSaveSentence mutation fires
    ↓
api/sentences.ts → POST /api/save
    ↓
SentenceController.save → SentenceService.saveToLibrary(sentence)
    ↓
INSERT INTO saved_sentences
    ↓
useMutation onSuccess → queryClient.invalidateQueries(['saved'])
    ↓
Library page refetches automatically
```

### State Management Boundaries

```
TanStack Query cache
  ├── ['history']           → getHistory()
  ├── ['saved']             → getSaved()
  ├── ['chunks']            → getChunks()
  └── ['analysis', id]      → getAnalysis(id)

Local component state (useState)
  ├── Analysis page: step (1-6), showAll (boolean)
  ├── Home page: inputSentence (string)
  └── Library page: activeTab ('history' | 'saved' | 'chunks')
```

**Rule:** Server state lives in TanStack Query. UI-only state lives in `useState`. Nothing else needed. No Zustand, no Context for data.

---

## Scaling Considerations

This is a single-user local tool. Scaling is not a concern. The architecture recommendations here are about maintainability at the code level, not infrastructure.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (1 user, local) | Monolith SPA + Express is correct. This refactor is about code quality, not scale. |
| Multi-user (future) | Add authentication layer, replace SQLite with Postgres, add user_id to all tables. The service layer makes this straightforward. |
| Public deployment | Add rate limiting middleware, CORS policy, env-scoped DB connection. The route/controller separation means middleware changes are one-file edits. |

---

## Anti-Patterns

### Anti-Pattern 1: Components Calling `fetch()` Directly

**What people do:** `await fetch('/api/chunks', ...)` inline in event handlers inside components, as currently seen in Analysis.tsx lines 35 and 51.

**Why it's wrong:** Duplicates URL strings, headers, and error handling across the codebase. A URL or payload shape change requires hunting through component files. Cannot be tested without mocking `fetch` at a low level.

**Do this instead:** Route all HTTP through `src/api/` functions. Components call hooks. Hooks call API functions.

### Anti-Pattern 2: Business Logic in Route Handlers

**What people do:** Inline SQL queries and conditional logic directly in `app.post('/api/save', ...)` handlers, as currently in server.ts.

**Why it's wrong:** Logic cannot be unit tested without spinning up an HTTP server. The route handler becomes a grab-bag. Validating input and running business logic become indistinguishable.

**Do this instead:** Route handler extracts params → Controller validates → Service runs logic. Services are pure functions of inputs, easily tested with `describe('SentenceService', ...)`.

### Anti-Pattern 3: Router State for Page Data

**What people do:** Pass analysis result via `navigate('/analysis', { state: { analysis } })`, as currently in Home.tsx.

**Why it's wrong:** Data is lost on page refresh, browser back/forward becomes fragile, the page cannot be bookmarked or linked. Currently the #1 UX bug in this app.

**Do this instead:** Navigate to `/analysis/:id`. Analysis page reads the id from the URL, calls `useAnalysis(id)` which hits the cache or fetches from the server.

### Anti-Pattern 4: `any` Types on API Boundaries

**What people do:** `const existing = db.prepare(...).get(sentence) as any` and `chunk: any` in handler params.

**Why it's wrong:** Type errors at the API boundary (wrong field name, missing field) become runtime surprises. The entire value of TypeScript is lost at the most important seam in the application.

**Do this instead:** Define interfaces in `src/types/` and cast database results to them. Use the same interfaces on the frontend for response typing.

### Anti-Pattern 5: Monolithic Page Components

**What people do:** Put all rendering logic for all 6 analysis steps into a single 547-line file, with inline sub-components like `TreeNode` and `QuizCard` defined inside the same module.

**Why it's wrong:** Cannot test individual steps. Any change to one step risks breaking another. Cognitive load for every edit is the entire file.

**Do this instead:** One file per step component in `src/components/analysis/`. The page file becomes 50-80 lines of composition.

---

## Integration Points

### External Services

| Service | Integration Pattern | Location |
|---------|---------------------|----------|
| Google Gemini API | `@google/genai` SDK, structured JSON schema response | `src/services/ai.ts` — keep as-is, already well isolated |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React page ↔ React hook | Hook call + destructured return `{ data, isLoading, error }` | Hooks own all server state logic |
| React hook ↔ API client | Direct function call, typed params + return | No `fetch` outside `src/api/` |
| API client ↔ Express | HTTP REST, JSON bodies | Types in `src/types/api.ts` enforce shape on both sides |
| Express route ↔ controller | Function reference `controller.method` | Routes never contain logic |
| Controller ↔ service | Direct method call (static class or module export) | Services have no `req`/`res` dependency |
| Service ↔ database | `db.prepare().get/run/all()` with typed casts | Only services touch `db` directly |
| Home page ↔ Analysis page | URL parameter (`/analysis/:id`) — NOT router state | Fix for data-loss-on-refresh bug |

---

## Build Order Implications

The dependency graph dictates this order — each layer depends on the previous:

1. **Shared types first** (`src/types/`) — everything else imports from here. No dependencies; safe to build first.
2. **Database + service layer** (`server/services/`) — depends only on types and the existing db singleton. Can be built and tested before any HTTP layer exists.
3. **Express routes + controllers** (`server/routes/`, `server/controllers/`) — wires services to HTTP. Depends on services and types.
4. **API client layer** (`src/api/`) — typed wrappers around the now-stable API contract. Depends on types.
5. **Custom hooks** (`src/hooks/`) — TanStack Query wrappers around API client functions. Depends on API client and types.
6. **Analysis step components** (`src/components/analysis/`) — extracted from Analysis.tsx. Depend only on types for props, and UI primitives.
7. **Page-level refactors** (`src/pages/`) — now thin composition. Depend on hooks and components built in steps 5-6.
8. **Tests** — added alongside or after each layer. Services are tested first because they are pure; components tested last.

---

## Sources

- [Clean Architecture in Node.js with TypeScript — Alex Rusin Blog](https://blog.alexrusin.com/clean-architecture-in-nodejs-implementing-the-repository-pattern-with-typescript-and-prisma/)
- [Why Separate Controllers from Services — Corey Cleary](https://www.coreycleary.me/why-should-you-separate-controllers-from-services-in-node-rest-apis)
- [Express.js TypeScript REST API Architecture — Toptal](https://www.toptal.com/express-js/nodejs-typescript-rest-api-pt-2)
- [TanStack Query Reusable Custom Hooks — Roman Slonov](https://romanslonov.com/blog/tanstack-query-reusable-custom-hooks)
- [Separate API Layers in React Apps — Profy.dev](https://profy.dev/article/react-architecture-api-layer)
- [React Project Structure for Scale — developerway.com](https://www.developerway.com/posts/react-project-structure)
- [React Folder Structure in 5 Steps 2025 — Robin Wieruch](https://www.robinwieruch.de/react-folder-structure/)
- [Sharing Types Frontend/Backend — highlight.io](https://www.highlight.io/blog/keeping-your-frontend-and-backend-in-sync-with-a-monorepo)

---
*Architecture research for: React + Express full-stack SPA refactor (Sentence Scaffold)*
*Researched: 2026-03-10*
