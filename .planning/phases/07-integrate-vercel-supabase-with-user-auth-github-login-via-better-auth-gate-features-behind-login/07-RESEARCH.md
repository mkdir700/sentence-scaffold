# Phase 7: Integrate Vercel + Supabase with User Auth — Research

**Researched:** 2026-03-10
**Domain:** Full-stack migration — Next.js App Router, Supabase Postgres, better-auth, Vercel
**Confidence:** HIGH (core patterns), MEDIUM (better-auth + Supabase direct connection specifics)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Database Migration**
- Migrate from local SQLite (better-sqlite3) to Supabase Postgres
- Do NOT migrate existing data — start fresh with empty tables
- Keep the sentence caching mechanism in Supabase (avoid duplicate Gemini API calls)
- Cache table (sentences) is global/shared across users — same sentence analyzed once benefits all users
- saved_sentences and chunks tables get user_id foreign key — each user only sees their own saved items
- Use Supabase migrations (CLI) for schema management
- Access via @supabase/supabase-js SDK (REST API, not direct Postgres connection)

**Authentication & Login Experience**
- better-auth library for authentication
- GitHub OAuth as the only login method (no email/password, no Google)
- Database sessions stored in Supabase (better-auth default, server-side controllable)
- better-auth built-in client (createAuthClient()) on the frontend — no custom React Context wrapper
- Login page: centered card with app logo + "Sign in with GitHub" button
- Post-login redirect: Home page (sentence input)
- Logout behavior: redirect to Landing Page
- Header: GitHub avatar on the right, click to show dropdown menu (logout, etc.)

**Deployment Architecture**
- Full rewrite from Express + Vite SPA to Next.js App Router
- Deploy on Vercel (Next.js native platform)
- All existing React components will be fully rewritten (not ported)
- Keep TanStack Query for client-side server state management in Client Components
- Adopt shadcn/ui as the component library (replacing hand-written Button, Card, Badge, Input)
- API routes become Next.js Route Handlers (app/api/*)
- Express server.ts is fully retired

**Access Control**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

## Summary

This phase is a complete architecture rewrite — retiring Express + SQLite + Vite SPA and replacing it with Next.js 15 App Router + Supabase Postgres + better-auth + Vercel. The existing React component logic, TanStack Query patterns, Zod schemas, and Gemini AI service are all reusable assets, but they must be rewritten into Next.js patterns (Server Components, Route Handlers, Client Components with `"use client"`).

The key architectural decision is that **better-auth owns authentication** (using Supabase Postgres as its database via direct `pg` connection), while **@supabase/supabase-js owns application data** (sentences, saved_sentences, chunks). These are two separate clients accessing the same Supabase Postgres database for different purposes. better-auth handles its own tables (user, session, account); the app data tables use @supabase/supabase-js SDK with RLS policies.

The migration requires: (1) scaffolding a new Next.js project from scratch, (2) setting up both Supabase clients (browser + server) and better-auth, (3) migrating the 3-table SQLite schema to Supabase Postgres with user_id columns, (4) rewriting all React components into Next.js App Router conventions, and (5) deploying to Vercel.

**Primary recommendation:** Scaffold the new Next.js project fresh (`create-next-app`), initialize shadcn/ui, then migrate each feature layer (auth, data access, components, routes) in sequence.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | App Router framework, SSR, Route Handlers | Vercel-native, App Router is current standard |
| better-auth | latest (^1.x) | Authentication with GitHub OAuth | Replaces custom auth; handles sessions, OAuth, DB tables |
| @supabase/supabase-js | ^2.x | Application data operations (REST API to Supabase) | Official Supabase JS SDK |
| @supabase/ssr | ^0.x | SSR-compatible Supabase clients (browser + server) | Official package for cookie-based auth in SSR contexts |
| shadcn/ui | latest | Component library — Button, Card, Badge, Input, Avatar, DropdownMenu | Copy-to-codebase pattern, Tailwind v4 native |
| @tanstack/react-query | ^5.x | Client-side server state management | Already in project; continues in Client Components |
| tailwindcss | ^4.x | Utility CSS | Already in project (v4) |
| pg | ^8.x | PostgreSQL client for better-auth database connection | better-auth uses pg.Pool for direct Postgres access |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.x | Icons (BookOpen, Github, ChevronDown, etc.) | Already in project; continue using |
| zod | ^4.x | Schema validation | Already in project; continues at API boundaries |
| @google/genai | ^1.x | Gemini API | Already in project; migrate ai.ts to Next.js |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| better-auth | NextAuth / Auth.js | Auth.js Supabase adapter is community-maintained; better-auth is more modern and type-safe |
| better-auth | Supabase Auth | Locked decision — better-auth was explicitly chosen |
| @supabase/supabase-js | direct pg queries | SDK provides cleaner API with RLS integration; locked decision |

**Installation (new Next.js project):**
```bash
npx create-next-app@latest sentence-scaffold-next --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd sentence-scaffold-next
npx shadcn@latest init
npm install better-auth pg @supabase/supabase-js @supabase/ssr @tanstack/react-query @tanstack/react-query-devtools @google/genai zod lucide-react
npm install -D @types/pg
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (public)/                   # Public route group (no auth required)
│   │   ├── page.tsx                # Landing page (/)
│   │   └── layout.tsx              # Minimal public layout
│   ├── (auth)/                     # Auth route group
│   │   ├── login/page.tsx          # Login page with GitHub button
│   │   └── layout.tsx              # Centered card layout
│   ├── (protected)/                # All authenticated routes
│   │   ├── home/page.tsx           # Sentence input (/home)
│   │   ├── analysis/[id]/page.tsx  # Analysis view (/analysis/:id)
│   │   ├── library/page.tsx        # Saved sentences (/library)
│   │   └── layout.tsx              # Layout with Header (auth check)
│   └── api/
│       ├── auth/[...all]/route.ts  # better-auth handler
│       ├── analysis/route.ts       # POST: analyze sentence
│       ├── analysis/[id]/route.ts  # GET: fetch analysis by id
│       ├── library/route.ts        # GET: saved sentences, POST: save
│       ├── library/[id]/route.ts   # DELETE: remove saved sentence
│       └── feedback/route.ts       # POST: AI feedback on translation
├── components/
│   ├── ui/                         # shadcn/ui components (auto-generated)
│   ├── analysis/                   # Step components (StepSkeleton, etc.)
│   ├── Header.tsx                  # App header with user avatar + dropdown
│   └── Providers.tsx               # QueryClientProvider wrapper
├── lib/
│   ├── auth.ts                     # better-auth server config
│   ├── auth-client.ts              # better-auth client (createAuthClient)
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client (cookie-based)
│   ├── api.ts                      # Client-side API fetch wrappers
│   └── utils.ts                    # cn() utility (from shadcn)
├── services/                       # Server-side business logic
│   ├── ai.ts                       # Gemini AI (migrated from src/services/ai.ts)
│   ├── analysis.ts                 # Analysis CRUD (Supabase)
│   ├── library.ts                  # Saved sentences CRUD (Supabase)
│   └── chunks.ts                   # Chunks CRUD (Supabase)
├── types/
│   ├── index.ts                    # Zod schemas + inferred types (migrated)
│   └── database.ts                 # Supabase row type interfaces
└── middleware.ts                   # Route protection (better-auth session cookie)
```

### Pattern 1: better-auth Server Configuration
**What:** Central auth config with GitHub OAuth and Postgres database via pg.Pool
**When to use:** Single source of auth truth for all server-side session access

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL, // Supabase direct connection (port 5432)
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — reduce DB lookups
    },
  },
});
```

```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Pattern 2: better-auth Client (Frontend)
**What:** Reactive session state for Client Components
**When to use:** Any Client Component needing user session

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
export const { useSession, signIn, signOut } = authClient;
```

```typescript
// Usage in Client Component
"use client";
import { signIn, signOut, useSession } from "@/lib/auth-client";

// Sign in with GitHub
<button onClick={() => signIn.social({ provider: "github", callbackURL: "/home" })}>
  Sign in with GitHub
</button>

// Sign out with redirect
<button onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}>
  Sign Out
</button>
```

### Pattern 3: Next.js Middleware for Route Protection
**What:** Optimistic cookie-based redirect for unauthenticated users
**When to use:** All routes except public ones; does NOT replace server-side validation

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow better-auth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Public paths — no auth needed
  const publicPaths = ["/", "/login"];
  if (publicPaths.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Optimistic check (cookie existence only — NOT cryptographically verified)
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
```

**CRITICAL:** The middleware uses `getSessionCookie` which only checks cookie existence — it does NOT validate the session against the database. Every Route Handler and Server Component must still call `auth.api.getSession({ headers: await headers() })` to verify the session.

### Pattern 4: Server-Side Session Validation
**What:** Full database-verified session check in Server Components and Route Handlers
**When to use:** Every protected page and API endpoint

```typescript
// In Server Component (protected page)
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  return <div>Welcome {session.user.name}</div>;
}
```

```typescript
// In Route Handler (API protection)
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // proceed with authenticated operation
}
```

### Pattern 5: Supabase Clients (Two Separate Clients)
**What:** Browser client for Client Components; Server client for Server Components + Route Handlers
**When to use:** All application data operations (NOT for auth — better-auth handles that)

```typescript
// src/lib/supabase/client.ts — Browser client
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// src/lib/supabase/server.ts — Server client (cookie-based session)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}
```

**NOTE on auth conflict:** The project uses better-auth for authentication, NOT Supabase Auth. The `@supabase/supabase-js` client is used only for data operations (sentences, saved_sentences, chunks). Do NOT use Supabase Auth features. The `anon` key with RLS policies is the correct security model for data access.

### Pattern 6: Supabase Schema with user_id
**What:** New Postgres schema migrating from SQLite with user ownership
**When to use:** Fresh tables created via Supabase CLI migrations

```sql
-- supabase/migrations/001_initial_schema.sql

-- Shared cache table (global — no user ownership)
CREATE TABLE sentences (
  id BIGSERIAL PRIMARY KEY,
  text TEXT UNIQUE NOT NULL,
  analysis_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-owned tables
CREATE TABLE saved_sentences (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,          -- better-auth user.id (TEXT, not UUID)
  sentence_id BIGINT NOT NULL REFERENCES sentences(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sentence_id)    -- prevent duplicate saves
);

CREATE TABLE chunks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,          -- better-auth user.id
  expression TEXT NOT NULL,
  meaning TEXT NOT NULL,
  pattern TEXT,
  examples JSONB,
  source_sentence_id BIGINT REFERENCES sentences(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_saved_sentences_user_id ON saved_sentences(user_id);
CREATE INDEX idx_chunks_user_id ON chunks(user_id);
```

### Pattern 7: TanStack Query in Next.js App Router
**What:** QueryClient wrapped in a Client Component provider; used only in Client Components
**When to use:** Any data fetching that benefits from caching, optimistic updates, or background refresh

```typescript
// src/components/Providers.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60 * 1000, retry: 1 },
    },
  }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

```typescript
// src/app/layout.tsx (root layout)
import { Providers } from "@/components/Providers";

export default function RootLayout({ children }) {
  return (
    <html><body>
      <Providers>{children}</Providers>
    </body></html>
  );
}
```

### Anti-Patterns to Avoid
- **Using `supabase.auth.getSession()` for security checks:** Use `auth.api.getSession()` (better-auth) or `supabase.auth.getUser()` if using Supabase Auth — but since we use better-auth, never call Supabase Auth methods at all.
- **Using Supabase connection pooler (port 6543) for better-auth pg.Pool:** The pooler doesn't support prepared statements. Use direct connection (port 5432) for better-auth.
- **Sharing the QueryClient instance across requests:** Create QueryClient inside `useState` or per-request to avoid cross-request data leaking.
- **Mixing better-auth user IDs with Supabase Auth UIDs:** better-auth creates its own `user` table. The `user_id` column in app tables will be better-auth's TEXT ID, not a Supabase Auth UUID. They are different.
- **Creating a single Server Component Supabase client outside cookies():** Supabase server client must be created inside the request context where `cookies()` is available.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow + session management | Custom OAuth redirect handler + JWT storage | better-auth | OAuth PKCE, token refresh, session rotation, CSRF protection are handled |
| Component primitives (Button, Card, Input, Avatar, DropdownMenu) | Custom-styled HTML elements | shadcn/ui | Already handles Radix accessibility primitives, dark mode, variant system |
| Middleware session cookie checking | Custom cookie parse + base64 decode | `getSessionCookie(request)` from `better-auth/cookies` | Handles cookie prefix, signing, name conventions |
| Database schema migration | Manual SQL via Supabase dashboard | Supabase CLI `supabase migration new` + `supabase db push` | Version-controlled, repeatable, reviewable |
| better-auth schema setup | Manual CREATE TABLE for user/session/account | `npx auth@latest migrate` | Auto-generates correct schema including FK constraints |
| Client-side SSR data hydration | Manual `useEffect` + `useState` fetch | TanStack Query `useQuery` + `queryOptions` | Handles loading, error, stale, background refresh states |

**Key insight:** better-auth generates its own tables independently of the app tables. Running `npx auth@latest migrate` creates `user`, `session`, `account`, `verification` in Supabase Postgres. This is separate from the Supabase CLI migrations for app tables.

---

## Common Pitfalls

### Pitfall 1: better-auth pg.Pool vs Supabase Pooler Connection String
**What goes wrong:** Using Supabase's connection pooler URL (port 6543) for better-auth's `pg.Pool` causes "prepared statement does not exist" errors.
**Why it happens:** The Supabase pooler (PgBouncer) runs in transaction mode by default, which doesn't support persistent prepared statements.
**How to avoid:** Use the **direct connection** URL (port 5432) from Supabase dashboard → Settings → Database → "Direct connection". Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
**Warning signs:** `error: prepared statement "s0" does not exist` in better-auth operations.

### Pitfall 2: Two separate auth systems — don't conflate user IDs
**What goes wrong:** Storing Supabase Auth UUID in `user_id` column but using better-auth's TEXT ID in queries, causing FK mismatches.
**Why it happens:** Supabase Auth and better-auth are completely independent; they each manage their own user table with different ID formats.
**How to avoid:** better-auth creates a `user` table with TEXT IDs. All `user_id` columns in app tables reference better-auth's user ID. Never call any `supabase.auth.*` methods — only call `auth.api.getSession()` from better-auth.
**Warning signs:** Empty query results when filtering by `user_id`; FK violations on insert.

### Pitfall 3: Next.js Middleware only does optimistic checks
**What goes wrong:** Treating `getSessionCookie()` in middleware as a security guarantee; skipping server-side `auth.api.getSession()` on Route Handlers.
**Why it happens:** Next.js middleware runs on the Edge runtime; better-auth's full session validation requires Node.js runtime (DB query).
**How to avoid:** Always call `auth.api.getSession({ headers: await headers() })` in every Route Handler and protected Server Component. Middleware is only for UX redirects.
**Warning signs:** Authenticated-looking cookies returning stale/invalid session data; forged cookie bypass.

### Pitfall 4: `NEXT_PUBLIC_` prefix exposes secrets
**What goes wrong:** Adding `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_BETTER_AUTH_SECRET` exposes them in client bundle.
**Why it happens:** `NEXT_PUBLIC_` prefix embeds variable value into client-side JavaScript at build time.
**How to avoid:** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` should have the `NEXT_PUBLIC_` prefix. All other keys (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) must NOT have the prefix.
**Warning signs:** API keys visible in browser network tab or browser console.

### Pitfall 5: React component `"use client"` boundary placement
**What goes wrong:** Marking too many components as Client Components, losing SSR benefits; or marking too few, causing "cannot use hooks in Server Component" errors.
**Why it happens:** Next.js App Router defaults to Server Components; interactive hooks require Client Components.
**How to avoid:** Mark only leaf components that use hooks (`useSession`, `useQuery`, `useState`, event handlers) as `"use client"`. Keep layouts and data-fetching wrappers as Server Components.
**Warning signs:** `Error: Hooks can only be called inside of a body of a function component` in server-rendered components.

### Pitfall 6: better-auth schema migration vs Supabase migration separation
**What goes wrong:** Running `npx auth@latest migrate` against the Supabase connection creates `user`/`session`/`account` tables, but app tables (`sentences`, `saved_sentences`, `chunks`) need separate Supabase CLI migration files.
**Why it happens:** Two different migration systems for two different concerns.
**How to avoid:** Run `npx auth@latest migrate` once to create better-auth tables. Create separate `supabase/migrations/*.sql` files for app tables. Keep them in version control separately.
**Warning signs:** App tables missing after running better-auth migrate, or vice versa.

### Pitfall 7: Supabase RLS blocks all operations by default
**What goes wrong:** After enabling RLS on `saved_sentences` or `chunks`, all SELECT/INSERT operations return empty or fail, even when authenticated.
**Why it happens:** RLS default is DENY ALL once enabled. Policies must be explicitly created.
**How to avoid:** For each user-owned table, create policies using `auth.uid()` — but since we use better-auth (not Supabase Auth), `auth.uid()` won't match. Instead, pass the better-auth user ID via the anon key and RLS `current_setting` or pass user context via service role from Route Handlers.
**How to handle:** Two options — (a) use the Supabase service role key only in Route Handlers (bypasses RLS) and validate better-auth session there, or (b) use RLS with custom claims. **Option (a) is simpler for this project.** See Code Examples section.

---

## Code Examples

### better-auth: Get session in Route Handler
```typescript
// Source: https://better-auth.com/docs/integrations/next
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id; // better-auth user ID (TEXT)
  // ... proceed
}
```

### Supabase server client in Route Handler (data operations)
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_sentences")
    .select("*, sentences(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  // ...
}
```

### Supabase service role client (bypasses RLS — server-only)
```typescript
// Source: https://adrianmurage.com/posts/supabase-service-role-secret-key/
import { createClient } from "@supabase/supabase-js";

// Create once, never expose to client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
```

### GitHub sign-in button (Client Component)
```typescript
// Source: https://better-auth.com/docs/basic-usage
"use client";
import { signIn } from "@/lib/auth-client";

export function GitHubSignInButton() {
  return (
    <button
      onClick={() => signIn.social({
        provider: "github",
        callbackURL: "/home",
      })}
    >
      Sign in with GitHub
    </button>
  );
}
```

### Header with avatar + sign out dropdown (Client Component)
```typescript
// Pattern: better-auth useSession + shadcn DropdownMenu + Avatar
"use client";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={session.user.image ?? undefined} />
          <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => signOut({
            fetchOptions: { onSuccess: () => router.push("/") }
          })}
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### TanStack Query mutation with 401 redirect
```typescript
// Pattern: mutation that catches 401 and redirects
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useSaveToLibrary() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (sentenceId: number) => {
      const res = await fetch("/api/library", {
        method: "POST",
        body: JSON.stringify({ sentenceId }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 401) {
        router.push("/login");
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | auth-helpers deprecated; ssr is the standard |
| Express + custom auth middleware | Next.js Route Handlers + better-auth | 2024-2025 | Simplifies deployment, removes separate server process |
| Pages Router (`_app.tsx`) | App Router (`app/` directory) | Next.js 13+, standard 2024 | Server Components, better performance, streaming |
| Tailwind v3 config (`tailwind.config.ts`) | Tailwind v4 CSS-native (`@theme`) | Feb 2025 | No config file needed; shadcn auto-configures |
| `emailVerified` → `email_verified` (camelCase DB column) | better-auth converts camelCase to snake_case by default | latest | Column names in DB are snake_case; JS types are camelCase |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated — use `@supabase/ssr` instead
- `supabase.auth.getSession()` for security: Insecure — use `supabase.auth.getUser()` (or in this project, better-auth's `auth.api.getSession()`)
- Next.js Pages Router: In maintenance mode — not applicable for new projects

---

## Open Questions

1. **RLS strategy: service role vs user context for app data tables**
   - What we know: better-auth user IDs are TEXT strings; Supabase RLS `auth.uid()` returns Supabase Auth UUIDs which are irrelevant
   - What's unclear: Whether to configure RLS policies with custom JWT claims (complex) or just use service role key in Route Handlers (simpler)
   - Recommendation: Use service role key (`SUPABASE_SERVICE_ROLE_KEY`) exclusively in server-side Route Handlers. Validate better-auth session first, then use service role client for data operations. This is simpler and more direct than configuring custom JWT claims.

2. **better-auth schema migration command authentication**
   - What we know: `npx auth@latest migrate` connects to Postgres directly via `DATABASE_URL`
   - What's unclear: Whether it requires the direct connection (port 5432) or works with the pooler
   - Recommendation: Use direct connection URL (port 5432) for all better-auth operations including `npx auth@latest migrate`.

3. **Supabase `sentences` table — anon key vs service role for cache reads**
   - What we know: `sentences` is a global shared cache; any authenticated user should be able to read and write it
   - What's unclear: Whether to enable RLS with open policies (authenticated can read/write) or use service role
   - Recommendation: Use service role client in Route Handlers for all Supabase data operations. Keeps auth simple — better-auth session = authenticated = allowed. No RLS configuration needed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already configured in project) |
| Config file | `vitest.config.ts` (existing — will need update for new project structure) |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --coverage` |

**Note:** This is a full project rewrite. The existing test files in `server/services/*.test.ts` will be the basis for new service layer tests. The new project needs fresh vitest configuration for Next.js (use `@vitejs/plugin-react` or switch to Jest if needed).

### Phase Requirements → Test Map
| Behavior | Test Type | Automated Command | Notes |
|----------|-----------|-------------------|-------|
| better-auth session validation in Route Handlers | unit (mocked) | `npm test -- api/` | Mock `auth.api.getSession` |
| Supabase data operations (analysis, library, chunks) | unit (mocked Supabase) | `npm test -- services/` | Mock supabase client |
| Middleware redirects unauthenticated requests | unit | `npm test -- middleware` | Mock `getSessionCookie` |
| AI service (Gemini) | unit (mocked) | `npm test -- ai.test` | Existing pattern continues |

### Wave 0 Gaps
- [ ] `src/lib/auth.ts` — better-auth config (must exist before any auth tests)
- [ ] `src/lib/supabase/server.ts` — server client (must exist before service tests)
- [ ] New `vitest.config.ts` for Next.js project structure
- [ ] `src/middleware.ts` — route protection (needed for middleware tests)

---

## Sources

### Primary (HIGH confidence)
- [https://better-auth.com/docs/integrations/next](https://better-auth.com/docs/integrations/next) — Next.js integration patterns, API route setup, middleware
- [https://better-auth.com/docs/installation](https://better-auth.com/docs/installation) — Install steps, env vars, schema migration
- [https://better-auth.com/docs/adapters/postgresql](https://better-auth.com/docs/adapters/postgresql) — PostgreSQL with pg.Pool
- [https://supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs) — @supabase/ssr client patterns
- [https://supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policies
- [https://ui.shadcn.com/docs/installation/next](https://ui.shadcn.com/docs/installation/next) — shadcn/ui Next.js setup
- [https://nextjs.org/docs/app/getting-started/project-structure](https://nextjs.org/docs/app/getting-started/project-structure) — Route groups, file conventions

### Secondary (MEDIUM confidence)
- [https://tanstack.com/query/v5/docs/framework/react/guides/ssr](https://tanstack.com/query/v5/docs/framework/react/guides/ssr) — TanStack Query SSR patterns
- [https://adrianmurage.com/posts/supabase-service-role-secret-key/](https://adrianmurage.com/posts/supabase-service-role-secret-key/) — Service role key in Next.js Route Handlers
- [https://ckriswinarto.medium.com/how-to-add-github-login-to-your-next-js-app-with-better-auth-71c359e20318](https://ckriswinarto.medium.com/how-to-add-github-login-to-your-next-js-app-with-better-auth-71c359e20318) — GitHub login walkthrough

### Tertiary (LOW confidence)
- Community patterns for better-auth + Supabase direct (pg Pool) connection — verified conceptually but no official Supabase-better-auth integration doc exists

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are current, official docs confirm versions and patterns
- Architecture: HIGH — Next.js App Router route groups, layouts, Client/Server component patterns are well-documented
- better-auth core setup: HIGH — official docs confirmed API route, middleware, client patterns
- better-auth + Supabase data (pg.Pool vs @supabase/supabase-js split): MEDIUM — architecture is sound but has no single "official" reference combining these two specifically
- RLS strategy: MEDIUM — service role approach is documented but the "use service role always" decision is a project choice, not a documented best practice
- Pitfalls: HIGH — all based on official docs warnings or verified community reports

**Research date:** 2026-03-10
**Valid until:** 2026-06-10 (stable libraries; shadcn/ui updates frequently but not breaking)
