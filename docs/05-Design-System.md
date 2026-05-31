# 5. Design System — ResumeIQ AI

**Status:** Draft v1 · **Foundation:** Tailwind CSS + shadcn/ui (Radix primitives)

---

## 5.1 Design Principles

1. **Clarity over cleverness.** Users are stressed job-seekers; reduce cognitive load.
2. **Explainable, never a black box.** Every score shows its reasoning. No bare numbers.
3. **Action-first.** The product's value is *what to do next* — make CTAs and fixes obvious.
4. **Trust & calm.** This is PII and emotionally loaded. Professional, reassuring, uncluttered.
5. **Accessible by default.** WCAG 2.1 AA; keyboard + screen-reader first-class.
6. **Consistent & ownable.** shadcn/ui means we *own* the components — themeable, no lock-in.

## 5.2 Brand Personality

Smart, trustworthy, encouraging coach — not a cold robot, not a hype machine. Visual tone:
modern SaaS, generous whitespace, confident typography, restrained color used to signal
meaning (score health, severity).

## 5.3 Design Tokens

Tokens are the single source of truth, defined as CSS variables and consumed by Tailwind.
This enables light/dark theming and keeps values out of components.

### Color — semantic palette (HSL via CSS vars)

```css
:root {
  /* Brand */
  --primary: 221 83% 53%;          /* indigo-600 — primary actions */
  --primary-foreground: 0 0% 100%;
  --accent: 262 83% 58%;           /* violet — highlights */

  /* Surfaces */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
  --ring: 221 83% 53%;

  /* Feedback (also used for score health & ATS severity) */
  --success: 142 71% 45%;          /* good score / pass */
  --warning: 38 92% 50%;           /* needs work / warn */
  --destructive: 0 84% 60%;        /* poor / fail */
  --info: 199 89% 48%;

  --radius: 0.625rem;
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 13%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --border: 217 33% 20%;
}
```

**Score-health mapping** (used by ScoreRing, badges, charts):
- `0–49` → `--destructive` (Needs work)
- `50–74` → `--warning` (Getting there)
- `75–100` → `--success` (Strong)

### Typography

- **Font:** `Inter` (UI) via `next/font`; `JetBrains Mono` for code/keyword chips.
- **Scale (rem):** `xs .75 · sm .875 · base 1 · lg 1.125 · xl 1.25 · 2xl 1.5 · 3xl 1.875 · 4xl 2.25 · 5xl 3`
- **Weights:** 400 body, 500 medium (labels), 600 semibold (headings), 700 (display).
- **Line-height:** 1.5 body, 1.2 headings. **Measure:** ~65ch max for reading blocks.

### Spacing & layout

- 4px base scale (Tailwind default `0.25rem` step).
- Container max-width: `1200px` app, `1100px` marketing reading width.
- Section vertical rhythm: `py-16`/`py-24` marketing; `gap-6`/`gap-8` dashboard.

### Radius, shadow, motion

- Radius from `--radius` (sm/md/lg/xl variants).
- Shadows: subtle, layered (`sm` cards, `md` popovers, `lg` modals). Avoid heavy drop shadows.
- Motion: 150–200ms ease-out for hover/press; 300ms for enter; respect
  `prefers-reduced-motion` (disable non-essential animation).

## 5.4 Iconography & Illustration

- **Icons:** `lucide-react` — single consistent set, 1.5px stroke, sized 16/20/24.
- **Empty states & onboarding:** light, friendly illustration; never childish.
- **Score visuals:** custom `ScoreRing` (SVG radial) is the signature visual element.

## 5.5 Core Components (shadcn/ui base + custom)

### From shadcn/ui (themed via tokens)
Button, Input, Textarea, Select, Dialog, Sheet, Tabs, Tooltip, Popover, DropdownMenu,
Toast (Sonner), Card, Badge, Progress, Skeleton, Avatar, Accordion, Alert, Separator,
Table, Command (⌘K).

### Custom (ResumeIQ-specific)

| Component | Purpose |
|-----------|---------|
| `ScoreRing` | Radial 0–100 score with health color + label; sizes sm/md/lg |
| `SubScoreBar` | Horizontal bar per dimension with value + tooltip rationale |
| `FileDropzone` | Drag-drop upload, type/size validation, progress, error states |
| `AtsFindingItem` | Severity icon + message + collapsible fix |
| `GapList` | Tri-column matched / weak / missing with chips |
| `KeywordChip` | Skill/keyword pill; states: matched / missing / weak |
| `SuggestionCard` | Priority badge, before→after diff, rationale, apply/helpful actions |
| `BeforeAfterDiff` | Side-by-side (or stacked on mobile) rewrite comparison |
| `AnalysisProgress` | Stepper showing pipeline stages while AI runs |
| `ScoreDeltaBadge` | ▲/▼ change vs previous version |
| `UsageMeter` | Quota used/limit with upgrade nudge |
| `EmptyState` | Reusable illustration + heading + CTA |

### Button variants
`primary` (filled brand) · `secondary` (muted) · `outline` · `ghost` · `destructive` ·
`link`. Sizes: `sm / md / lg / icon`. Always show loading + disabled states.

## 5.6 Component States (required for every interactive component)

Default · Hover · Focus-visible (visible ring) · Active/Pressed · Disabled · Loading ·
Error · Empty. **Loading and error states are not optional** — AI is async and can fail.

## 5.7 Patterns

- **Async/AI feedback:** optimistic where safe; otherwise `AnalysisProgress` stepper +
  skeletons. Never a frozen button with no feedback.
- **Errors:** inline near the cause + toast for transient; full-page error boundary for fatal.
- **Empty states:** every list/section has a designed empty state with a next action.
- **Destructive actions:** confirm dialog naming the consequence ("Delete resume and all
  3 analyses? This can't be undone.").
- **Upgrade nudges:** contextual at the moment of value (locked export, quota hit), never spammy.

## 5.8 Accessibility (WCAG 2.1 AA)

- Color contrast ≥ 4.5:1 text / 3:1 large text & UI; never color *alone* to convey meaning
  (severity = icon + label + color).
- Full keyboard operability; visible focus rings (`--ring`); logical tab order.
- Radix primitives give correct ARIA roles, focus trapping (dialogs), and labeling.
- All inputs have associated labels; errors announced via `aria-live`.
- Charts/score rings have text equivalents (`aria-label`, accessible summaries).
- Honor `prefers-reduced-motion` and `prefers-color-scheme`.
- Target sizes ≥ 44px on touch.

## 5.9 Responsive Strategy

- Mobile-first. Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280`.
- Dashboard: single column (mobile) → sidebar + content (≥lg).
- Report: stacked sections (mobile) → two-column score+detail (≥lg).
- `BeforeAfterDiff`: stacked (mobile) → side-by-side (≥md).

## 5.10 Theming & Dark Mode

- `class`-based dark mode (`next-themes`), tokens swap via `.dark`.
- All custom components read tokens — no hardcoded hex. Charts read the same CSS vars.

## 5.11 Content & Microcopy Guidelines

- Encouraging, specific, second person. "Quantify this win" not "Improve bullet."
- Scores framed constructively: "Strong / Getting there / Needs work," not just a number.
- Never blame the user; always pair a problem with a fix.
- Plain language; avoid HR/ATS jargon without a tooltip definition.

## 5.12 Deliverables & Governance

- Tokens in `app/globals.css` + `tailwind.config.ts`.
- Components in `components/ui` (shadcn) and `components/resumeiq` (custom).
- A `/design` Storybook-style route (or Storybook) showcasing every component + states.
- Changes to tokens/components reviewed like code; visual regression in CI (later).
