# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `Home.tsx`, `Analysis.tsx`, `Button.tsx`)
- Utility/service files: camelCase (e.g., `utils.ts`, `ai.ts`)
- UI component files: PascalCase (e.g., `card.tsx`, `button.tsx`)
- Database files: camelCase (e.g., `index.ts`)
- Server file: camelCase (e.g., `server.ts`)

**Functions:**
- React components: PascalCase for default exports (`export default function Home() {}`)
- Regular functions: camelCase (e.g., `analyzeSentence()`, `handleAnalyze()`, `handleSaveSentence()`)
- Event handlers: camelCase with `handle` prefix (e.g., `handleAnalyze`, `handleSaveChunk`, `handleNextStep`)
- Helper functions: camelCase (e.g., `cn()`)

**Variables:**
- State variables: camelCase (e.g., `sentence`, `isLoading`, `history`, `savedChunks`)
- Constants: camelCase (e.g., `analysisSchema`, `exampleSentences`)
- React hooks: camelCase (e.g., `useState`, `useEffect`, `useNavigate`, `useLocation`)
- Types/Interfaces: PascalCase (e.g., `ButtonProps`)

**Types:**
- Interfaces: PascalCase with `Props` suffix for component props (e.g., `ButtonProps`)
- Union types: snake_case or PascalCase depending on use (e.g., `"history" | "saved" | "chunks"`)
- Type imports: `import { Type } from "@google/genai"`

## Code Style

**Formatting:**
- No explicit formatter configured (no .prettierrc or eslint config files detected)
- Indentation: 2 spaces (observed consistently throughout codebase)
- Quotes: Double quotes for strings and JSX attributes
- Semicolons: Present at end of statements

**Linting:**
- TypeScript strict mode: `tsc --noEmit` lint script present in package.json
- TypeScript target: ES2022
- Module: ESNext
- No ESLint or Prettier configuration detected
- Build tool: Vite with React plugin

**Observed Style Patterns:**
- Descriptive naming for handlers and functions
- Comments used sparingly, only for non-obvious logic
- Tailwind CSS for styling (extensive use of `className` attributes)
- Inline styles avoided in favor of Tailwind utilities

## Import Organization

**Order:**
1. React imports and hooks from 'react' (e.g., `import { useState, useEffect } from "react"`)
2. React Router imports (e.g., `import { Routes, Route, Link } from "react-router"`)
3. Internal components from absolute paths with `@/` alias (e.g., `import { Button } from "@/src/components/ui/button"`)
4. Icon libraries (e.g., `import { ArrowRight, Loader2 } from "lucide-react"`)
5. External utilities or services (e.g., `import { GoogleGenAI } from "@google/genai"`)

**Path Aliases:**
- `@/` resolves to project root (configured in `tsconfig.json`)
- Used consistently: `@/src/components/ui/button`, `@/src/services/ai`, `@/src/lib/utils`
- All imports use full path from root, not relative paths

**Example from codebase:**
```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { analyzeSentence } from "@/src/services/ai";
```

## Error Handling

**Patterns:**
- Try-catch blocks used in async operations (seen in `Home.tsx` and `server.ts`)
- `console.error()` for error logging
- User alerts via `alert()` for user-facing errors
- Express error handling: status codes with JSON error responses
- Early returns for validation checks

**Example from server.ts:**
```typescript
try {
  const { sentence } = req.body;
  if (!sentence) {
    return res.status(400).json({ error: 'Sentence is required' });
  }
  // ... operation
} catch (error: any) {
  res.status(500).json({ error: error.message });
}
```

**Example from client:**
```typescript
try {
  // async operation
  data = await analyzeSentence(sentence);
} catch (error) {
  console.error(error);
  alert("Failed to analyze sentence. Please try again.");
} finally {
  setIsLoading(false);
}
```

## Logging

**Framework:** Native `console` object

**Patterns:**
- `console.error()` for error logging
- Used in catch blocks and error handlers
- No structured logging library (winston, pino, etc.) detected
- Minimal logging - only on errors, no info/debug logging observed

**Example:**
```typescript
.catch(console.error);
```

## Comments

**When to Comment:**
- Very few comments observed in codebase
- Comments used for section markers (e.g., `{/* Step 1: Sentence Type & Main Clause */}`)
- System instructions documented in AI schema prompts
- Database initialization documented via SQL comments
- Comments rare; code is self-documenting through clear naming

**JSDoc/TSDoc:**
- Not observed in current codebase
- TypeScript interfaces documented with inline type annotations only

## Function Design

**Size:** Functions are moderate to large, ranging from 5-100+ lines
- Example: `Home()` component is ~169 lines including full form, history, and examples
- Example: `Analysis()` component is ~460 lines including multiple step sections
- Large components justified by self-contained UI logic

**Parameters:**
- React components: destructure props at function signature
- Regular functions: accept single or multiple parameters as needed
- Event handlers: use both implicit event parameter and explicit function parameters

**Example of parameter patterns:**
```typescript
// Component with destructured props
export default function Home() { ... }

// Function with parameters
export async function analyzeSentence(sentence: string) { ... }

// Event handler with both event and explicit data
const handleAnalyze = async (e?: React.FormEvent) => { ... }
const handleSaveChunk = async (chunk: any, index: number) => { ... }
```

**Return Values:**
- React components return JSX
- Async functions return promises
- Database operations return results from prepared statements
- Event handlers typically return void or nothing
- Some functions throw errors on failure

## Module Design

**Exports:**
- Default exports for React components (e.g., `export default function Home() {}`)
- Named exports for UI components (e.g., `export { Button }; export { Card, CardHeader, CardTitle, CardContent };`)
- Named exports for utilities and services (e.g., `export async function analyzeSentence()`)
- Named exports for database instance (e.g., `export const db = new Database(...)`)

**Barrel Files:**
- Not extensively used - UI components export directly from individual files
- Each UI component file exports all related components (card.tsx exports Card, CardHeader, CardTitle, CardContent)

**Component Composition:**
- Functional components exclusively (no class components)
- React.forwardRef used for UI components that need ref forwarding (Button, Card components)
- Component prop spread pattern for extensibility (`...props`)

**Example from card.tsx:**
```typescript
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(...)} {...props} />
  )
);
Card.displayName = "Card";
```

## Type Safety

**TypeScript Configuration:**
- Target: ES2022
- Module: ESNext
- Strict mode enabled via `tsc --noEmit` linting
- Path aliases enabled with `@/*` mapping
- JSX: react-jsx (automatic JSX transform)

**Type Annotations:**
- Props interfaces use PascalCase + `Props` suffix
- Inline type annotations for state and parameters
- Use of `any` type observed in several places (e.g., `history: setHistory(data)` without specific typing)
- Partial typing: some areas use `any` for flexibility, others are strongly typed

**Example:**
```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}
```

## CSS and Styling

**Framework:** Tailwind CSS with Vite plugin

**Patterns:**
- Utility-first approach with Tailwind classes
- `cn()` helper function from `utils.ts` used for conditional class merging
- Class composition: `clsx()` and `twMerge()` combined in utils
- No CSS modules or scoped styles
- Responsive modifiers used (e.g., `md:grid-cols-2`, `md:w-1/3`)

**Example:**
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
className={cn(
  "text-sm font-medium",
  variant === "default" && "bg-zinc-900 text-zinc-50",
  className
)}
```

---

*Convention analysis: 2026-03-10*
