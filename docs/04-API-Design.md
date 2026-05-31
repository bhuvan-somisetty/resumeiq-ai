# 4. API Design — ResumeIQ AI

**Status:** Draft v1 · **Style:** REST-ish JSON over Next.js Route Handlers + Server Actions

---

## 4.1 Principles

- **Resource-oriented**, JSON in/out, plural nouns: `/api/resumes`, `/api/analyses`.
- **Thin handlers:** validate (Zod) → auth (Clerk) → quota → service → typed response.
- **Async for AI:** mutation returns `202 Accepted` + an id; client polls/streams status.
- **Consistent envelopes** for data and errors (below).
- **Idempotency** on create endpoints via `Idempotency-Key` header where relevant.
- **Versioning:** unversioned in v1 (single client); reserve `/api/v1` namespace if we open a public API.

## 4.2 Conventions

### Auth
All `/api/**` (except webhooks + public health) require a valid Clerk session. The handler
resolves the internal `userId` from the Clerk session — clients never send a userId.

### Response envelope
```jsonc
// success
{ "data": { /* resource */ }, "meta": { /* optional: pagination, etc */ } }

// error
{ "error": { "code": "RESUME_TOO_LARGE", "message": "File exceeds 10MB limit.", "details": {} } }
```

### Status codes
`200` OK · `201` Created · `202` Accepted (async started) · `400` validation ·
`401` unauthenticated · `403` forbidden/quota · `404` not found · `409` conflict ·
`413` payload too large · `429` rate limited · `500` server.

### Error codes (stable, client-switchable)
`UNAUTHENTICATED`, `FORBIDDEN`, `QUOTA_EXCEEDED`, `VALIDATION_ERROR`, `RESUME_TOO_LARGE`,
`UNSUPPORTED_FILE_TYPE`, `PARSE_FAILED`, `ANALYSIS_FAILED`, `NOT_FOUND`, `RATE_LIMITED`,
`BILLING_ERROR`, `INTERNAL`.

### Pagination
Cursor-based: `?limit=20&cursor=<id>` → `meta: { nextCursor, hasMore }`.

### Rate limiting
Per-user + per-IP (Upstash). Tight limits on `upload` and `analyses` create. `429` returns
`Retry-After`.

## 4.3 Endpoint Reference

### Health
```
GET /api/health → 200 { data: { status: "ok", time } }   // public, no auth
```

### Resumes

```
POST   /api/resumes
  body: { title: string }
  → 201 { data: Resume }                       // creates empty resume container

GET    /api/resumes
  query: ?limit&cursor
  → 200 { data: Resume[], meta }

GET    /api/resumes/:id
  → 200 { data: ResumeWithVersions }

PATCH  /api/resumes/:id
  body: { title?: string }
  → 200 { data: Resume }

DELETE /api/resumes/:id
  → 200 { data: { deleted: true } }            // cascades versions/analyses + R2 files
```

### Resume upload (versions)

Two-step signed-upload to keep large files off the app server:

```
POST   /api/resumes/:id/upload-url
  body: { fileName, fileType: "PDF"|"DOCX", fileSize }
  → 200 { data: { uploadUrl, fileKey, versionId } }   // presigned R2 PUT URL
  errors: RESUME_TOO_LARGE, UNSUPPORTED_FILE_TYPE

  // client PUTs the file directly to R2 uploadUrl

POST   /api/resumes/:id/versions/:versionId/commit
  → 202 { data: { versionId, parseStatus: "PROCESSING" } }
  // confirms upload, triggers parse pipeline (Inngest)

GET    /api/resumes/:id/versions/:versionId
  → 200 { data: ResumeVersion }                // includes parseStatus, parsed JSON when done
```

### Job Descriptions

```
POST   /api/job-descriptions
  body: { title?, company?, rawText }
  → 201 { data: JobDescription }               // triggers JD parse + embed (async)

GET    /api/job-descriptions/:id   → 200 { data: JobDescription }
DELETE /api/job-descriptions/:id   → 200 { data: { deleted: true } }
```

### Analyses (core, async)

```
POST   /api/analyses
  headers: Idempotency-Key (recommended)
  body: {
    resumeId: string,
    resumeVersionId?: string,        // defaults to current version
    jobDescriptionId?: string,       // present ⇒ JD_MATCH, else STANDALONE
    deep?: boolean                   // Pro: route to Opus deep mode
  }
  → 202 { data: { analysisId, status: "PENDING" } }
  errors: QUOTA_EXCEEDED (403), NOT_FOUND, VALIDATION_ERROR

GET    /api/analyses
  query: ?resumeId&limit&cursor
  → 200 { data: AnalysisSummary[], meta }

GET    /api/analyses/:id
  → 200 { data: AnalysisFull }       // status; when COMPLETED includes report
  // poll this for progress; FAILED includes failureReason

GET    /api/analyses/:id/status      // lightweight poll target
  → 200 { data: { status, progress?: { step, total } } }

DELETE /api/analyses/:id → 200 { data: { deleted: true } }
```

`AnalysisFull` (COMPLETED) shape:
```jsonc
{
  "id": "...", "status": "COMPLETED", "type": "JD_MATCH",
  "overallScore": 78,
  "subScores": { "impact": 72, "clarity": 85, "relevance": 70, "ats": 88, "completeness": 80 },
  "summary": "Strong structure; quantify impact and add 4 missing JD keywords.",
  "atsReport": { "score": 88, "findings": [ /* AtsFinding[] */ ] },
  "matchResult": {                       // only when JD_MATCH
    "matchScore": 74,
    "matched": ["Python","REST APIs"],
    "weak": ["Kubernetes"],
    "missing": ["Terraform","gRPC"],
    "keywordCoverage": { "found": 14, "missing": 4, "density": 0.62 }
  },
  "suggestions": [
    { "id":"...", "category":"IMPACT", "priority":"HIGH",
      "section":"experience.0.bullets.1", "title":"Quantify this achievement",
      "before":"Improved API performance",
      "after":"Cut p95 API latency 40% (820ms→490ms) by adding Redis caching",
      "rationale":"Recruiters scan for measurable impact; numbers add credibility." }
  ],
  "modelUsed": "claude-sonnet-4-6", "rubricVersion": "score-v1"
}
```

### Suggestions feedback

```
POST   /api/suggestions/:id/feedback
  body: { helpful: boolean }
  → 200 { data: { ok: true } }

PATCH  /api/suggestions/:id
  body: { applied: boolean }
  → 200 { data: Suggestion }
```

### Reports & export

```
POST   /api/analyses/:id/export
  body: { format: "pdf" }
  → 202 { data: { exportId } }          // generates PDF to R2 (Pro feature → metered)

GET    /api/exports/:id
  → 200 { data: { status, downloadUrl? } }   // signed URL when ready

POST   /api/analyses/:id/share
  → 200 { data: { shareUrl, expiresAt } }    // Pro: public read-only link
```

### Billing

```
POST   /api/billing/checkout
  body: { priceId }
  → 200 { data: { checkoutUrl } }       // Stripe Checkout session

POST   /api/billing/portal
  → 200 { data: { portalUrl } }         // Stripe Customer Portal

GET    /api/billing/subscription
  → 200 { data: Subscription }
```

### Usage / account

```
GET    /api/me            → 200 { data: { user, plan, usage: { used, limit, resetsAt } } }
DELETE /api/me            → 202 { data: { scheduled: true } }   // full GDPR account+data delete
GET    /api/me/export     → 202 { data: { exportId } }          // data portability
```

### Webhooks (no Clerk auth; signature-verified)

```
POST /api/webhooks/stripe    // verify Stripe-Signature → update Subscription/Plan
POST /api/webhooks/clerk     // user.created/updated/deleted → sync User row
POST /api/webhooks/inngest   // (internal) pipeline completion fan-out if needed
```

## 4.4 Server Actions vs Route Handlers

- **Server Actions** for form-driven, same-origin mutations tightly coupled to a page
  (create resume, save title, submit JD) — less boilerplate, progressive enhancement.
- **Route Handlers** for: anything polled (status), webhooks, signed-upload, exports,
  billing redirects, and anything that may become a public API. AI analysis kickoff is a
  Route Handler (`POST /api/analyses`) so the client can poll a stable endpoint.

Both call the **same service layer** — no logic duplication.

## 4.5 Contracts & Validation

- Every request body/query validated with a **Zod schema**; schemas live in `lib/validators`
  and are shared with the client for form validation and typed fetch wrappers.
- Response types are inferred from service return types; a typed `apiClient` wraps fetch so
  the frontend gets end-to-end types without a separate codegen step.

## 4.6 Idempotency & Concurrency

- `POST /api/analyses` accepts `Idempotency-Key`; same key within a window returns the same
  `analysisId` (prevents double-charging quota on retries/double-clicks).
- Upload commit is idempotent on `versionId`.
- Quota check + reserve happens atomically in `UsageService` before emitting the AI event.

## 4.7 Security Notes (API)

- Ownership enforced in every query (`where: { id, userId }`); 404 (not 403) on cross-user
  access to avoid leaking existence.
- Signed URLs expire quickly (upload ~5 min, download ~5 min).
- Webhooks verify provider signatures and are replay-protected.
- Rate limits on auth-sensitive and cost-sensitive endpoints; `429 + Retry-After`.
- Payload limits enforced before R2 (size declared up front + verified on commit).

## 4.8 Example Error Responses

```jsonc
// quota
HTTP 403
{ "error": { "code": "QUOTA_EXCEEDED",
  "message": "You've used all 3 free analyses this month.",
  "details": { "limit": 3, "resetsAt": "2026-06-01T00:00:00Z", "upgradeUrl": "/pricing" } } }

// bad file
HTTP 413
{ "error": { "code": "RESUME_TOO_LARGE", "message": "Max file size is 10MB.",
  "details": { "maxBytes": 10485760 } } }
```
