# Testing Patterns

**Analysis Date:** 2026-03-10

## Test Framework

**Status:** No testing framework configured

**Note:** No test files (`.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx`) detected in the codebase. No test dependencies (Jest, Vitest, etc.) present in `package.json`.

**Run Commands:**
```bash
npm run lint              # Run TypeScript type checking (only check currently)
npm run dev              # Run development server
npm run build            # Build for production
npm run preview          # Preview production build
```

**Current Testing Approach:**
- Manual testing via development server
- Type checking via TypeScript compiler: `tsc --noEmit`
- No automated test suite

## Test File Organization

**Current State:** Not applicable - no test files exist

**Recommended Structure for Future Tests:**
```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── button.test.tsx          # Co-located with component
│   │   ├── card.tsx
│   │   └── card.test.tsx
│   └── __tests__/                    # Alternative: centralized tests
├── services/
│   ├── ai.ts
│   └── ai.test.ts
├── lib/
│   ├── utils.ts
│   └── utils.test.ts
└── pages/
    ├── Home.tsx
    └── Home.test.tsx
```

## Error Handling in Code

**Current Patterns for Testing Purposes:**
Code uses error handling that would need testing:

**Client-side (React):**
```typescript
// From Home.tsx - handleAnalyze function
try {
  const checkRes = await fetch("/api/check-sentence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sentence }),
  });

  let data;
  if (checkRes.ok) {
    data = await checkRes.json();
  } else {
    // Analyze with AI on cache miss
    data = await analyzeSentence(sentence);
    await fetch("/api/save-sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence, analysis: data }),
    });
  }

  navigate("/analysis", { state: { analysis: data } });
} catch (error) {
  console.error(error);
  alert("Failed to analyze sentence. Please try again.");
} finally {
  setIsLoading(false);
}
```

**Server-side (Express):**
```typescript
// From server.ts
app.post('/api/check-sentence', (req, res) => {
  try {
    const { sentence } = req.body;
    if (!sentence) {
      return res.status(400).json({ error: 'Sentence is required' });
    }

    const existing = db.prepare('SELECT * FROM sentences WHERE text = ?').get(sentence) as any;
    if (existing) {
      return res.json(JSON.parse(existing.analysis_json));
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

## API Testing Scenarios (Implicit)

Based on code analysis, these areas would benefit from testing:

**Sentence Analysis Flow:**
1. User enters sentence → validates non-empty
2. Check if sentence already analyzed (GET /api/check-sentence)
3. If cached: return cached analysis
4. If not cached: call AI service → parse response → save to DB
5. Navigate to analysis page with results

**Database Operations:**
- Save sentence with analysis JSON
- Retrieve history (last 10 sentences)
- Save sentence to library
- Save expression chunks
- Retrieve all chunks

**Error Cases:**
- Empty sentence submission
- Missing API response
- Database write failures
- Malformed JSON responses
- Network failures

## Mocking Patterns (Anticipated)

**What Would Need Mocking:**
- Fetch API calls to backend endpoints
- AI service responses (GoogleGenAI)
- Database operations (better-sqlite3)
- React Router navigation
- useNavigate hook

**Example of how mocking would work:**
```typescript
// Mock fetch for API calls
global.fetch = jest.fn((url) => {
  if (url === '/api/check-sentence') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockAnalysisData)
    });
  }
  return Promise.reject(new Error('Not found'));
});

// Mock AI service
jest.mock('@/src/services/ai', () => ({
  analyzeSentence: jest.fn(() => Promise.resolve(mockAnalysisData))
}));

// Mock database
jest.mock('@/src/db/index', () => ({
  db: {
    prepare: jest.fn().mockReturnValue({
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn()
    })
  }
}));
```

## Components to Test

**High Priority:**
1. `Home.tsx` (`/home/wuy6/myprojects/sentence-scaffold/src/pages/Home.tsx`)
   - Form submission and validation
   - Loading state management
   - API call sequencing (check-sentence → analyze → save)
   - Navigation on success

2. `Analysis.tsx` (`/home/wuy6/myprojects/sentence-scaffold/src/pages/Analysis.tsx`)
   - Step-by-step UI progression
   - State management (current step, showAll toggle)
   - Save sentence functionality
   - Save chunk functionality

3. `analyzeSentence()` (`/home/wuy6/myprojects/sentence-scaffold/src/services/ai.ts`)
   - AI request formatting
   - Response parsing
   - Error handling for malformed responses

4. Server API endpoints (`/home/wuy6/myprojects/sentence-scaffold/server.ts`)
   - POST /api/check-sentence (cache lookup)
   - POST /api/save-sentence (persist to DB)
   - POST /api/save (add to saved library)
   - GET /api/history (retrieve recent)
   - POST /api/chunks (save expression chunks)

**Medium Priority:**
- UI components (Button, Card, Badge) for accessibility and rendering
- Utils function `cn()` for class merging edge cases
- Library page tab switching and data rendering

**Low Priority:**
- Database schema initialization (once-per-startup)
- Static page navigation

## Integration Test Scenarios

**End-to-end workflow:**
1. User enters sentence on Home page
2. System checks if already analyzed
3. If new: calls AI → saves to DB
4. Results displayed on Analysis page
5. User saves sentence to Library
6. Sentence appears in Library view

**Data persistence:**
1. Analyze sentence → saves to `sentences` table
2. Save sentence → adds to `saved_sentences` table
3. Save chunk → adds to `chunks` table
4. Data retrievable across sessions

## Coverage Gaps

**Currently Not Tested:**
- All client components lack unit tests
- All server API endpoints lack tests
- Integration between client and server untested
- Edge cases in AI response parsing untested
- Database schema untested
- Error paths largely untested

**Risk Areas:**
- User interaction flows depend on manual testing
- API contract changes would not be caught by tests
- Database migrations have no validation
- UI regressions would only be visible in manual testing

## Recommended Testing Stack

**For New Tests:**
```json
{
  "devDependencies": {
    "vitest": "^latest",
    "@testing-library/react": "^latest",
    "@testing-library/jest-dom": "^latest",
    "jsdom": "^latest",
    "msw": "^latest"
  }
}
```

**Rationale:**
- Vitest: Modern, Vite-native test runner (matches project setup)
- React Testing Library: Tests user behavior, not implementation
- MSW: Mock Service Worker for clean API mocking
- jsdom: Browser environment simulation

## Existing Validation

**Type Checking Only:**
- TypeScript compiler validates types at build time
- `tsc --noEmit` in npm lint script catches type errors
- No runtime validation framework detected
- No input sanitization or validation libraries (no zod, yup, etc.)

**Current Validation in Code:**
```typescript
// Manual validation checks
if (!sentence.trim()) return;

// Server-side
if (!sentence) {
  return res.status(400).json({ error: 'Sentence is required' });
}
```

---

*Testing analysis: 2026-03-10*

**Summary:** The codebase currently relies on TypeScript type checking and manual testing. No automated test suite exists. Critical areas like API endpoints, AI service integration, and data persistence would benefit significantly from test coverage.
