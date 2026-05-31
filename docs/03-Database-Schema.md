# 3. Database Schema Design — ResumeIQ AI

**Status:** Draft v1 · **DB:** PostgreSQL 15+ with `pgvector` · **ORM:** Prisma

---

## 3.1 Conventions

- **IDs:** `cuid()` strings (URL-safe, non-enumerable).
- **Timestamps:** `createdAt`, `updatedAt` (UTC) on every table.
- **Soft vs hard delete:** user-facing entities support hard delete (GDPR). `deletedAt`
  used only where we need recoverability (none in v1 except billing audit).
- **Money:** integer cents + currency code. Never floats.
- **Enums:** Postgres enums via Prisma for fixed sets.
- **Ownership:** every user-owned row has `userId`; all queries filter by it.

## 3.2 Entity-Relationship Overview

```
User 1───* Resume 1───* ResumeVersion 1───* Analysis *───1 JobDescription(optional)
  │                                              │
  │                                              ├──1 AtsReport
  │                                              ├──1 MatchResult (if JD)
  │                                              └──* Suggestion
  │
  ├──1 Subscription ──* (Stripe)        Resume 1───* SectionEmbedding (pgvector)
  ├──* UsageRecord                       JobDescription 1───* JdEmbedding (pgvector)
  └──* AuditLog
```

- A **User** has many **Resumes**.
- A **Resume** has many **ResumeVersions** (each upload/re-upload = a version; enables
  score-over-time).
- An **Analysis** is run against one ResumeVersion, optionally targeting a JobDescription.
- Each Analysis produces one **AtsReport**, optionally one **MatchResult**, and many
  **Suggestions**.
- Embeddings are stored per resume section and per JD for semantic matching.

## 3.3 Prisma Schema

```prisma
// schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

// ──────────────────────────── Identity & Billing ────────────────────────────

model User {
  id            String   @id @default(cuid())
  clerkId       String   @unique                 // Clerk user id
  email         String   @unique
  name          String?
  imageUrl      String?
  plan          Plan     @default(FREE)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  resumes       Resume[]
  analyses      Analysis[]
  jobDescriptions JobDescription[]
  subscription  Subscription?
  usageRecords  UsageRecord[]
  auditLogs     AuditLog[]

  @@index([clerkId])
}

enum Plan {
  FREE
  PRO
  TEAMS
}

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId     String             @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?
  status               SubscriptionStatus @default(INCOMPLETE)
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  @@index([stripeCustomerId])
}

enum SubscriptionStatus {
  INCOMPLETE
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}

// ──────────────────────────── Resume domain ────────────────────────────

model Resume {
  id            String          @id @default(cuid())
  userId        String
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  title         String                                    // user label, e.g. "Backend SWE 2026"
  currentVersionId String?      @unique
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  versions      ResumeVersion[]
  analyses      Analysis[]

  @@index([userId])
}

model ResumeVersion {
  id            String           @id @default(cuid())
  resumeId      String
  resume        Resume           @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  versionNumber Int
  // Storage
  fileKey       String                                    // R2 object key (original file)
  fileName      String
  fileType      FileType
  fileSize      Int                                       // bytes
  // Parsing
  parseStatus   ParseStatus      @default(PENDING)
  rawText       String?          @db.Text
  parsed        Json?                                     // structured ParsedResume JSON
  parseError    String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  analyses      Analysis[]
  embeddings    SectionEmbedding[]

  @@unique([resumeId, versionNumber])
  @@index([resumeId])
}

enum FileType {
  PDF
  DOCX
}

enum ParseStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model JobDescription {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String?
  company     String?
  rawText     String        @db.Text
  parsed      Json?                                       // extracted requirements/skills
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  analyses    Analysis[]
  embeddings  JdEmbedding[]

  @@index([userId])
}

// ──────────────────────────── Analysis domain ────────────────────────────

model Analysis {
  id               String         @id @default(cuid())
  userId           String
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  resumeId         String
  resume           Resume         @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  resumeVersionId  String
  resumeVersion    ResumeVersion  @relation(fields: [resumeVersionId], references: [id], onDelete: Cascade)
  jobDescriptionId String?
  jobDescription   JobDescription? @relation(fields: [jobDescriptionId], references: [id], onDelete: SetNull)

  status           AnalysisStatus @default(PENDING)
  type             AnalysisType   @default(STANDALONE)

  // Scores (0–100). Null until computed.
  overallScore     Int?
  subScores        Json?          // { impact, clarity, relevance, ats, completeness }
  summary          String?        @db.Text   // human-readable headline feedback

  // Versioning / audit of the AI run
  rubricVersion    String?
  modelUsed        String?
  tokensInput      Int?
  tokensOutput     Int?
  costCents        Int?
  failureReason    String?

  startedAt        DateTime?
  completedAt      DateTime?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  atsReport        AtsReport?
  matchResult      MatchResult?
  suggestions      Suggestion[]

  @@index([userId])
  @@index([resumeId])
  @@index([status])
}

enum AnalysisStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

enum AnalysisType {
  STANDALONE       // ResumeScore + ATS only
  JD_MATCH         // includes JobDescription gap analysis
}

model AtsReport {
  id          String       @id @default(cuid())
  analysisId  String       @unique
  analysis    Analysis     @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  score       Int                                         // 0–100 ATS compatibility
  findings    Json                                        // AtsFinding[] (see §3.5)
  createdAt   DateTime     @default(now())
}

model MatchResult {
  id            String   @id @default(cuid())
  analysisId    String   @unique
  analysis      Analysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  matchScore    Int                                       // 0–100 JD alignment
  matched       Json                                      // string[] requirements covered
  weak          Json                                      // partially covered
  missing       Json                                      // not found
  keywordCoverage Json                                    // { found, missing, density }
  createdAt     DateTime @default(now())
}

model Suggestion {
  id          String          @id @default(cuid())
  analysisId  String
  analysis    Analysis        @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  category    SuggestionCategory
  priority    SuggestionPriority
  section     String?                                     // e.g. "experience.0.bullets.2"
  title       String
  rationale   String          @db.Text
  before      String?         @db.Text                    // original snippet
  after       String?         @db.Text                    // rewrite-ready suggestion
  applied     Boolean         @default(false)
  helpful     Boolean?                                    // user feedback thumbs
  createdAt   DateTime        @default(now())

  @@index([analysisId])
}

enum SuggestionCategory {
  IMPACT
  CLARITY
  KEYWORDS
  ATS
  STRUCTURE
  CONTENT_GAP
}

enum SuggestionPriority {
  HIGH
  MEDIUM
  LOW
}

// ──────────────────────────── Embeddings (pgvector) ────────────────────────────
// NOTE: vector columns added via raw SQL migration (see §3.6); Prisma manages the rest.

model SectionEmbedding {
  id              String        @id @default(cuid())
  resumeVersionId String
  resumeVersion   ResumeVersion @relation(fields: [resumeVersionId], references: [id], onDelete: Cascade)
  section         String                                  // "summary" | "experience" | ...
  content         String        @db.Text
  // embedding  vector(1536)   -- added via raw SQL
  createdAt       DateTime      @default(now())

  @@index([resumeVersionId])
}

model JdEmbedding {
  id               String         @id @default(cuid())
  jobDescriptionId String
  jobDescription   JobDescription @relation(fields: [jobDescriptionId], references: [id], onDelete: Cascade)
  chunk            String         @db.Text
  // embedding  vector(1536)   -- added via raw SQL
  createdAt        DateTime       @default(now())

  @@index([jobDescriptionId])
}

// ──────────────────────────── Usage & Audit ────────────────────────────

model UsageRecord {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        UsageType
  analysisId  String?
  costCents   Int?
  metadata    Json?
  createdAt   DateTime    @default(now())

  @@index([userId, createdAt])
}

enum UsageType {
  ANALYSIS_STANDALONE
  ANALYSIS_JD_MATCH
  EXPORT
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String                                        // "resume.delete", "billing.upgrade"
  targetId  String?
  metadata  Json?
  ip        String?
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}
```

## 3.4 Why this shape

- **ResumeVersion separation** is the backbone of "track improvement over time" — each
  re-upload is a new version; analyses pin to a version, so score deltas are meaningful.
- **Analysis as the hub** with 1:1 AtsReport / MatchResult and 1:N Suggestions keeps the
  report assembled and queryable, while letting each piece be generated/retried in the pipeline.
- **JobDescription is its own entity** (reusable across analyses; embeddable once).
- **AI run metadata on Analysis** (`rubricVersion`, `modelUsed`, tokens, cost) makes every
  score reproducible and gives us per-analysis unit economics.
- **UsageRecord** drives quota enforcement and future usage-based billing without coupling
  to Stripe.

## 3.5 Embedded JSON shapes (validated by Zod, not DB-enforced)

```ts
// parsed (ResumeVersion.parsed)
type ParsedResume = {
  contact: { name?: string; email?: string; phone?: string; links?: string[] };
  summary?: string;
  experience: { company: string; role: string; start?: string; end?: string; bullets: string[] }[];
  education: { school: string; degree?: string; year?: string }[];
  skills: string[];
  projects?: { name: string; description?: string; bullets?: string[] }[];
  certifications?: string[];
};

// subScores (Analysis.subScores)
type SubScores = { impact: number; clarity: number; relevance: number; ats: number; completeness: number };

// findings (AtsReport.findings)
type AtsFinding = {
  id: string;
  severity: "pass" | "warn" | "fail";
  category: "format" | "contact" | "fonts" | "structure" | "parse";
  message: string;
  fix?: string;
};
```

## 3.6 Indexing & Vector Setup

Raw SQL migration appended after `prisma migrate` to add vector columns + ANN indexes:

```sql
-- enable extension (also declared in schema extensions)
CREATE EXTENSION IF NOT EXISTS vector;

-- add embedding columns
ALTER TABLE "SectionEmbedding" ADD COLUMN embedding vector(1536);
ALTER TABLE "JdEmbedding"      ADD COLUMN embedding vector(1536);

-- approximate-nearest-neighbor indexes (cosine)
CREATE INDEX section_embedding_idx ON "SectionEmbedding"
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX jd_embedding_idx ON "JdEmbedding"
  USING hnsw (embedding vector_cosine_ops);
```

**Other key indexes** (declared in Prisma): `User.clerkId`, `Resume.userId`,
`Analysis.userId/resumeId/status`, `UsageRecord(userId, createdAt)`. These cover the hot
queries: list my resumes, list my analyses, poll status, enforce monthly quota.

## 3.7 Data Lifecycle & Privacy

- **Delete a resume:** cascades to versions, embeddings, analyses, reports, suggestions;
  R2 files deleted by `ResumeService` in the same transaction boundary (job-backed).
- **Delete account:** cascade from User removes all owned data; Stripe customer canceled;
  AuditLog `userId` set null (kept for compliance, no PII).
- **Export:** `ReportService` produces a portable JSON + PDF of the user's data.
- **Retention:** configurable; default keep-until-deleted in v1 (revisit per PRD open questions).

## 3.8 Migration Strategy

- All schema changes via Prisma Migrate, reviewed in PRs.
- Vector/index changes in companion raw-SQL migrations.
- Prod migrations run in CI/CD with a backup snapshot taken first; expand-then-contract for
  breaking changes (add column → backfill → switch → drop).
