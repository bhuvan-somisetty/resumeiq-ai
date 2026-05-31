# 1. Product Requirements Document — ResumeIQ AI

**Status:** Draft v1 · **Owner:** Founders · **Last updated:** 2026-05-31

---

## 1.1 Problem Statement

Job seekers apply to dozens of roles and rarely know *why* they're rejected. Most resumes
are first screened by **Applicant Tracking Systems (ATS)** and then skimmed by humans in
under 10 seconds. Candidates lack objective feedback on:

- Whether their resume is ATS-parseable and keyword-aligned to a target job.
- How they compare against the job's actual requirements (skills/experience gaps).
- What *specifically* to change — in concrete, rewrite-ready language.

Recruiters and small hiring teams face the inverse problem: high volume, inconsistent
resume quality, and no fast way to objectively rank candidates against a role.

**Existing tools** are either shallow keyword-matchers (no real understanding) or generic
AI chat (no structure, no scoring, no persistence). There's room for a focused,
**structured, explainable, JD-aware** analysis product.

## 1.2 Vision

> The fastest way to turn any resume into an interview — and any job description into a
> shortlist — with explainable AI feedback you can act on in minutes.

## 1.3 Goals & Non-Goals

### Goals (v1)
- Parse PDF/DOCX resumes reliably and extract structured data.
- Produce a multi-dimensional **ResumeScore** (0–100) with sub-scores.
- Run **ATS-compatibility** checks with pass/warn/fail findings.
- Perform **JD ↔ resume gap analysis** (matched, missing, weak areas).
- Generate **prioritized, rewrite-ready suggestions** (bullet-level).
- Let users save resumes, re-run analyses, and track improvement over time.
- Monetize via freemium + subscription tiers.

### Non-Goals (v1)
- Building a resume *builder*/WYSIWYG editor (we suggest edits; we don't ship a full editor).
- Job board / application autofill / browser extension (later).
- LinkedIn scraping or integrations (later).
- Multi-language analysis beyond English (later; design for it, don't build it).
- ATS *integrations* (Greenhouse/Lever) for recruiters (later, B2B phase).

## 1.4 Target Users & Personas

| Persona | Description | Primary Job-To-Be-Done |
|---------|-------------|------------------------|
| **Priya — Active Job Seeker** | Mid-level engineer applying to 20+ roles | "Tailor my resume to this job and tell me what to fix" |
| **Marcus — Career Switcher** | Moving industries, unsure how to position | "Show me my gaps vs. roles I want" |
| **Sofia — New Grad** | First real resume, no feedback loop | "Is this resume even good? What's missing?" |
| **Dan — Solo Recruiter / SMB** | Screens 50+ resumes/role | "Rank these candidates against my JD objectively" *(v2)* |

Primary v1 focus: **the job seeker** (Priya/Marcus/Sofia). Recruiter features are v2.

## 1.5 Core Features (v1 scope)

### F1 — Resume Upload & Parsing
- Accept PDF and DOCX, max 10 MB.
- Extract raw text + structure (contact, summary, experience, education, skills, projects).
- Store original file + parsed JSON. Handle parse failures gracefully with guidance.

### F2 — ResumeScore (Standalone Analysis)
Multi-dimensional score (each 0–100, weighted into an overall):
- **Impact & Quantification** — measurable results, strong verbs.
- **Clarity & Structure** — formatting, length, readability.
- **Relevance & Keywords** — industry/role keyword coverage.
- **ATS Compatibility** — parseability, format risks.
- **Completeness** — required sections present.

### F3 — ATS Compatibility Check
- Detect risky elements (tables, columns, images, headers/footers, non-standard fonts,
  unparseable contact info, dense formatting).
- Output: findings list with severity (pass / warn / fail) + fix per finding.

### F4 — JD Match & Gap Analysis
- User pastes a job description.
- System computes a **MatchScore** and breaks down:
  - ✅ Matched skills/requirements
  - ⚠️ Weak / partially-covered areas
  - ❌ Missing requirements
- Semantic matching (pgvector embeddings) + keyword overlap, not just string match.

### F5 — AI Improvement Suggestions
- Prioritized list (high/medium/low impact).
- Bullet-level rewrites: "Before → After" with rationale.
- Section-level guidance (e.g., "Add a Summary targeting X").
- Tone: specific, actionable, never generic.

### F6 — Reports & History
- Persistent analysis reports per resume.
- Re-run analysis after edits; track score delta over time.
- Export report as PDF / shareable link (link = paid).

### F7 — Accounts, Plans & Billing
- Auth (email + OAuth via Clerk).
- Freemium quota (e.g., N analyses/month). Stripe subscriptions for Pro.
- Usage metering & limits enforced server-side.

## 1.6 User Flows (happy paths)

**Flow A — First analysis (free):**
Sign up → Upload resume → Parsing (progress) → ResumeScore + ATS report → see top 3 fixes
→ prompt to add a JD or upgrade.

**Flow B — JD-targeted analysis (core value):**
Open resume → Paste JD → Run match → MatchScore + gap breakdown → prioritized rewrites →
apply edits → re-upload → see score delta.

**Flow C — Upgrade:**
Hit free quota / click locked feature → Pricing → Stripe checkout → unlocked → return to flow.

## 1.7 Functional Requirements (selected, testable)

- FR-1: System SHALL reject non-PDF/DOCX uploads and files > 10 MB with a clear error.
- FR-2: Parsing SHALL complete within 30s p95; long jobs run async with status updates.
- FR-3: Every score SHALL include human-readable reasoning, never a bare number.
- FR-4: AI suggestions SHALL reference specific resume content (no hallucinated experience).
- FR-5: Free users SHALL be limited to the configured monthly analysis quota; limits
  enforced server-side and surfaced in UI before the action is taken.
- FR-6: All AI calls SHALL be logged with token usage, latency, model, and cost.
- FR-7: Users SHALL be able to delete a resume and all derived data (GDPR delete).

## 1.8 Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | API p95 < 500ms (non-AI); AI analysis async with progress |
| **Availability** | 99.5% target; graceful degradation if AI provider is down |
| **Security** | Encryption in transit + at rest; signed URLs; least-privilege |
| **Privacy** | GDPR/CCPA delete & export; resumes are PII — treat accordingly |
| **Scalability** | Stateless app tier; queue-based AI workload; horizontal scale |
| **Cost** | Per-analysis AI cost tracked; model routing (Sonnet default, Opus for deep) |
| **Accessibility** | WCAG 2.1 AA |
| **Observability** | Errors (Sentry), product (PostHog), structured logs (Axiom) |

## 1.9 AI/LLM Requirements

- **Models:** Claude **Sonnet 4.6** as default analysis model (cost/latency); **Opus 4.8**
  for deep/JD-gap reasoning and premium tier. Embeddings via a dedicated embedding model
  for pgvector.
- **Structured outputs:** All analysis returns strict JSON (validated against Zod schemas);
  use tool-use / structured output, not free-text parsing.
- **Prompt caching:** Cache the system prompt + rubric to cut cost on every call.
- **Guardrails:** Reject prompt-injection from resume/JD content; never invent experience;
  cite source spans where possible.
- **Determinism:** Low temperature for scoring; versioned prompts + rubrics for repeatability.
- **Cost control:** Token budgets per request; truncation strategy for huge resumes.

## 1.10 Success Metrics (KPIs)

- **Activation:** % of signups who complete ≥1 full analysis (target > 60%).
- **Core value:** % of activated users who run a JD match (target > 40%).
- **Retention:** 4-week retention of activated users (target > 25%).
- **Conversion:** free → paid (target > 4%).
- **Quality:** % of suggestions rated "helpful" (in-app thumbs) (target > 75%).
- **Unit economics:** AI cost per analysis < target margin threshold.

## 1.11 Monetization

| Tier | Price (placeholder) | Limits |
|------|---------------------|--------|
| **Free** | $0 | 3 analyses/mo, 1 saved resume, no JD match export |
| **Pro** | $19/mo | Unlimited analyses, JD match, exports, history, Opus deep mode |
| **Teams** *(v2)* | $49/seat/mo | Recruiter ranking, shared workspaces, ATS integrations |

## 1.12 Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Resume parsing accuracy (messy PDFs) | Multi-strategy parser + LLM fallback + manual review path |
| AI hallucination (inventing experience) | Strict prompts, source-grounding, schema validation |
| AI cost spikes | Model routing, caching, token budgets, per-plan quotas |
| PII/privacy liability | Encryption, short retention options, delete/export, DPA |
| LLM provider outage | Retry/backoff, queue, degraded-mode messaging |
| Commoditization | Depth of JD gap analysis + score-over-time as moat |

## 1.13 Open Questions

- Final pricing & free-tier quota (validate with early users).
- Recruiter (B2B) timing — v2 immediately after PMF, or parallel?
- Do we offer a resume *editor* eventually, or stay analysis-only?
- Data retention default (delete after N days vs. keep until user deletes)?

## 1.14 Acceptance Criteria for "v1 done"

A new user can sign up, upload a resume, receive a ResumeScore + ATS report + (with a JD)
a gap analysis and prioritized rewrites, see it persisted in history, hit a free quota,
upgrade via Stripe, and delete their data — all within the NFR budgets above.
