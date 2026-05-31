# 8. Development Roadmap — ResumeIQ AI

**Status:** Draft v1 · Phased, milestone-driven. Estimates assume a small founding team.

---

## 8.1 Philosophy

- **Thin vertical slices.** Each phase ships something demoable end-to-end, not a layer.
- **De-risk early.** Parsing accuracy and AI output quality are the two biggest risks —
  prove them in Phase 1, not Phase 4.
- **Gate on quality.** Each phase has explicit exit criteria; don't move on until met.
- **Instrument from day one.** Errors + analytics from Phase 0 so we learn as we build.

## 8.2 Phase Overview

| Phase | Theme | Outcome | Est. |
|-------|-------|---------|------|
| 0 | Foundation | Repo, CI, auth, DB, deploy skeleton | ~1 wk |
| 1 | Parse + Score (vertical slice) | Upload → real ResumeScore + ATS | ~2 wk |
| 2 | JD Match + Suggestions | Core value: gaps + rewrites | ~2 wk |
| 3 | Accounts, Billing, Quotas | Monetizable product | ~1.5 wk |
| 4 | History, Exports, Polish | Retention + shareability | ~1.5 wk |
| 5 | Hardening & Launch | Security, perf, observability, beta | ~1.5 wk |
| 6+ | Post-launch / B2B | Recruiter features, integrations | ongoing |

> Estimates are directional. The dependency order matters more than the week counts.

---

## 8.3 Phase 0 — Foundation (Week 1)

**Goal:** a deployable skeleton everyone can build on.

- [ ] Init Next.js (App Router, TS, Tailwind), ESLint/Prettier, path aliases.
- [ ] shadcn/ui setup + design tokens from [Design System].
- [ ] Prisma + Postgres (Docker local, Neon preview/prod); base schema migrated.
- [ ] Clerk auth wired; `(app)` route group guarded; `User` sync webhook.
- [ ] Service/repo/action layering scaffolded (empty but enforced by lint).
- [ ] CI: typecheck · lint · test · `prisma validate` · build.
- [ ] Sentry + PostHog + structured logger installed.
- [ ] Vercel project + preview deploys per PR; `.env.example` complete.

**Exit criteria:** A signed-in user reaches an empty dashboard on a Vercel preview; CI green.

---

## 8.4 Phase 1 — Parse + Score Vertical Slice (Weeks 2–3)

**Goal:** prove the riskiest path — real resume in, real score out.

- [ ] R2 storage + signed upload-url flow; `FileDropzone` with validation.
- [ ] `ResumeService`: create resume, commit version, store file.
- [ ] Parsing: PDF/DOCX text + structure extraction; **LLM fallback** for messy files.
- [ ] Inngest `parse-resume` function with status updates.
- [ ] `lib/ai`: Anthropic client, prompt caching, `score-v1` rubric, Zod output schemas.
- [ ] `run-analysis` pipeline (steps: parse→score→ATS); model = Sonnet 4.6.
- [ ] ATS deterministic checks + AI review → `AtsReport`.
- [ ] Report UI: `ScoreRing`, `SubScoreBar`, ATS findings; running/skeleton states.
- [ ] AI cost/token logging per analysis.

**Exit criteria:** Upload a real resume → within budget get an explainable ResumeScore +
ATS report persisted and viewable. Parsing works on a test set of 15–20 varied resumes;
scores are stable and reasoning is non-generic. **This is the make-or-break phase.**

---

## 8.5 Phase 2 — JD Match + Suggestions (Weeks 4–5)

**Goal:** ship the differentiated core value.

- [ ] `JobDescription` create + parse + embeddings (pgvector); `JdEmbedding`.
- [ ] `SectionEmbedding` for resume; semantic + keyword matching in `MatchService`.
- [ ] Pipeline `match.gap` step (Opus 4.8 for deep reasoning) → `MatchResult`.
- [ ] `suggest.generate` step → prioritized, bullet-level `Suggestion`s (before→after).
- [ ] Report UI: Match column, `GapList`, `KeywordChip`s, `SuggestionCard`,
      `BeforeAfterDiff`; suggestion apply/helpful feedback.
- [ ] Guardrails verified: no invented experience; injection-safe handling of JD/resume text.

**Exit criteria:** Paste a JD → get a MatchScore, accurate matched/weak/missing breakdown,
and concrete rewrites that reference real resume content. Suggestion "helpful" feedback
captured.

---

## 8.6 Phase 3 — Accounts, Billing, Quotas (Week 6)

**Goal:** make it monetizable and safe to open up.

- [ ] `UsageService`: atomic quota check + reserve; free-tier limits enforced server-side.
- [ ] `UsageMeter` UI + contextual upgrade nudges (quota hit, locked features).
- [ ] Stripe: Checkout, Customer Portal, webhooks → `Subscription`/`Plan` source of truth.
- [ ] Pricing page; Pro unlocks (unlimited, JD match exports, Opus deep mode).
- [ ] Rate limiting on upload/analysis/auth endpoints.

**Exit criteria:** Free user hits quota and is blocked gracefully; upgrades via Stripe;
plan reflected from DB; webhooks idempotent and signature-verified.

---

## 8.7 Phase 4 — History, Exports, Polish (Week 7)

**Goal:** retention + shareability.

- [ ] Resume versions UI; `ScoreDeltaBadge` (improvement over time).
- [ ] Analysis history lists; re-run on new version.
- [ ] PDF export (Inngest `generate-export`) + signed download; share links (Pro).
- [ ] Empty/error/loading states audited across all screens.
- [ ] Dark mode, responsive passes, accessibility audit (WCAG AA).
- [ ] Microcopy pass per [Design System §5.11].

**Exit criteria:** A user can track score improvement across versions, export/share a report,
and the app passes an a11y + responsive review.

---

## 8.8 Phase 5 — Hardening & Launch (Week 8)

**Goal:** production-ready.

- [ ] Security review: ownership checks, signed URLs, secrets, webhook replay, rate limits.
- [ ] GDPR: data export + full account/data hard-delete (cascade + R2 cleanup) verified.
- [ ] Load/perf test: AI throughput under concurrency; DB indexes validated; caching.
- [ ] Observability dashboards: AI cost/analysis, step success rates, funnels, uptime alerts.
- [ ] Degraded-mode handling when AI provider is down.
- [ ] E2E happy-path suite green in CI; runbook + on-call basics.
- [ ] Private beta → fix list → public launch.

**Exit criteria:** All NFRs from [PRD §1.8] met; acceptance criteria [PRD §1.14] pass end
to end in production.

---

## 8.9 Phase 6+ — Post-Launch / B2B (Ongoing)

- Recruiter mode: bulk upload, rank candidates vs. a JD, shared workspaces (Teams plan).
- ATS integrations (Greenhouse/Lever), browser extension, application autofill.
- Multi-language analysis; industry-specific rubrics.
- Resume editor (apply suggestions in-app) — only if demand validates.
- Rubric experiments + A/B on suggestion quality; usage-based pricing.

---

## 8.10 Cross-Cutting Workstreams (every phase)

- **AI quality:** maintain an eval set of resumes/JDs; regression-test prompts & rubrics on
  every prompt change. Treat prompts/rubrics as versioned code.
- **Cost watch:** track cost/analysis; tune model routing, caching, truncation.
- **Testing:** services + parsing + AI-schema unit tests; e2e for the money path.
- **Docs:** keep `/docs` current as decisions change (these are living documents).

## 8.11 Definition of Done (per feature)

Typed (no `any`) · validated (Zod at boundaries) · tested (unit + e2e for critical paths) ·
all UI states (loading/empty/error/success) · accessible · logged/observable ·
owner-scoped & quota-aware · docs updated.

## 8.12 Key Milestones

| Milestone | Phase | Signal |
|-----------|-------|--------|
| **M1 — "It scores"** | 1 | Real resume → explainable score + ATS |
| **M2 — "It's valuable"** | 2 | JD match + actionable rewrites |
| **M3 — "It's a business"** | 3 | Paid plans + quotas live |
| **M4 — "It retains"** | 4 | Score-over-time + exports/sharing |
| **M5 — "It's live"** | 5 | Public launch, NFRs met |

## 8.13 Top Risks & Sequencing Rationale

1. **Parsing & AI quality first (Phase 1–2)** — if these don't work, nothing else matters.
2. **Billing before launch, after value** — don't gate learning behind payments too early.
3. **Hardening as its own phase** — security/privacy/perf are not afterthoughts for a PII product.
