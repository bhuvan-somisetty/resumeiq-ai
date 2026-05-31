# ResumeIQ AI — Documentation

> AI-powered resume analysis SaaS. This `/docs` folder is the single source of truth
> for product, architecture, and execution. **No implementation begins until these are
> reviewed and signed off.**

## Planning Documents

| # | Document | Purpose |
|---|----------|---------|
| 1 | [Product Requirements (PRD)](./01-PRD.md) | What we're building, for whom, and why |
| 2 | [System Architecture](./02-System-Architecture.md) | How the system is structured end-to-end |
| 3 | [Database Schema](./03-Database-Schema.md) | Data model, relationships, indexes |
| 4 | [API Design](./04-API-Design.md) | Endpoints, contracts, errors, auth |
| 5 | [Design System](./05-Design-System.md) | Tokens, components, accessibility |
| 6 | [UI/UX Wireframes](./06-UI-UX-Wireframes.md) | Screen-by-screen layouts & flows |
| 7 | [Folder Structure](./07-Folder-Structure.md) | Repo layout & conventions |
| 8 | [Development Roadmap](./08-Development-Roadmap.md) | Phased delivery plan & milestones |

## TL;DR — The Product

ResumeIQ AI helps **job seekers** and **recruiters** instantly understand how strong a
resume is, how well it matches a specific job description, and exactly what to fix. It
parses any resume (PDF/DOCX), scores it across multiple dimensions, runs ATS-compatibility
checks, performs JD-to-resume gap analysis, and returns concrete, prioritized rewrite
suggestions powered by Claude.

## TL;DR — The Stack (decisions, not options)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14+ (App Router) + TypeScript** | One codebase for UI + API, great DX, Vercel-native |
| Styling | **Tailwind CSS + shadcn/ui (Radix)** | Fast, accessible, ownable components |
| Database | **PostgreSQL + Prisma ORM** | Relational integrity + type-safe queries |
| Vector search | **pgvector** | Semantic JD↔resume matching without a 2nd datastore |
| Auth | **Clerk** | Production auth (orgs, MFA, sessions) without building it |
| File storage | **Cloudflare R2 (S3-compatible)** | Cheap egress for resume files |
| Background jobs | **Inngest** | Durable, serverless-friendly job orchestration for AI pipelines |
| AI | **Anthropic Claude (Opus 4.8 / Sonnet 4.6)** | Core analysis & generation engine |
| Payments | **Stripe** | Subscriptions + usage metering |
| Observability | **Sentry + PostHog + Axiom** | Errors, product analytics, logs |
| Hosting | **Vercel** (app) + managed Postgres (Neon/Supabase) | Low ops overhead |

See [System Architecture](./02-System-Architecture.md) for the full rationale.

## Status

🟡 **Planning** — documents drafted, awaiting cofounder review. Implementation gated on sign-off.
