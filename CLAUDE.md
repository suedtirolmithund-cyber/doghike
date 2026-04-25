# DogHike Südtirol — Claude Code Rules

## Project Overview

React + Vite app for hiking with dogs in South Tyrol. Uses Supabase for backend, Tailwind CSS for styling, and shadcn/ui for components.

---

## Stack

- **Framework**: React 18 (JSX, no TypeScript)
- **Build**: Vite 6
- **Styling**: Tailwind CSS 3 with shadcn/ui (New York style)
- **Backend**: Supabase (auth + database)
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod
- **Data fetching**: TanStack React Query v5
- **Maps**: Leaflet + React Leaflet
- **Animations**: Framer Motion
- **Toasts**: Sonner

---

## Design Tokens

### Brand Colors (Brown palette — matches Figma design)

Defined in `tailwind.config.js` as `brand.*`:

| Token | Hex | Usage |
|---|---|---|
| `brand-400` | `#b88c73` | Primary buttons, active states, accents |
| `brand-600` | `#8c6b4a` | Hover states, headings, dark accents |
| `brand-200` | `#dfc5b6` | Borders, subtle backgrounds |
| `brand-100` | `#f0e4da` | Light backgrounds, badges |
| `brand-50`  | `#faf5f2` | Very light tints |

CSS variables in `src/index.css`:
- `--primary`: 22 33% 59% → `#b88c73`
- `--primary-foreground`: white
- `--ring`: 22 33% 59%
- `--accent`: 22 33% 93%

**IMPORTANT: Never use emerald-*, green-* Tailwind classes. Always use brand-* instead.**

### Input Style (Figma-matched)

All inputs use the style defined in `src/components/ui/input.jsx`:
- `bg-[#f0f0f0]` — light gray background
- `rounded-xl` — rounded corners
- `border-0` — no border
- `h-12` — taller than default
- `focus-visible:ring-2 focus-visible:ring-brand-400/40`

**IMPORTANT: Never add borders or white backgrounds to inputs.**

---

## Component Organization

```
src/
├── components/
│   ├── ui/           ← shadcn/ui base components (Button, Input, Dialog, etc.)
│   ├── forms/        ← HikeForm, DogForm
│   ├── hikes/        ← HikeCard, SaveButton, OfflineDownload, RouteProfile
│   ├── routes/       ← GPSTracker, GPXUploader, UserRouteCard
│   ├── map/          ← HikeMap, RouteEditor
│   ├── profile/      ← AccountSettings
│   ├── dogs/         ← DogAvatar
│   ├── stats/        ← StatsCard
│   ├── community/    ← CommentSection, RatingSection
│   └── ideas/        ← PremiumIdeas
├── pages/            ← One file per route
├── lib/              ← AuthContext, Supabase client, utils
└── index.css         ← Global styles + CSS variables
```

---

## Figma MCP Integration Rules

### Required workflow for every Figma task

1. Run `get_design_context` with the node ID from the Figma URL
2. Run `get_screenshot` for visual reference
3. Adapt the output (React + Tailwind) to this project's stack:
   - Replace any `emerald-*` / `green-*` → `brand-*`
   - Replace hardcoded hex colors with brand tokens where possible
   - Use existing shadcn/ui components from `src/components/ui/`
   - Keep inputs styled as defined above (bg-[#f0f0f0], rounded-xl, border-0)
4. Validate visually against the Figma screenshot

### Asset handling

- Static images go in `public/` and are referenced as `/filename.ext`
- **IMPORTANT**: Optimize images before committing — max ~200KB for background images
- Use sharp (already installed as devDependency) to optimize: `node -e "require('sharp')('public/img.jpg').resize(1080).jpeg({quality:75}).toFile('public/img_opt.jpg').then(console.log)"`
- Icons: use `lucide-react` — do NOT install new icon libraries

---

## Styling Rules

- **IMPORTANT**: Use Tailwind utility classes, not inline styles (except for dynamic values)
- Brand color classes: `bg-brand-400`, `text-brand-600`, `border-brand-200`, `hover:bg-brand-600`
- Buttons use shadcn `<Button>` with `className` to override colors where needed
- Toasts via `sonner` (`toast.success()`, `toast.error()`) — never use `alert()` or `confirm()`
- Dialogs via shadcn `<Dialog>` — never use `window.confirm()`
- Animations via Framer Motion for page transitions and show/hide

---

## Routing & Pages

Routes are defined in `src/pages.config.js` (auto-generated). Page components live in `src/pages/`. The main layout with navigation is `src/Layout.jsx`.

Auth is handled in `src/lib/AuthContext.jsx` via Supabase. Protected routes redirect to `/Login`.

---

## Code Conventions

- Files: JSX, no TypeScript
- No comments unless the WHY is non-obvious
- No `alert()`, `confirm()` — use toasts and dialogs
- Path alias: `@/` = `src/`
- Imports: React first, then third-party, then `@/` internal
