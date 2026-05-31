<div align="center">

# ResumeIQ AI

**AI-powered resume analysis — instant scoring, ATS checks, and job-matched rewrites.**

Next.js 15 · TypeScript · Tailwind v4 · Prisma · Clerk · OpenAI · UploadThing · Inngest

</div>

---

ResumeIQ AI parses any resume (PDF/DOCX), scores it across five explainable dimensions,
audits it for Applicant Tracking System (ATS) compatibility, matches it against a specific
job description, and returns prioritized, rewrite-ready suggestions powered by OpenAI.

> Full product & engineering planning lives in [`/docs`](./docs) — PRD, architecture,
> schema, API design, design system, wireframes, folder structure, and roadmap.

## Features

- **ResumeScore** — weighted 0–100 score across impact, clarity, relevance, ATS, completeness
- **ATS compatibility audit** — pass/warn/fail findings with a concrete fix for each
- **JD match & gap analysis** — matched / weak / missing requirements + keyword coverage
- **AI rewrite suggestions** — bullet-level before → after, grounded in your real experience
- **Version history** — every re-upload is a version; track your score over time
- **Auth, quotas & plans** — Clerk auth, server-enforced free-tier limits

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + custom shadcn-style components + Framer Motion |
| Database | PostgreSQL + pgvector, via Prisma ORM |
| Auth | Clerk |
| File uploads | UploadThing |
| AI | OpenAI (gpt-4o / gpt-4o-mini + embeddings) |
| Background jobs | Inngest |
| Parsing | unpdf (PDF) · mammoth (DOCX) |

## Architecture (layered)

```
app/ (routes, thin)  →  server/actions + api routes  →  server/services
                         (business logic)  →  server/repositories (Prisma)  →  DB
AI is isolated in lib/ai (versioned prompts, rubrics, Zod-validated outputs).
```

Only repositories touch Prisma; services own logic; routes/actions stay thin.

## Quick Start

```bash
# 1. Install
npm install

# 2. Environment — copy and fill in real credentials
cp .env.example .env.local

# 3. Database (option A: Docker)
npm run db:up
npm run prisma:migrate

# 4. Dev server
npm run dev          # http://localhost:3000
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full setup (credentials for each service)
and Vercel deployment instructions.

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate && next build` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run prisma:migrate` | Apply migrations (dev) |
| `npm run prisma:studio` | Prisma Studio |
| `npm run db:up` / `db:down` | Start/stop local Postgres (Docker) |

## Status

| Check | State |
|-------|-------|
| Production build | ✅ passes |
| Typecheck | ✅ 0 errors |
| Unit tests | ✅ passing |
| Lint | ✅ clean |

## License

Proprietary — © ResumeIQ AI.
