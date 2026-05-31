# 2. System Architecture — ResumeIQ AI

**Status:** Draft v1 · **Last updated:** 2026-05-31

---

## 2.1 Architectural Principles

1. **One codebase, clear seams.** Next.js full-stack (App Router) with a strict service
   layer so business logic never lives in components or route handlers.
2. **AI work is async & durable.** Anything that calls an LLM runs through a job queue
   (Inngest) with retries, timeouts, and progress — never blocking a request thread.
3. **Stateless app tier.** All state in Postgres / R2 / Clerk so we can scale horizontally.
4. **Type-safe end to end.** TypeScript + Prisma + Zod contracts shared by client & server.
5. **Explainable & versioned AI.** Prompts, rubrics, and model choices are versioned and
   logged so every score is reproducible and auditable.
6. **Privacy by default.** Resumes are PII; signed URLs, encryption, least privilege,
   hard-delete support.

## 2.2 High-Level Diagram

```
                         ┌─────────────────────────────────────────────┐
                         │                  CLIENT                       │
                         │  Next.js App Router (React, TS, Tailwind)     │
                         │  - Marketing pages   - Dashboard (auth)       │
                         │  - Upload / Report UI                         │
                         └───────────────┬─────────────────────────────┘
                                         │ HTTPS (RSC + Route Handlers)
                                         ▼
         ┌───────────────────────────────────────────────────────────────┐
         │                    NEXT.JS SERVER (Vercel)                      │
         │                                                                 │
         │   Route Handlers (/api/*)        Server Actions / RSC           │
         │            │                              │                     │
         │            ▼                              ▼                     │
         │   ┌──────────────────  SERVICE LAYER  ─────────────────────┐   │
         │   │ ResumeService · AnalysisService · MatchService ·        │   │
         │   │ BillingService · UsageService · ReportService          │   │
         │   └───┬───────────┬────────────┬───────────┬───────────────┘   │
         │       │           │            │           │                   │
         └───────┼───────────┼────────────┼───────────┼───────────────────┘
                 │           │            │           │
        ┌────────▼──┐  ┌─────▼─────┐  ┌───▼─────┐  ┌──▼────────┐
        │ Clerk     │  │ Postgres  │  │ R2      │  │ Inngest    │
        │ (Auth)    │  │ +pgvector │  │(files)  │  │ (job queue)│
        └───────────┘  │ (Prisma)  │  └─────────┘  └─────┬──────┘
                       └───────────┘                     │
                                                         ▼
                                        ┌─────────────────────────────┐
                                        │   AI PIPELINE (workers)      │
                                        │  parse → embed → score →     │
                                        │  ATS → JD-match → suggest    │
                                        │   └── Anthropic Claude API   │
                                        └─────────────────────────────┘

   Cross-cutting: Stripe (billing) · Sentry (errors) · PostHog (analytics) · Axiom (logs)
```

## 2.3 Component Responsibilities

### Client (Next.js App Router)
- Server Components for data-heavy, SEO, and authenticated dashboard reads.
- Client Components only where interactivity is required (upload, charts, forms).
- Reads analysis status via polling or streaming; never blocks on AI.

### Server / Service Layer
The **service layer** is the heart of the app. Route handlers and server actions are thin;
they validate input (Zod), check auth + quota, then call a service. Services own all
business logic and are the only things that touch Prisma, R2, or the queue.

| Service | Responsibility |
|---------|----------------|
| `ResumeService` | Upload handling, file validation, R2 storage, parse orchestration |
| `AnalysisService` | ResumeScore, ATS checks, suggestion generation orchestration |
| `MatchService` | JD ingestion, embeddings, gap analysis |
| `UsageService` | Quota checks & metering per plan |
| `BillingService` | Stripe customers, subscriptions, webhooks → plan state |
| `ReportService` | Assemble persisted reports, exports, share links |
| `AIService` | Wraps Anthropic SDK: prompt assembly, caching, retries, cost logging |

### Data Stores
- **Postgres (Prisma):** users, resumes, analyses, matches, suggestions, usage, billing.
- **pgvector:** embeddings for resume sections & JDs (semantic match).
- **R2:** original uploaded files + generated PDF reports (private, signed URLs).
- **Clerk:** identity, sessions, OAuth, org membership (v2).

### Background Pipeline (Inngest)
LLM/heavy work runs as a multi-step durable function. Each step is independently retryable
and observable. This decouples slow AI work from the request lifecycle and gives us
progress events for the UI.

## 2.4 The AI Analysis Pipeline

Triggered when a user requests an analysis. Emitted as an Inngest event; the function runs
steps with checkpoints:

```
Event: analysis.requested { resumeId, analysisId, jobDescriptionId? }

Step 1  parse.resume        → extract text+structure (lib parser; LLM fallback)
Step 2  embed.sections      → embeddings → pgvector  (skip if cached/unchanged)
Step 3  score.resume        → Claude: structured ResumeScore JSON (rubric vN)
Step 4  ats.check           → deterministic checks + Claude review → findings
Step 5  (if JD) match.gap   → Claude: matched/weak/missing + MatchScore
Step 6  suggest.generate    → Claude: prioritized, bullet-level rewrites
Step 7  report.assemble     → persist Analysis + children; emit analysis.completed
        on any failure      → mark analysis FAILED with reason; surface to UI
```

**Why a pipeline, not one giant prompt:** isolating steps lets us version/test each rubric,
route models per step (Sonnet for ATS, Opus for gap analysis), retry granularly, cache
aggressively, and attribute cost precisely.

### Model Routing
- Default: **Claude Sonnet 4.6** (scoring, ATS, suggestions) — cost/latency.
- Premium/deep: **Claude Opus 4.8** (JD gap reasoning, "deep mode" for Pro).
- Embeddings: dedicated embedding model.
- All calls: prompt caching on system prompt + rubric; low temperature; strict JSON via
  tool-use; Zod-validated on return; token usage + cost logged per call.

### AI Reliability & Guardrails
- Timeouts + exponential backoff + jitter; max retries per step.
- Schema validation → on invalid JSON, one self-correction retry, then fail gracefully.
- Prompt-injection defense: resume/JD content is treated as **untrusted data**, wrapped and
  never interpreted as instructions; system prompt explicitly forbids following embedded
  instructions or inventing experience.
- Cost ceilings per request; oversized inputs truncated by section priority.

## 2.5 Request Lifecycles

**Synchronous (fast) — e.g., load report:**
`Client → Route Handler → auth (Clerk) → Service → Prisma → JSON → Client`

**Asynchronous (AI) — e.g., run analysis:**
```
Client POST /api/analyses           → validate + quota check → create Analysis(PENDING)
                                    → emit Inngest event → 202 { analysisId }
Inngest pipeline runs              → updates status PENDING→RUNNING→COMPLETED/FAILED
Client polls GET /api/analyses/:id  → shows progress → renders report when COMPLETED
```

## 2.6 Authentication & Authorization

- **AuthN:** Clerk (email/password + OAuth). Middleware protects `/app/**` and `/api/**`.
- **AuthZ:** Every service call is scoped to `userId` (and `orgId` in v2). Row ownership is
  enforced in queries — never trust client-supplied IDs. Webhooks verified by signature.
- **Quota/plan:** `UsageService` checks plan + remaining quota before any metered action.

## 2.7 Billing Architecture

- Stripe Checkout for subscription start; Customer Portal for management.
- **Stripe webhooks** (`/api/webhooks/stripe`) are the source of truth for plan state →
  update `subscriptions` table. App reads plan from DB, never from the client.
- Usage metering recorded per analysis for limits + future usage-based billing.

## 2.8 Security Architecture

- TLS everywhere; secrets in Vercel env / secret manager (never in repo).
- R2 objects private; access via short-lived **signed URLs** only.
- Encryption at rest (DB + object storage provider-managed).
- Input validation (Zod) at every boundary; output encoding to prevent XSS.
- Rate limiting on auth + upload + analysis endpoints (Upstash ratelimit).
- Least-privilege DB roles; no raw SQL from untrusted input (Prisma parameterized).
- Audit logging for sensitive actions (delete, export, billing).
- PII handling per [PRD §1.8]; hard-delete cascades remove files + embeddings.

## 2.9 Observability

| Concern | Tool | What we capture |
|---------|------|-----------------|
| Errors | Sentry | Exceptions w/ user/release context (PII scrubbed) |
| Product analytics | PostHog | Funnels: signup→upload→analysis→JD→upgrade |
| Logs | Axiom | Structured logs incl. AI call: model, tokens, latency, cost |
| AI metrics | Custom + Axiom | Per-step success rate, cost/analysis, score distributions |
| Uptime | Provider/Better Stack | Health checks on app + webhooks |

## 2.10 Environments & Deployment

- **Local:** Next dev + Dockerized Postgres (pgvector) + Inngest dev server + Stripe CLI.
- **Preview:** Vercel preview per PR + branch DB (Neon branching) + test Stripe.
- **Production:** Vercel + managed Postgres + Inngest cloud + live Stripe.
- CI: typecheck, lint, unit/integration tests, Prisma migrate check, build — gate on green.
- Migrations: Prisma Migrate, applied in CI/CD with backups before prod migrate.

## 2.11 Scalability Plan

- App tier stateless → Vercel scales automatically.
- AI throughput scales via Inngest concurrency + provider rate-limit-aware queueing.
- DB: start single primary; add read replicas + connection pooling (PgBouncer/Neon) as load grows.
- Hot paths cached (Upstash Redis) — plan/quota lookups, parsed resume reuse.
- Cost scales sub-linearly via prompt caching + model routing + embedding reuse.

## 2.12 Key Architectural Decisions (ADRs, condensed)

| Decision | Choice | Alternatives considered | Rationale |
|----------|--------|------------------------|-----------|
| App framework | Next.js full-stack | Separate React SPA + Node API | One repo, RSC, Vercel-native, faster to PMF |
| AI orchestration | Inngest | BullMQ+Redis, raw cron, sync calls | Durable steps, serverless-friendly, built-in retries/observability |
| Vector store | pgvector | Pinecone, Weaviate | One datastore, transactional with relational data, cheaper |
| Auth | Clerk | Auth.js (self-host) | Orgs/MFA/sessions out of the box; revisit cost at scale |
| File storage | Cloudflare R2 | AWS S3 | S3-compatible, no egress fees |
| ORM | Prisma | Drizzle | Maturity, migrations, ecosystem; revisit if perf-bound |

These are revisitable — documented so we know *why* and can change deliberately.
