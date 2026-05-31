# 7. Folder Structure — ResumeIQ AI

**Status:** Draft v1 · Next.js App Router monorepo-light (single app, clear layers)

---

## 7.1 Guiding Rules

- **Layered, not scattered.** UI → route handlers/server actions → **services** → repos →
  external clients. Logic lives in services, never in components or handlers.
- **Feature-cohesive components** under `components/`, primitives under `components/ui`.
- **Everything shared & typed** in `lib/` (validators, types, clients, constants).
- **AI is isolated** in `lib/ai` + `inngest/` so prompts/rubrics/models are versioned and testable.
- **Colocate tests** (`*.test.ts`) next to code; e2e in `/e2e`.

## 7.2 Top-Level Layout

```
resumeiq-ai/
├── docs/                       # ← these planning documents
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/                     # static assets, illustrations, og images
├── src/
│   ├── app/                    # Next.js App Router (routes only)
│   ├── components/             # React components (ui + feature)
│   ├── server/                 # server-only: services, repos, actions
│   ├── lib/                    # shared utils, validators, clients, ai
│   ├── inngest/                # background job functions (AI pipeline)
│   ├── hooks/                  # client React hooks
│   ├── styles/                 # globals.css, tailwind layers
│   └── types/                  # shared TS types / d.ts
├── e2e/                        # Playwright end-to-end tests
├── scripts/                    # one-off / ops scripts
├── .env.example
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

## 7.3 `src/app` — Routes (thin)

```
src/app/
├── (marketing)/                # public, no auth
│   ├── page.tsx                # landing
│   ├── pricing/page.tsx
│   └── layout.tsx
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── (app)/                      # authed shell (sidebar)
│   ├── layout.tsx              # auth guard + app chrome
│   ├── page.tsx                # dashboard
│   ├── resumes/[id]/page.tsx
│   ├── analyses/[id]/page.tsx
│   ├── jobs/page.tsx
│   ├── billing/page.tsx
│   └── settings/page.tsx
├── share/[token]/page.tsx      # public shared report
├── api/                        # route handlers (see API doc)
│   ├── health/route.ts
│   ├── resumes/route.ts
│   ├── resumes/[id]/route.ts
│   ├── resumes/[id]/upload-url/route.ts
│   ├── resumes/[id]/versions/[versionId]/commit/route.ts
│   ├── job-descriptions/route.ts
│   ├── analyses/route.ts
│   ├── analyses/[id]/route.ts
│   ├── analyses/[id]/status/route.ts
│   ├── analyses/[id]/export/route.ts
│   ├── suggestions/[id]/feedback/route.ts
│   ├── billing/checkout/route.ts
│   ├── billing/portal/route.ts
│   ├── me/route.ts
│   ├── inngest/route.ts        # Inngest serve endpoint
│   └── webhooks/
│       ├── stripe/route.ts
│       └── clerk/route.ts
├── layout.tsx                  # root layout (fonts, theme, providers)
├── globals.css
├── error.tsx / not-found.tsx
└── opengraph-image.tsx
```

Route files import **server actions** or call **services**; they contain no business logic.

## 7.4 `src/server` — Business Logic (server-only)

```
src/server/
├── services/
│   ├── resume.service.ts
│   ├── analysis.service.ts
│   ├── match.service.ts
│   ├── usage.service.ts
│   ├── billing.service.ts
│   ├── report.service.ts
│   └── ai.service.ts           # wraps lib/ai for the rest of the app
├── repositories/               # all Prisma access lives here
│   ├── resume.repo.ts
│   ├── analysis.repo.ts
│   ├── jd.repo.ts
│   ├── user.repo.ts
│   └── usage.repo.ts
├── actions/                    # Next.js server actions (thin → services)
│   ├── resume.actions.ts
│   ├── jd.actions.ts
│   └── analysis.actions.ts
├── auth/
│   ├── get-current-user.ts     # Clerk → internal User
│   └── require-auth.ts
└── db.ts                       # Prisma client singleton
```

**Rule:** only `repositories/*` import Prisma. Services orchestrate repos + clients. Actions
and route handlers call services. This keeps data access swappable and testable.

## 7.5 `src/lib` — Shared (client+server safe unless noted)

```
src/lib/
├── ai/                         # server-only AI layer (versioned)
│   ├── client.ts               # Anthropic SDK init, prompt caching config
│   ├── models.ts               # model routing constants (sonnet/opus ids)
│   ├── prompts/
│   │   ├── score.prompt.ts
│   │   ├── ats.prompt.ts
│   │   ├── match.prompt.ts
│   │   └── suggest.prompt.ts
│   ├── rubrics/
│   │   └── score-v1.ts         # weighted rubric, versioned
│   ├── schemas.ts              # Zod schemas for structured LLM outputs
│   └── embeddings.ts
├── storage/
│   ├── r2.ts                   # signed URL helpers (server-only)
│   └── files.ts                # type/size validation
├── parsing/
│   ├── pdf.ts
│   ├── docx.ts
│   └── extract.ts              # structure extraction + LLM fallback
├── validators/                 # Zod request/response schemas (shared)
│   ├── resume.schema.ts
│   ├── analysis.schema.ts
│   └── billing.schema.ts
├── api-client.ts               # typed fetch wrapper (client)
├── stripe.ts                   # Stripe SDK (server-only)
├── ratelimit.ts                # Upstash limiter
├── analytics.ts                # PostHog wrapper
├── logger.ts                   # structured logging → Axiom
├── errors.ts                   # AppError + error code catalog
├── constants.ts                # plans, quotas, limits
└── utils.ts                    # cn(), formatters
```

## 7.6 `src/inngest` — Background AI Pipeline

```
src/inngest/
├── client.ts                   # Inngest client
├── functions/
│   ├── parse-resume.ts         # parse pipeline (on resume.committed)
│   ├── run-analysis.ts         # the multi-step analysis pipeline
│   └── generate-export.ts      # PDF report generation
└── events.ts                   # typed event catalog
```

`run-analysis.ts` implements the stepped pipeline from [Architecture §2.4]; each step calls
a service/AI function and is independently retryable.

## 7.7 `src/components`

```
src/components/
├── ui/                         # shadcn/ui primitives (button, dialog, ...)
├── resumeiq/                   # custom domain components
│   ├── score-ring.tsx
│   ├── sub-score-bar.tsx
│   ├── file-dropzone.tsx
│   ├── ats-finding-item.tsx
│   ├── gap-list.tsx
│   ├── keyword-chip.tsx
│   ├── suggestion-card.tsx
│   ├── before-after-diff.tsx
│   ├── analysis-progress.tsx
│   ├── score-delta-badge.tsx
│   └── usage-meter.tsx
├── layout/                     # sidebar, topnav, app-shell
├── marketing/                  # hero, feature grid, pricing cards
└── providers/                  # theme, posthog, clerk, query providers
```

## 7.8 `src/hooks` & `src/types`

```
src/hooks/
├── use-analysis-status.ts      # polls /api/analyses/:id/status
├── use-upload.ts               # signed-upload flow
└── use-usage.ts

src/types/
├── domain.ts                   # ParsedResume, SubScores, AtsFinding, etc.
└── api.ts                      # request/response types (inferred from Zod)
```

## 7.9 Naming & Import Conventions

- Files: `kebab-case.ts(x)`. React components: `PascalCase` export.
- Services/repos: `*.service.ts` / `*.repo.ts`. Server actions: `*.actions.ts`.
- Path alias `@/*` → `src/*`.
- **Server-only modules** (`server/**`, `lib/ai`, `lib/stripe`, `lib/storage`,
  `lib/parsing`) start with `import "server-only";` to prevent client bundling leaks.
- Barrel exports avoided in hot paths to keep bundles lean.

## 7.10 Config & Tooling Files

```
.eslintrc / eslint.config.mjs   strict + import rules (no Prisma outside repos)
prettier.config.mjs
vitest.config.ts                unit/integration
playwright.config.ts            e2e
.env.example                    every required env var documented
.github/workflows/ci.yml        typecheck · lint · test · prisma validate · build
docker-compose.yml              local Postgres+pgvector
```

## 7.11 Test Layout

- Unit/integration: colocated `*.test.ts` (services, parsing, ai schema validation).
- AI prompt tests: snapshot + schema-validation tests in `lib/ai/__tests__`.
- E2E: `/e2e/*.spec.ts` (signup → upload → analysis happy path).
