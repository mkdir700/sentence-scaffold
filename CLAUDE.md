## Design Context

### Users
- **Self-learners**: Adults independently studying English, using fragmented time for self-directed learning
- **Reading enthusiasts**: People who enjoy reading English books/articles and want to understand complex sentence structures
- **Context**: Casual, self-paced — not exam prep or classroom use. Users come with a specific sentence they want to understand and leave with structural insight

### Brand Personality
**Elegant · Clean · Modern**

- Voice: Clear and approachable, like a knowledgeable friend rather than a textbook
- Tone: Lively and fun while maintaining sophistication — never dry or academic
- Emotional goal: Make structural analysis feel like discovery, not homework

### Aesthetic Direction
- **Visual tone**: Notion-inspired — generous whitespace, content-first layout, minimal chrome
- **Typography**: Serif for featured sentences (Playfair Display), clean sans-serif for UI (Inter), monospace for structural notation (JetBrains Mono)
- **Color**: Indigo accent on Zinc neutral base; use color sparingly for emphasis, not decoration
- **Theme**: Follow system preference (light/dark auto-switch)
- **Anti-references**: Avoid Duolingo-style gamification, heavy gradients, or cluttered dashboards
- **Interactions**: Subtle animations (fade-in, slide) that feel natural, not flashy

### Design Principles
1. **Content is king** — Every design decision should make the sentence analysis easier to read and understand. Remove anything that doesn't serve comprehension.
2. **Progressive disclosure** — Reveal complexity in layers (6-step walkthrough). Never overwhelm with all information at once.
3. **Quiet elegance** — Lively through thoughtful typography and spacing, not through excessive color or decoration. Let whitespace breathe.
4. **Consistency over cleverness** — Use established patterns (Card, Badge, Button variants) uniformly. A predictable interface lets users focus on learning.
5. **Responsive by default** — Mobile-first layouts that gracefully expand. Most users will encounter sentences on the go.

### Color System
- **Primary accent**: Indigo (indigo-50 through indigo-900) — actions, focus states, emphasis
- **Neutral**: Zinc (zinc-50 through zinc-950) — backgrounds, text, borders
- **Semantic accents**: Emerald for summaries/success, Amber for highlights/tips, Red for errors
- **Rule**: No more than 2 accent colors per view. Let Zinc do the heavy lifting.

### Typography Scale
- **Display**: `text-5xl font-bold` (hero headings only)
- **Page heading**: `text-3xl font-bold`
- **Featured sentence**: `text-2xl font-serif`
- **Section heading**: `text-lg font-semibold`
- **Body**: `text-base` / `text-lg`
- **Label**: `text-sm font-semibold uppercase tracking-wider`
- **Helper**: `text-xs` / `text-sm`
- **Code/structure**: `font-mono text-sm`

### Spacing Conventions
- **Page container**: `max-w-5xl mx-auto px-4`
- **Section gaps**: `space-y-8` or `space-y-12`
- **Card padding**: `p-6`
- **Internal content**: `space-y-2` to `space-y-4`
- **Grid gaps**: `gap-4` to `gap-6`

### Accessibility
- Not a current priority; will be addressed in a future phase
- Basic requirements: reasonable contrast ratios, keyboard navigation, semantic HTML
