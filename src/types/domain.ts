/** Shared domain types — the JSON shapes from /docs/03-Database-Schema.md §3.5. */

export interface ParsedResume {
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    links?: string[];
  };
  summary?: string;
  experience: {
    company: string;
    role: string;
    start?: string;
    end?: string;
    bullets: string[];
  }[];
  education: { school: string; degree?: string; year?: string }[];
  skills: string[];
  projects?: { name: string; description?: string; bullets?: string[] }[];
  certifications?: string[];
}

export interface SubScores {
  impact: number;
  clarity: number;
  relevance: number;
  ats: number;
  completeness: number;
}

export type AtsSeverity = "pass" | "warn" | "fail";

export interface AtsFinding {
  id: string;
  severity: AtsSeverity;
  category: "format" | "contact" | "fonts" | "structure" | "parse";
  message: string;
  fix?: string;
}

export interface MatchBreakdown {
  matchScore: number;
  matched: string[];
  weak: string[];
  missing: string[];
  keywordCoverage: { found: number; missing: number; density: number };
}

export type SuggestionCategory =
  | "IMPACT"
  | "CLARITY"
  | "KEYWORDS"
  | "ATS"
  | "STRUCTURE"
  | "CONTENT_GAP";

export type SuggestionPriority = "HIGH" | "MEDIUM" | "LOW";

export interface SuggestionDraft {
  category: SuggestionCategory;
  priority: SuggestionPriority;
  section?: string;
  title: string;
  rationale: string;
  before?: string;
  after?: string;
}
