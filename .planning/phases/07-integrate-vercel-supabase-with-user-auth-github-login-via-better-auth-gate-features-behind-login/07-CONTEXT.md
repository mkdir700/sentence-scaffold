# Phase 7: Integrate Vercel + Supabase with User Auth — Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate the entire application from Express + SQLite + Vite SPA to Next.js App Router + Supabase Postgres + Vercel deployment. Add user authentication via better-auth with GitHub OAuth. All features require login — Landing Page is the only public page.

This is a full architecture migration, not a feature addition. The existing React components will be fully rewritten to leverage Next.js patterns while preserving the same user-facing functionality (sentence analysis → 6-step walkthrough → save to library).

</domain>

<decisions>
## Implementation Decisions

### Database Migration
- Migrate from local SQLite (better-sqlite3) to Supabase Postgres
- Do NOT migrate existing data — start fresh with empty tables
- Keep the sentence caching mechanism in Supabase (avoid duplicate Gemini API calls)
- Cache table (sentences) is global/shared across users — same sentence analyzed once benefits all users
- saved_sentences and chunks tables get user_id foreign key — each user only sees their own saved items
- Use Supabase migrations (CLI) for schema management
- Access via @supabase/supabase-js SDK (REST API, not direct Postgres connection)

### Authentication & Login Experience
- better-auth library for authentication
- GitHub OAuth as the only login method (no email/password, no Google)
- Database sessions stored in Supabase (better-auth default, server-side controllable)
- better-auth built-in client (createAuthClient()) on the frontend — no custom React Context wrapper
- Login page: centered card with app logo + "Sign in with GitHub" button
- Post-login redirect: Home page (sentence input)
- Logout behavior: redirect to Landing Page
- Header: GitHub avatar on the right, click to show dropdown menu (logout, etc.)

### Deployment Architecture
- Full rewrite from Express + Vite SPA to Next.js App Router
- Deploy on Vercel (Next.js native platform)
- All existing React components will be fully rewritten (not ported)
- Keep TanStack Query for client-side server state management in Client Components
- Adopt shadcn/ui as the component library (replacing hand-written Button, Card, Badge, Input)
- API routes become Next.js Route Handlers (app/api/*)
- Express server.ts is fully retired

### Access Control
- Full-site login gate — all functionality requires authentication
- Landing Page is the only publicly accessible page (product intro + login CTA)
- Frontend protection: Next.js middleware.ts intercepts unauthenticated access and redirects to login
- API protection: middleware on all API routes, return 401 for unauthenticated requests
- Frontend handles 401 responses by redirecting to login page

### Claude's Discretion
- Landing Page content and layout design
- Exact dropdown menu items beyond logout
- shadcn/ui component selection and configuration
- Next.js project structure conventions (route groups, layouts)
- Supabase RLS (Row Level Security) policy specifics
- Error handling patterns in the new architecture
- Loading states and skeleton designs during auth checks

</decisions>

<specifics>
## Specific Ideas

- Landing Page should be simple and clean — brief product description + "Sign in with GitHub" button, consistent with the app's "Elegant · Clean · Modern" brand personality
- Login card: centered, app logo (BookOpen icon + "Sentence Scaffold"), single GitHub sign-in button
- User avatar in header mirrors the existing nav pattern (logo left, nav center/right)
- The app's Notion-inspired aesthetic should carry through to auth pages (whitespace, minimal chrome)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- **UI component patterns**: Button, Card, Badge, Input exist but will be replaced by shadcn/ui equivalents
- **TanStack Query hooks**: Current hooks pattern (queryOptions, mutations) can be adapted for Next.js Client Components
- **API client pattern**: src/lib/api.ts thin wrapper pattern is a good model for the new Supabase-backed API layer
- **Zod schemas**: src/types/index.ts Zod schemas for AnalysisResult, practice fields, etc. carry over directly
- **AI service**: src/services/ai.ts Gemini integration logic is reusable (just needs new import paths)

### Established Patterns
- Three-layer backend: routes/controllers/services — maps to Next.js Route Handlers + service functions
- TanStack Query with queryOptions pattern — continues in Client Components
- Zod validation at API boundaries — continues with Route Handler request validation
- Component decomposition: Analysis step components (StepSkeleton, StepModifiers, etc.) — rewrite but same structure

### Integration Points
- **Supabase**: Replaces better-sqlite3 db singleton — service functions need Supabase client instead of db.prepare()
- **better-auth**: New auth layer wrapping the entire app — middleware.ts + API route handler
- **Next.js routing**: Replace React Router with file-system routing (app/ directory)
- **Vercel deployment**: vercel.json or next.config.js for deployment configuration
- **Environment variables**: GEMINI_API_KEY + new Supabase/auth env vars

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-integrate-vercel-supabase-with-user-auth-github-login-via-better-auth-gate-features-behind-login*
*Context gathered: 2026-03-10*
