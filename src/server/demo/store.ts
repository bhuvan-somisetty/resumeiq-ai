import "server-only";
import type {
  Prisma,
  User,
  Resume,
  ResumeVersion,
  JobDescription,
  Analysis,
  AtsReport,
  MatchResult,
  Suggestion,
  UsageRecord,
  Plan,
} from "@/generated/prisma";
import {
  DEMO_CLERK_ID,
  DEMO_EMAIL,
  DEMO_NAME,
} from "@/lib/dev-mode";

/**
 * In-memory data store backing demo mode (no Postgres). State lives on
 * globalThis so it survives Next.js HMR during local development. It resets when
 * the server process restarts — acceptable for an offline demo. Returned objects
 * are shaped to match the exact Prisma include payloads the UI consumes, so the
 * repositories can swap this in transparently.
 */

// ──────────────────────────── Include-shaped payload types ────────────────────────────

export type ResumeListItem = Prisma.ResumeGetPayload<{
  include: {
    versions: true;
    analyses: { select: { id: true; overallScore: true; status: true } };
    _count: { select: { analyses: true } };
  };
}>;

export type ResumeDetail = Prisma.ResumeGetPayload<{
  include: {
    versions: true;
    analyses: { include: { jobDescription: { select: { title: true } } } };
  };
}>;

export type AnalysisDetail = Prisma.AnalysisGetPayload<{
  include: {
    atsReport: true;
    matchResult: true;
    suggestions: true;
    resume: { select: { title: true } };
    jobDescription: { select: { title: true; company: true } };
  };
}>;

export type AnalysisListItem = Prisma.AnalysisGetPayload<{
  include: {
    resume: { select: { title: true } };
    jobDescription: { select: { title: true } };
  };
}>;

// ──────────────────────────── Backing state ────────────────────────────

interface DemoFile {
  bytes: Buffer;
  fileName: string;
}

interface DemoState {
  users: User[];
  resumes: Resume[];
  versions: ResumeVersion[];
  jds: JobDescription[];
  analyses: Analysis[];
  atsReports: AtsReport[];
  matchResults: MatchResult[];
  suggestions: Suggestion[];
  usage: UsageRecord[];
  files: Map<string, DemoFile>;
}

const globalForDemo = globalThis as unknown as { __resumeiqDemo?: DemoState };

const state: DemoState =
  globalForDemo.__resumeiqDemo ??
  (globalForDemo.__resumeiqDemo = {
    users: [],
    resumes: [],
    versions: [],
    jds: [],
    analyses: [],
    atsReports: [],
    matchResults: [],
    suggestions: [],
    usage: [],
    files: new Map(),
  });

// ──────────────────────────── Helpers ────────────────────────────

const id = () => `demo_${crypto.randomUUID().replace(/-/g, "")}`;
const now = () => new Date();

/** Prisma update inputs wrap scalars as `T | { set: T }`; unwrap to the value. */
function val<T>(input: unknown): T | undefined {
  if (input && typeof input === "object" && "set" in input) {
    return (input as { set: T }).set;
  }
  return input as T | undefined;
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

// ──────────────────────────── Users ────────────────────────────

export const demoStore = {
  findUserByClerkId(clerkId: string): User | null {
    return state.users.find((u) => u.clerkId === clerkId) ?? null;
  },

  /** Get the demo user, creating it on first sight. */
  ensureUser(): User {
    const existing = this.findUserByClerkId(DEMO_CLERK_ID);
    if (existing) return existing;
    return this.upsertUser({
      clerkId: DEMO_CLERK_ID,
      email: DEMO_EMAIL,
      name: DEMO_NAME,
    });
  },

  upsertUser(data: {
    clerkId: string;
    email: string;
    name?: string | null;
    imageUrl?: string | null;
  }): User {
    const existing = state.users.find((u) => u.clerkId === data.clerkId);
    if (existing) {
      existing.email = data.email;
      if (data.name !== undefined) existing.name = data.name;
      if (data.imageUrl !== undefined) existing.imageUrl = data.imageUrl;
      existing.updatedAt = now();
      return existing;
    }
    const user: User = {
      id: id(),
      clerkId: data.clerkId,
      email: data.email,
      name: data.name ?? null,
      imageUrl: data.imageUrl ?? null,
      plan: "FREE",
      createdAt: now(),
      updatedAt: now(),
    };
    state.users.push(user);
    return user;
  },

  setUserPlan(clerkId: string, plan: Plan): User {
    const user = state.users.find((u) => u.clerkId === clerkId);
    if (!user) throw new Error("Demo user not found");
    user.plan = plan;
    user.updatedAt = now();
    return user;
  },

  deleteUser(clerkId: string): User {
    const idx = state.users.findIndex((u) => u.clerkId === clerkId);
    const [removed] = state.users.splice(idx, 1);
    return removed!;
  },

  // ──────────────────────────── Resumes ────────────────────────────

  createResume(userId: string, title: string): Resume {
    const resume: Resume = {
      id: id(),
      userId,
      title,
      currentVersionId: null,
      createdAt: now(),
      updatedAt: now(),
    };
    state.resumes.push(resume);
    return resume;
  },

  listResumes(userId: string): ResumeListItem[] {
    return state.resumes
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((r) => {
        const versions = this.versionsFor(r.id);
        const analyses = state.analyses
          .filter((a) => a.resumeId === r.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return {
          ...r,
          versions: versions.slice(0, 1),
          analyses: analyses.slice(0, 1).map((a) => ({
            id: a.id,
            overallScore: a.overallScore,
            status: a.status,
          })),
          _count: { analyses: analyses.length },
        };
      });
  },

  findResume(idArg: string, userId: string): ResumeDetail | null {
    const r = state.resumes.find((x) => x.id === idArg && x.userId === userId);
    if (!r) return null;
    const analyses = state.analyses
      .filter((a) => a.resumeId === r.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((a) => ({
        ...a,
        jobDescription: a.jobDescriptionId
          ? { title: this.jdTitle(a.jobDescriptionId) }
          : null,
      }));
    return { ...r, versions: this.versionsFor(r.id), analyses };
  },

  versionsFor(resumeId: string): ResumeVersion[] {
    return state.versions
      .filter((v) => v.resumeId === resumeId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  },

  addVersion(
    resumeId: string,
    data: {
      fileKey: string;
      fileUrl: string;
      fileName: string;
      fileType: ResumeVersion["fileType"];
      fileSize: number;
    },
  ): ResumeVersion {
    const count = state.versions.filter((v) => v.resumeId === resumeId).length;
    const version: ResumeVersion = {
      id: id(),
      resumeId,
      versionNumber: count + 1,
      fileKey: data.fileKey,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      parseStatus: "PENDING",
      rawText: null,
      parsed: null,
      parseError: null,
      createdAt: now(),
      updatedAt: now(),
    };
    state.versions.push(version);
    const resume = state.resumes.find((r) => r.id === resumeId);
    if (resume) {
      resume.currentVersionId = version.id;
      resume.updatedAt = now();
    }
    return version;
  },

  updateVersionParse(
    versionId: string,
    data: Prisma.ResumeVersionUpdateInput,
  ): ResumeVersion {
    const version = state.versions.find((v) => v.id === versionId);
    if (!version) throw new Error("Demo version not found");
    const status = val<ResumeVersion["parseStatus"]>(data.parseStatus);
    if (status !== undefined) version.parseStatus = status;
    const rawText = val<string | null>(data.rawText);
    if (rawText !== undefined) version.rawText = rawText;
    if (data.parsed !== undefined)
      version.parsed = data.parsed as ResumeVersion["parsed"];
    const parseError = val<string | null>(data.parseError);
    if (parseError !== undefined) version.parseError = parseError;
    version.updatedAt = now();
    return version;
  },

  findVersion(versionId: string): ResumeVersion | null {
    return state.versions.find((v) => v.id === versionId) ?? null;
  },

  deleteResume(idArg: string, userId: string): { count: number } {
    const before = state.resumes.length;
    state.resumes = state.resumes.filter(
      (r) => !(r.id === idArg && r.userId === userId),
    );
    const count = before - state.resumes.length;
    if (count > 0) {
      state.versions = state.versions.filter((v) => v.resumeId !== idArg);
      state.analyses = state.analyses.filter((a) => a.resumeId !== idArg);
    }
    return { count };
  },

  // ──────────────────────────── Job descriptions ────────────────────────────

  createJd(
    userId: string,
    data: { title?: string; company?: string; rawText: string },
  ): JobDescription {
    const jd: JobDescription = {
      id: id(),
      userId,
      title: data.title ?? null,
      company: data.company ?? null,
      rawText: data.rawText,
      parsed: null,
      createdAt: now(),
      updatedAt: now(),
    };
    state.jds.push(jd);
    return jd;
  },

  findJd(idArg: string, userId: string): JobDescription | null {
    return (
      state.jds.find((j) => j.id === idArg && j.userId === userId) ?? null
    );
  },

  listJds(userId: string): JobDescription[] {
    return state.jds
      .filter((j) => j.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  jdTitle(jdId: string): string | null {
    return state.jds.find((j) => j.id === jdId)?.title ?? null;
  },

  // ──────────────────────────── Analyses ────────────────────────────

  createAnalysis(data: Prisma.AnalysisUncheckedCreateInput): Analysis {
    const analysis: Analysis = {
      id: data.id ?? id(),
      userId: data.userId,
      resumeId: data.resumeId,
      resumeVersionId: data.resumeVersionId,
      jobDescriptionId: data.jobDescriptionId ?? null,
      status: data.status ?? "PENDING",
      type: data.type ?? "STANDALONE",
      overallScore: data.overallScore ?? null,
      subScores: (data.subScores ?? null) as Analysis["subScores"],
      summary: data.summary ?? null,
      rubricVersion: data.rubricVersion ?? null,
      modelUsed: data.modelUsed ?? null,
      tokensInput: data.tokensInput ?? null,
      tokensOutput: data.tokensOutput ?? null,
      costCents: data.costCents ?? null,
      failureReason: data.failureReason ?? null,
      startedAt: (data.startedAt as Date | undefined) ?? null,
      completedAt: (data.completedAt as Date | undefined) ?? null,
      createdAt: now(),
      updatedAt: now(),
    };
    state.analyses.push(analysis);
    return analysis;
  },

  findAnalysis(idArg: string, userId: string): AnalysisDetail | null {
    const a = state.analyses.find(
      (x) => x.id === idArg && x.userId === userId,
    );
    if (!a) return null;
    const resume = state.resumes.find((r) => r.id === a.resumeId);
    const jd = a.jobDescriptionId
      ? state.jds.find((j) => j.id === a.jobDescriptionId)
      : null;
    return {
      ...a,
      atsReport: state.atsReports.find((r) => r.analysisId === a.id) ?? null,
      matchResult:
        state.matchResults.find((m) => m.analysisId === a.id) ?? null,
      suggestions: state.suggestions
        .filter((s) => s.analysisId === a.id)
        .sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime()),
      resume: { title: resume?.title ?? "Resume" },
      jobDescription: jd ? { title: jd.title, company: jd.company } : null,
    };
  },

  updateAnalysis(idArg: string, data: Prisma.AnalysisUpdateInput): Analysis {
    const a = state.analyses.find((x) => x.id === idArg);
    if (!a) throw new Error("Demo analysis not found");
    const status = val<Analysis["status"]>(data.status);
    if (status !== undefined) a.status = status;
    const reason = val<string | null>(data.failureReason);
    if (reason !== undefined) a.failureReason = reason;
    a.updatedAt = now();
    return a;
  },

  listAnalyses(userId: string, take = 10): AnalysisListItem[] {
    return state.analyses
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, take)
      .map((a) => {
        const resume = state.resumes.find((r) => r.id === a.resumeId);
        const jd = a.jobDescriptionId
          ? state.jds.find((j) => j.id === a.jobDescriptionId)
          : null;
        return {
          ...a,
          resume: { title: resume?.title ?? "Resume" },
          jobDescription: jd ? { title: jd.title } : null,
        };
      });
  },

  /** Persist a completed analysis with its ATS report, match, and suggestions. */
  completeAnalysis(
    analysisId: string,
    payload: {
      overallScore: number;
      subScores: unknown;
      summary: string;
      modelUsed: string;
      tokensInput: number;
      tokensOutput: number;
      costCents: number;
      ats: { score: number; findings: unknown };
      match?: {
        matchScore: number;
        matched: unknown;
        weak: unknown;
        missing: unknown;
        keywordCoverage: unknown;
      };
      suggestions: Array<{
        category: Suggestion["category"];
        priority: Suggestion["priority"];
        section?: string | null;
        title: string;
        rationale: string;
        before?: string | null;
        after?: string | null;
      }>;
    },
  ): void {
    const a = state.analyses.find((x) => x.id === analysisId);
    if (!a) throw new Error("Demo analysis not found");
    a.status = "COMPLETED";
    a.overallScore = payload.overallScore;
    a.subScores = payload.subScores as Analysis["subScores"];
    a.summary = payload.summary;
    a.modelUsed = payload.modelUsed;
    a.tokensInput = payload.tokensInput;
    a.tokensOutput = payload.tokensOutput;
    a.costCents = payload.costCents;
    a.completedAt = now();
    a.updatedAt = now();

    state.atsReports.push({
      id: id(),
      analysisId,
      score: payload.ats.score,
      findings: payload.ats.findings as AtsReport["findings"],
      createdAt: now(),
    });

    if (payload.match) {
      state.matchResults.push({
        id: id(),
        analysisId,
        matchScore: payload.match.matchScore,
        matched: payload.match.matched as MatchResult["matched"],
        weak: payload.match.weak as MatchResult["weak"],
        missing: payload.match.missing as MatchResult["missing"],
        keywordCoverage: payload.match
          .keywordCoverage as MatchResult["keywordCoverage"],
        createdAt: now(),
      });
    }

    for (const s of payload.suggestions) {
      state.suggestions.push({
        id: id(),
        analysisId,
        category: s.category,
        priority: s.priority,
        section: s.section ?? null,
        title: s.title,
        rationale: s.rationale,
        before: s.before ?? null,
        after: s.after ?? null,
        applied: false,
        helpful: null,
        createdAt: now(),
      });
    }
  },

  // ──────────────────────────── Usage ────────────────────────────

  monthlyAnalysisCount(userId: string): number {
    const since = startOfMonth();
    return state.usage.filter(
      (u) =>
        u.userId === userId &&
        (u.type === "ANALYSIS_STANDALONE" || u.type === "ANALYSIS_JD_MATCH") &&
        u.createdAt >= since,
    ).length;
  },

  recordUsage(data: {
    userId: string;
    type: UsageRecord["type"];
    analysisId?: string;
    costCents?: number;
  }): UsageRecord {
    const record: UsageRecord = {
      id: id(),
      userId: data.userId,
      type: data.type,
      analysisId: data.analysisId ?? null,
      costCents: data.costCents ?? null,
      metadata: null,
      createdAt: now(),
    };
    state.usage.push(record);
    return record;
  },

  // ──────────────────────────── File bytes ────────────────────────────

  putFile(key: string, file: DemoFile): void {
    state.files.set(key, file);
  },

  getFile(key: string): DemoFile | undefined {
    return state.files.get(key);
  },
};
