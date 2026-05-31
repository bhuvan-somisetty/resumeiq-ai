# ResumeIQ AI — Production Deployment Guide

Step-by-step instructions to take ResumeIQ AI from this repository to a live
production URL on **Vercel**, backed by **Neon** (PostgreSQL), **Clerk** (auth),
**OpenAI** (analysis), and **UploadThing** (file storage for signed-in users).

> The app runs in a self-contained **demo mode** when Clerk keys are placeholders.
> Setting **real Clerk keys** automatically switches every subsystem (auth, DB,
> upload, AI) to its production implementation. Production = real keys.

---

## 0. Accounts you need to create

| Service | Why | Plan | Sign up |
|---|---|---|---|
| **Vercel** | Hosting / build / serverless | Hobby works; **Pro** recommended (longer function timeouts) | https://vercel.com/signup |
| **Neon** | Production PostgreSQL (pgvector) | Free tier is fine to launch | https://neon.tech |
| **Clerk** | Authentication (sign in / sign up / sessions) | Free tier is fine | https://dashboard.clerk.com |
| **OpenAI** | Resume parsing, scoring, suggestions | Pay-as-you-go (billing required) | https://platform.openai.com |
| **UploadThing** | Stores uploaded resumes for **signed-in** users | Free tier is fine | https://uploadthing.com |
| **GitHub** | Source Vercel deploys from | Free | https://github.com |

> Guests can analyze without UploadThing (their file is processed in memory and
> never stored). UploadThing is only needed for **signed-in** users' saved uploads.

---

## 1. Secrets you must provide (and where they come from)

Collect these before deploying. Exact "where to paste" is in **Step 6**.

| Variable | Example / format | Where to get it |
|---|---|---|
| `DATABASE_URL` | `postgresql://USER:PASS@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require` | Neon → Connection string → **Pooled** |
| `DIRECT_URL` | `postgresql://USER:PASS@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=require` | Neon → Connection string → **Direct** (untick "pooled") |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_…` | Clerk → API keys |
| `CLERK_SECRET_KEY` | `sk_live_…` | Clerk → API keys |
| `CLERK_WEBHOOK_SECRET` | `whsec_…` | Clerk → Webhooks (created in Step 8) — **optional** |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | constant (paste as-is) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | constant |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/app` | constant |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/app` | constant |
| `OPENAI_API_KEY` | `sk-…` | OpenAI → API keys |
| `OPENAI_ANALYSIS_MODEL` | `gpt-4o` | constant — **optional** (defaults to `gpt-4o`) |
| `OPENAI_FAST_MODEL` | `gpt-4o-mini` | constant — **optional** |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | constant — **optional** |
| `UPLOADTHING_TOKEN` | long token | UploadThing → API Keys (V7 token) |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | your Vercel URL (set after first deploy) |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | — | **not required** for MVP (analysis runs synchronously) |

Minimum set to be fully functional: **DATABASE_URL, DIRECT_URL, the 2 Clerk keys,
the 4 Clerk URL constants, OPENAI_API_KEY, UPLOADTHING_TOKEN, NEXT_PUBLIC_APP_URL.**

---

## 2. Push the code to GitHub

From the project root:

```bash
git add -A
git commit -m "Production deployment prep"
git push origin main
```

(If the remote isn't set yet: create an empty GitHub repo, then
`git remote add origin https://github.com/<you>/resumeiq-ai.git && git push -u origin main`.)

---

## 3. Create the Neon database

1. https://neon.tech → **New Project** (pick a region close to your Vercel region).
2. After creation, open **Connection Details**.
3. Copy **two** connection strings (toggle the "Pooled connection" switch):
   - **Pooled** (host contains `-pooler`) → this is `DATABASE_URL`
   - **Direct** (no `-pooler`) → this is `DIRECT_URL`
4. Ensure both end with `?sslmode=require`.
5. pgvector is supported on Neon and is enabled automatically by the migration
   (`CREATE EXTENSION IF NOT EXISTS "vector"`). No manual action needed.

---

## 4. Create the Clerk application (production)

1. https://dashboard.clerk.com → **Create application** (enable Email + any social logins you want).
2. **API keys** → copy the **Publishable key** (`pk_live_…`) and **Secret key** (`sk_live_…`).
3. **Paths** → set Sign-in URL = `/sign-in`, Sign-up URL = `/sign-up`
   (these are also passed via the env constants above).
4. Add your production domain under **Domains** once you have the Vercel URL.
5. (Webhook is configured later, in Step 8 — optional.)

---

## 5. Create OpenAI + UploadThing keys

- **OpenAI**: https://platform.openai.com/api-keys → **Create new secret key** → `OPENAI_API_KEY`.
  Make sure billing is set up (add a payment method / credits), or analysis calls will 401/429.
- **UploadThing**: https://uploadthing.com/dashboard → create an app → **API Keys** →
  copy the token → `UPLOADTHING_TOKEN`.

---

## 6. Import to Vercel and paste env vars

1. https://vercel.com/new → **Import** your GitHub repo.
2. Framework preset auto-detects **Next.js**. Leave build settings default
   (the repo's `vercel.json` sets the build command to `prisma generate && next build`).
3. Open **Settings → Environment Variables** and add **every** variable from Step 1
   to the **Production** environment (and Preview if you want preview deploys to work).
   Paste each name and value exactly. For the constants, paste the literal values
   (`/sign-in`, `/app`, `gpt-4o`, …).
4. For `NEXT_PUBLIC_APP_URL`, put a placeholder for now (e.g. `https://example.vercel.app`);
   you'll correct it in Step 9.
5. Click **Deploy**.

> ⚠️ Set the database + Clerk + OpenAI vars **before** the first deploy. If they're
> missing, the app falls back to demo mode or fails at runtime.

---

## 7. Apply the database schema (migrations)

The Vercel build does **not** run migrations (intentionally). Apply them once from
your machine, pointing at Neon. Run from the project root:

```bash
# macOS/Linux
DATABASE_URL="<your Neon POOLED url>" DIRECT_URL="<your Neon DIRECT url>" npx prisma migrate deploy
```

```powershell
# Windows PowerShell
$env:DATABASE_URL="<your Neon POOLED url>"; $env:DIRECT_URL="<your Neon DIRECT url>"; npx prisma migrate deploy
```

Expected output: `1 migration found` → `Applying migration 20260601000000_init` → success.
Re-run after any future schema change. (Verify with `npx prisma studio` if desired.)

---

## 8. (Optional) Clerk webhook for user sync

The app lazily provisions a user row on first `/app` visit, so this is optional.
For instant create/update/delete sync:

1. Clerk dashboard → **Webhooks → Add Endpoint**:
   `https://<your-domain>/api/webhooks/clerk`
2. Subscribe to `user.created`, `user.updated`, `user.deleted`.
3. Copy the **Signing secret** (`whsec_…`) into Vercel as `CLERK_WEBHOOK_SECRET`, then redeploy.

---

## 9. Finalize the domain

1. Copy your live Vercel URL (e.g. `https://resumeiq-ai.vercel.app`).
2. Vercel → Settings → Environment Variables → set `NEXT_PUBLIC_APP_URL` to that URL.
3. Clerk → **Domains** → add the production domain.
4. **Redeploy** (Vercel → Deployments → … → Redeploy) so the new `NEXT_PUBLIC_APP_URL` takes effect.

---

## 10. Smoke test (verify launch)

Visit the live URL and confirm:

- `GET /api/health` → `{"data":{"status":"ok", ... }}`
- `/` and `/pricing` render; nav "Upload resume" → `/analyze`
- **Guest flow**: `/analyze` → upload a PDF/DOCX → **Analyze my resume** →
  results page (score, ATS, suggestions) renders. Nothing is saved.
- **Signed-in flow**: `/sign-up` → create account → `/app` dashboard →
  **New resume** → upload → parse → **Run analysis** → results saved to history.
- Sign out returns you to `/` and re-locks `/app`.

---

## 11. CLI alternative (instead of the dashboard)

```bash
npm i -g vercel
vercel link                      # link the repo to a Vercel project
vercel env add DATABASE_URL production   # repeat for every variable
# … add all vars …
DATABASE_URL="…" DIRECT_URL="…" npx prisma migrate deploy   # step 7
vercel --prod                    # deploy
```

---

## 12. Remaining risks before going live

1. **Placeholder keys = demo mode in prod.** If Clerk keys aren't real, the live
   site silently runs in-memory demo mode (no real auth/DB). Double-check
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is `pk_live_…` in Vercel.
2. **Unauthenticated, unmetered guest analysis.** `/api/guest/analyze` runs the
   OpenAI pipeline with **no login and no rate limit** — each call costs money and
   is abusable. Before heavy promotion, add rate limiting / a captcha / per-IP caps.
   (All quotas were removed per product decision, so there is no built-in cap.)
3. **Function timeout vs. model latency.** Analysis makes several OpenAI calls;
   `maxDuration` is 60s. On Vercel **Hobby**, 60s is the hard cap — a slow `gpt-4o`
   run can time out. Mitigate with Vercel **Pro** (up to 300s) or set
   `OPENAI_ANALYSIS_MODEL=gpt-4o-mini`.
4. **OpenAI billing.** No credits/billing → 401/429 and every analysis fails. Set a
   usage limit to avoid surprise bills.
5. **Neon connection limits.** Use the **pooled** URL for `DATABASE_URL` (already
   instructed). Using the direct URL at runtime can exhaust connections under load.
6. **pgvector dependency.** The schema declares the `vector` extension. Neon enables
   it automatically; a non-Neon Postgres without pgvector would fail the migration.
   (No vector columns are used yet, so you may drop `extensions = [vector]` from
   `prisma/schema.prisma` if you switch to a Postgres without pgvector.)
7. **Migrations are manual.** Remember to re-run `prisma migrate deploy` after any
   future schema change; the build won't do it for you.
8. **Demo/test endpoints.** `/api/demo/*` are inert in production (they 404 / no-op
   when real Clerk keys are set), but exist in the bundle. No action required.
