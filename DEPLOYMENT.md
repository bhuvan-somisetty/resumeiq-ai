# Deployment Guide — ResumeIQ AI

This guide covers local setup, obtaining each third-party credential, and deploying to
Vercel. The app **builds** with placeholder credentials, but **running real features**
(auth, upload, parsing, AI scoring) requires real keys + a database.

---

## 1. Prerequisites

- Node.js ≥ 20
- A PostgreSQL database (local Docker, or hosted: Neon / Supabase / Vercel Postgres)
- Accounts for: **Clerk**, **OpenAI**, **UploadThing**, and optionally **Inngest**

---

## 2. Environment variables

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it | Required for |
|----------|-----------------|--------------|
| `DATABASE_URL` | Your Postgres (Neon/Supabase/Docker) | Everything |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk dashboard](https://dashboard.clerk.com) → API Keys | Auth |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys | Auth |
| `CLERK_WEBHOOK_SECRET` | Clerk dashboard → Webhooks (after creating endpoint) | User sync |
| `OPENAI_API_KEY` | [OpenAI](https://platform.openai.com/api-keys) | AI scoring, parsing, suggestions |
| `UPLOADTHING_TOKEN` | [UploadThing dashboard](https://uploadthing.com/dashboard) | Resume upload |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | [Inngest](https://app.inngest.com) | Background jobs (optional for MVP) |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL | Metadata, redirects |

---

## 3. Database setup

### Option A — Local (Docker)

```bash
npm run db:up            # starts pgvector/pgvector:pg16 on :5432
npm run prisma:migrate   # creates tables
npm run prisma:seed      # optional: demo user
```

The `docker-compose.yml` uses `resumeiq:resumeiq@localhost:5432/resumeiq`, which matches
the default `DATABASE_URL` in `.env.example`.

### Option B — Hosted (Neon / Supabase / Vercel Postgres)

1. Create a Postgres database and enable the `pgvector` extension.
2. Put its connection string in `DATABASE_URL`.
3. Apply the schema:

```bash
npx prisma migrate deploy
```

### pgvector columns

Embedding columns + HNSW indexes are added via a raw-SQL migration (see
[`docs/03-Database-Schema.md` §3.6](./docs/03-Database-Schema.md)). Run that SQL after the
Prisma migrate when you enable semantic JD matching.

---

## 4. Clerk setup

1. Create a Clerk application.
2. Copy the publishable + secret keys into `.env.local`.
3. Configure sign-in/sign-up URLs to `/sign-in` and `/sign-up` (already set via env).
4. **Webhook** (for user sync): add an endpoint at
   `https://<your-domain>/api/webhooks/clerk`, subscribe to `user.created`,
   `user.updated`, `user.deleted`, and copy the signing secret into `CLERK_WEBHOOK_SECRET`.

---

## 5. UploadThing setup

1. Create an app in the UploadThing dashboard.
2. Copy the `UPLOADTHING_TOKEN` into `.env.local`.
3. The file route is already defined at `src/app/api/uploadthing/core.ts` (`resumeUploader`,
   PDF/DOCX, ≤10MB).

---

## 6. OpenAI setup

1. Create an API key.
2. Set `OPENAI_API_KEY`. Defaults: `gpt-4o` (analysis), `gpt-4o-mini` (fast), and
   `text-embedding-3-small` (embeddings) — override via the `OPENAI_*_MODEL` vars.

---

## 7. Local verification

```bash
npm run build      # prisma generate && next build  — must pass
npm run test       # unit tests
npm run dev        # http://localhost:3000
```

Smoke test:
- `GET /api/health` → `{"data":{"status":"ok",...}}`
- `/` and `/pricing` render
- `/app` redirects to sign-in when signed out (Clerk middleware)

---

## 8. Deploy to Vercel

### Via dashboard
1. Push this repo to GitHub (see below).
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Framework preset: **Next.js** (auto-detected).
4. Add **all** environment variables from `.env.example` with real values
   (Project → Settings → Environment Variables).
5. Deploy. The build runs `prisma generate && next build`.

### Via CLI
```bash
npm i -g vercel
vercel            # link project
vercel env add    # add each variable (or paste in dashboard)
vercel --prod
```

### Post-deploy
- Update `NEXT_PUBLIC_APP_URL` to the production URL.
- Point the Clerk webhook at `https://<prod>/api/webhooks/clerk`.
- Run `npx prisma migrate deploy` against the production DB (or via a build/release step).

---

## 9. Notes

- `next.config.ts` sets `output: "standalone"` for portable server bundles (also Docker-ready
  via the included `Dockerfile`).
- Lint runs as a separate CI step; `next build` skips it for speed (`eslint.ignoreDuringBuilds`).
- CI (`.github/workflows/ci.yml`) runs typecheck → lint → test → build on every push/PR.
