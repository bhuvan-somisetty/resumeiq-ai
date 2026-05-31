import { z } from "zod";

/**
 * Zod schemas for structured LLM outputs. Every model response is validated
 * against these before persistence (see /docs/02-System-Architecture.md §2.4).
 */

const score = z.number().int().min(0).max(100);

export const parsedResumeSchema = z.object({
  contact: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    links: z.array(z.string()).optional(),
  }),
  summary: z.string().optional(),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      start: z.string().optional(),
      end: z.string().optional(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string().optional(),
      year: z.string().optional(),
    }),
  ),
  skills: z.array(z.string()),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        bullets: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  certifications: z.array(z.string()).optional(),
});

export const subScoresSchema = z.object({
  impact: score,
  clarity: score,
  relevance: score,
  ats: score,
  completeness: score,
});

export const resumeScoreResultSchema = z.object({
  overallScore: score,
  subScores: subScoresSchema,
  summary: z.string().min(1),
});

export const atsFindingSchema = z.object({
  id: z.string(),
  severity: z.enum(["pass", "warn", "fail"]),
  category: z.enum(["format", "contact", "fonts", "structure", "parse"]),
  message: z.string(),
  fix: z.string().optional(),
});

export const atsReportResultSchema = z.object({
  score,
  findings: z.array(atsFindingSchema),
});

export const matchResultSchema = z.object({
  matchScore: score,
  matched: z.array(z.string()),
  weak: z.array(z.string()),
  missing: z.array(z.string()),
  keywordCoverage: z.object({
    found: z.number().int().min(0),
    missing: z.number().int().min(0),
    density: z.number().min(0).max(1),
  }),
});

export const suggestionSchema = z.object({
  category: z.enum([
    "IMPACT",
    "CLARITY",
    "KEYWORDS",
    "ATS",
    "STRUCTURE",
    "CONTENT_GAP",
  ]),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  section: z.string().optional(),
  title: z.string(),
  rationale: z.string(),
  before: z.string().optional(),
  after: z.string().optional(),
});

export const suggestionsResultSchema = z.object({
  suggestions: z.array(suggestionSchema),
});

export type ParsedResumeResult = z.infer<typeof parsedResumeSchema>;
export type ResumeScoreResult = z.infer<typeof resumeScoreResultSchema>;
export type AtsReportResult = z.infer<typeof atsReportResultSchema>;
export type MatchAnalysisResult = z.infer<typeof matchResultSchema>;
export type SuggestionsResult = z.infer<typeof suggestionsResultSchema>;
