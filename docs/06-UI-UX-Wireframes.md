# 6. UI/UX Wireframes — ResumeIQ AI

**Status:** Draft v1 · Low-fidelity ASCII wireframes + flow notes. High-fi in Figma later.

---

## 6.1 Information Architecture / Sitemap

```
Public
├── /                      Landing / marketing
├── /pricing               Plans
├── /sign-in, /sign-up     Clerk auth
└── /share/:token          Public read-only shared report (Pro)

App (auth required, /app)
├── /app                   Dashboard (resumes + recent analyses)
├── /app/resumes/:id       Resume detail (versions, run analysis)
├── /app/analyses/:id      Analysis report (the core screen)
├── /app/jobs              Saved job descriptions
├── /app/billing           Plan & usage
└── /app/settings          Profile, data export/delete
```

## 6.2 Primary User Flow (the money path)

```
Sign up → Dashboard (empty) → Upload resume → [parse] → Analysis report (ResumeScore+ATS)
   → "Target a job" → paste JD → [analyze] → Match + gaps + rewrites
   → apply edits offline → re-upload (new version) → score delta ▲ → upgrade at quota
```

Design intent: get a first-time user to a *real result* (a score + 3 concrete fixes) in
under 2 minutes, before asking for payment.

## 6.3 Landing Page (`/`)

```
┌───────────────────────────────────────────────────────────────┐
│  ResumeIQ AI            Features  Pricing  Sign in  [Get started]│
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│     Know exactly why your resume gets passed over.              │
│     AI scoring, ATS checks, and JD-matched rewrites in minutes. │
│                                                                 │
│            [ Analyze my resume — free ]                         │
│                                                                 │
│     ┌───────── drop your resume or click to upload ─────────┐  │
│     │            (PDF / DOCX · instant score)               │  │
│     └──────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────┤
│  [⚙ ATS check]   [🎯 JD match]   [✍ Rewrite tips]   [📈 Track]  │
│  How it works · Sample report · Testimonials · FAQ · Pricing    │
└───────────────────────────────────────────────────────────────┘
```
Notes: hero CTA = upload (instant value). Inline dropzone routes to sign-up after parse so
the user has skin in the game before account creation.

## 6.4 Dashboard (`/app`)

```
┌─────────────┬─────────────────────────────────────────────────┐
│  ResumeIQ   │  Dashboard                       [+ Upload resume]│
│             │                                                   │
│  ▸ Dashboard│  Usage: ▓▓▓░░  2/3 analyses this mo   [Upgrade]   │
│  ▸ Resumes  │                                                   │
│  ▸ Jobs     │  Your resumes                                     │
│  ▸ Billing  │  ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  ▸ Settings │  │ Backend SWE │ │ PM Resume  │ │  + New     │    │
│             │  │  ◯ 78 ▲+6   │ │  ◯ 64      │ │  upload    │    │
│  [avatar]   │  │ 3 analyses  │ │ 1 analysis │ │            │    │
│             │  └────────────┘ └────────────┘ └────────────┘    │
│             │                                                   │
│             │  Recent analyses                                  │
│             │  • Backend SWE → "Senior BE @ Acme"  74  2d ago > │
│             │  • PM Resume   (standalone)          64  5d ago > │
└─────────────┴─────────────────────────────────────────────────┘
```
Empty state: large `EmptyState` with dropzone + "Upload your first resume."

## 6.5 Upload & Parsing

```
┌───────────────────── Upload resume ──────────────────────┐
│  Title: [ Backend SWE 2026 ............................ ] │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           ⬆  Drag & drop  PDF or DOCX                │ │
│  │              or click to browse (max 10MB)           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  resume_v3.pdf  · 240KB     ▓▓▓▓▓▓░░  uploading...        │
└───────────────────────────────────────────────────────────┘

  After upload → parsing screen:
  ┌──────────────────────────────────────────┐
  │  Reading your resume…                      │
  │  ✓ Uploaded   ◐ Extracting text   ○ Parsing│
  └──────────────────────────────────────────┘
```
Error states: unsupported type, too large, parse failed (with "try a different export / 
upload as PDF" guidance and a manual retry).

## 6.6 Resume Detail (`/app/resumes/:id`)

```
┌───────────────────────────────────────────────────────────────┐
│ ‹ Backend SWE 2026                         [⋯]  [Run analysis] │
│ Current: v3 · uploaded 2d ago                                  │
├───────────────────────────────────────────────────────────────┤
│  Latest score   ◯ 78  Strong   ▲ +6 vs v2                      │
│                                                                 │
│  Run analysis                                                   │
│   ( ) Standalone (score + ATS)                                  │
│   (•) Target a job description                                  │
│       [ paste or select a saved JD ............... ▼ ]         │
│       [ Analyze ]                                               │
├───────────────────────────────────────────────────────────────┤
│  Versions            History                                    │
│  v3  78 ▲   2d       • v3 → "Senior BE @ Acme"  74   >          │
│  v2  72     9d       • v2 standalone            72   >          │
│  v1  64    20d       • v1 standalone            64   >          │
└───────────────────────────────────────────────────────────────┘
```

## 6.7 Analysis Report (`/app/analyses/:id`) — THE core screen

### Running state
```
┌──────────────── Analyzing… ────────────────┐
│  Backend SWE 2026  →  Senior BE @ Acme       │
│  ✓ Parsed  ✓ Scored  ◐ Matching JD  ○ Writing│
│  suggestions…                                │
│  [ skeleton cards ]                          │
└──────────────────────────────────────────────┘
```

### Completed state
```
┌───────────────────────────────────────────────────────────────┐
│  Backend SWE 2026 → Senior Backend @ Acme        [Export] [Share]│
├───────────────────────────────┬───────────────────────────────┤
│   OVERALL                      │   MATCH TO JOB                 │
│        ◯ 78                    │       ◯ 74                     │
│      Strong                    │   You match 14/18 requirements │
│                                │                                │
│  Impact      ▓▓▓▓▓▓▓░░ 72      │  ✅ Matched   Python, REST...   │
│  Clarity     ▓▓▓▓▓▓▓▓▓ 85      │  ⚠️ Weak      Kubernetes        │
│  Relevance   ▓▓▓▓▓▓▓░░ 70      │  ❌ Missing   Terraform, gRPC   │
│  ATS         ▓▓▓▓▓▓▓▓░ 88      │                                │
│  Complete    ▓▓▓▓▓▓▓▓░ 80      │  Keyword coverage  14 / 18     │
├───────────────────────────────┴───────────────────────────────┤
│  Summary: Strong structure and ATS-friendly. Biggest wins:     │
│  quantify impact and add 4 missing keywords from the JD.       │
├───────────────────────────────────────────────────────────────┤
│  [ Suggestions ]  [ ATS report ]  [ Gap details ]   (tabs)     │
│                                                                 │
│  Suggestions (sorted by impact)                                 │
│  ┌─ HIGH ───────────────────────────────────────────────────┐ │
│  │ Quantify this achievement              [Apply] [👍] [👎]  │ │
│  │ Before: "Improved API performance"                        │ │
│  │ After : "Cut p95 latency 40% (820→490ms) via Redis cache" │ │
│  │ Why: recruiters scan for measurable impact.               │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌─ HIGH ── Add missing keyword: Terraform ───────────── ⌄ ─┐ │
│  ┌─ MED  ── Tighten summary to 3 lines ──────────────── ⌄ ─┐ │
└───────────────────────────────────────────────────────────────┘
```

ATS report tab:
```
  ATS compatibility  ◯ 88
  ✓ pass   Standard fonts detected
  ⚠ warn   Two-column layout may confuse some parsers   [How to fix ⌄]
  ✗ fail   Contact email not detected in header         [How to fix ⌄]
```

Gap details tab: full tri-column `GapList` with keyword chips and per-item rationale.

Mobile: columns stack — Overall → Match → Summary → Tabs.

## 6.8 Pricing (`/pricing`)

```
┌──────────── Free ────────────┐ ┌──────── Pro  (Most popular) ───────┐
│ $0                            │ │ $19/mo                             │
│ • 3 analyses / month          │ │ • Unlimited analyses               │
│ • 1 saved resume              │ │ • JD match + gap analysis          │
│ • ATS check                   │ │ • Exports & shareable reports      │
│                               │ │ • History & score tracking         │
│   [ Get started ]             │ │ • Opus deep mode                   │
└───────────────────────────────┘ │   [ Upgrade ]                      │
                                   └────────────────────────────────────┘
   (Teams — coming soon: recruiter ranking, shared workspaces)
```

## 6.9 Billing (`/app/billing`)

```
  Plan: Pro · renews Jun 30, 2026               [Manage in Stripe]
  Usage this period: 42 analyses · ▓▓▓ unlimited
  Invoices: list with download links
```

## 6.10 Settings (`/app/settings`)

```
  Profile      name, email (via Clerk), avatar
  Data         [ Export my data ]   [ Delete account & all data ]  (danger zone)
  Preferences  theme (system/light/dark), email notifications
```

## 6.11 Key UX Decisions

- **Instant value before signup:** parse + teaser score on landing, gate full report behind
  quick sign-up.
- **One screen owns the value:** the Analysis Report. Everything funnels to it.
- **Progress, never a spinner-of-doom:** the pipeline stepper maps to real backend steps.
- **Fixes are first-class:** suggestions are interactive (apply/helpful), sorted by impact.
- **Improvement loop is visible:** version deltas (▲/▼) make progress tangible → retention.
- **Upgrade at the moment of value**, not on a nag wall.

## 6.12 States Checklist (per screen)

Loading (skeletons) · Empty · Error/retry · Quota-blocked · Success. Every list and the
report must implement all five before a screen is "done."
