/** App-wide constants. See /docs/01-PRD.md §1.11 and §1.5. */

export const APP_NAME = "ResumeIQ AI";
export const APP_DESCRIPTION =
  "AI-powered resume analysis: instant scoring, ATS checks, and job-matched rewrites.";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB (authenticated, via UploadThing)

/**
 * Guest uploads stream *through* a serverless function, so they must stay under
 * the platform request-body cap (Vercel ≈ 4.5 MB). 4 MB leaves headroom and
 * still covers virtually every real resume.
 */
export const MAX_GUEST_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

/** Upper bound on extracted resume text sent to the model (cost/abuse guard). */
export const MAX_EXTRACTED_CHARS = 60_000;
/** Upper bound on a pasted job description (matches the API validator). */
export const MAX_JD_CHARS = 20_000;
export const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
} as const;

export type PlanId = "FREE" | "PRO" | "TEAMS";

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceMonthly: number;
  analysesPerMonth: number; // -1 = unlimited
  savedResumes: number; // -1 = unlimited
  jdMatch: boolean;
  exports: boolean;
  deepMode: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceMonthly: 0,
    analysesPerMonth: -1,
    savedResumes: -1,
    jdMatch: true,
    exports: true,
    deepMode: true,
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceMonthly: 19,
    analysesPerMonth: -1,
    savedResumes: -1,
    jdMatch: true,
    exports: true,
    deepMode: true,
  },
  TEAMS: {
    id: "TEAMS",
    name: "Teams",
    priceMonthly: 49,
    analysesPerMonth: -1,
    savedResumes: -1,
    jdMatch: true,
    exports: true,
    deepMode: true,
  },
};

/** Weighted scoring rubric dimensions (see /docs/01-PRD.md §1.5 F2). */
export const SCORE_DIMENSIONS = [
  { key: "impact", label: "Impact & Quantification", weight: 0.3 },
  { key: "clarity", label: "Clarity & Structure", weight: 0.2 },
  { key: "relevance", label: "Relevance & Keywords", weight: 0.2 },
  { key: "ats", label: "ATS Compatibility", weight: 0.15 },
  { key: "completeness", label: "Completeness", weight: 0.15 },
] as const;

export const RUBRIC_VERSION = "score-v1";

export const ROUTES = {
  home: "/",
  pricing: "/pricing",
  signIn: "/sign-in",
  signUp: "/sign-up",
  app: "/app",
  resumes: "/app/resumes",
  jobs: "/app/jobs",
  billing: "/app/billing",
  settings: "/app/settings",
} as const;
