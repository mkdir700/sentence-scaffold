# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5.8.2 - Full codebase (frontend and backend)
- JSX/TSX - React components

**Secondary:**
- JavaScript - Runtime execution via Node.js

## Runtime

**Environment:**
- Node.js (no specific version pinned, but supports ES2022+ features)
- Module system: ES modules (`"type": "module"` in `package.json`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.0.0 - UI framework for frontend components
- Express 4.21.2 - Backend API server for handling routes

**Frontend Routing:**
- React Router 7.13.1 - Client-side routing and navigation

**Build & Dev:**
- Vite 6.2.0 - Development server and production bundler
- @vitejs/plugin-react 5.0.4 - React support for Vite
- tsx 4.21.0 - TypeScript execution for server.ts in development

**Styling:**
- Tailwind CSS 4.1.14 - Utility-first CSS framework
- @tailwindcss/vite 4.1.14 - Vite integration for Tailwind CSS
- autoprefixer 10.4.21 - CSS vendor prefixing

## Key Dependencies

**Critical:**
- @google/genai 1.29.0 - Google Gemini AI API client for sentence analysis
- better-sqlite3 12.4.1 - Embedded SQLite database (synchronous operations)
- dotenv 17.2.3 - Environment variable loading from .env files

**UI & Utilities:**
- lucide-react 0.546.0 - Icon library for React components
- motion 12.23.24 - Animation library for smooth transitions
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.5.0 - Merges Tailwind CSS classes intelligently

**Backend:**
- express.json middleware - Built-in request body parsing

## Configuration

**Environment:**
- Configuration via `.env.local` (development) or `.env` (production)
- Critical variables: `GEMINI_API_KEY`, `APP_URL`
- See `.env.example` for template
- Vite loads environment variables via `loadEnv()` in `vite.config.ts`

**Build:**
- `vite.config.ts` - Vite configuration with React and Tailwind plugins
- `tsconfig.json` - TypeScript configuration with JSX support
  - Target: ES2022
  - Module resolution: bundler (for Vite)
  - Path alias: `@/*` maps to project root

**Development:**
- HMR (Hot Module Replacement) supported but can be disabled via `DISABLE_HMR` env var
- Used in AI Studio environment where file watching is disabled during agent edits

## Platform Requirements

**Development:**
- Node.js runtime
- npm or compatible package manager
- Access to Gemini AI API (requires `GEMINI_API_KEY`)

**Production:**
- Node.js runtime
- Vite-built static files in `dist/` directory
- Express.js server running on port 3000
- SQLite database file storage in `data/app.db`

## Scripts

**Development:**
```bash
npm run dev        # Run server.ts with tsx (development server on port 3000)
npm run lint       # Run TypeScript type checking
```

**Production:**
```bash
npm run build      # Vite build to dist/
npm start          # Run compiled server.ts with Node.js
npm run preview    # Preview production build locally
npm run clean      # Clean dist/ directory
```

---

*Stack analysis: 2026-03-10*
