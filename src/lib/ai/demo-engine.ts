import "server-only";
import type {
  ParsedResumeResult,
  AtsReportResult,
  MatchAnalysisResult,
  SuggestionsResult,
  ResumeScoreResult,
} from "@/lib/ai/schemas";
import type { AiUsage, FullAnalysisInput, FullAnalysisOutput } from "@/lib/ai/engine";

/**
 * Deterministic, offline stand-in for the OpenAI pipeline used in demo mode.
 * Derives plausible, schema-valid results from the *real* extracted resume text
 * (we still parse the actual PDF/DOCX) so the journey is demonstrable end-to-end
 * without an API key. Same input → same output; no randomness, no network.
 */

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "are", "our", "will", "have",
  "this", "that", "from", "they", "their", "them", "who", "what", "when",
  "able", "must", "should", "would", "could", "into", "out", "about", "team",
  "work", "role", "job", "company", "experience", "years", "year", "plus",
  "etc", "including", "across", "within", "using", "use", "used", "well",
]);

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z+#.]{2,}/g) ?? []).filter(
    (w) => !STOPWORDS.has(w),
  );
}

const COMMON_SKILLS = [
  "javascript", "typescript", "python", "java", "go", "rust", "react",
  "node", "next.js", "sql", "postgresql", "aws", "docker", "kubernetes",
  "graphql", "redis", "kafka", "terraform", "ci/cd", "git", "rest", "api",
];

function emailIn(text: string): string | undefined {
  return text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
}
function phoneIn(text: string): string | undefined {
  return text.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim();
}
function linksIn(text: string): string[] {
  return Array.from(
    new Set(text.match(/(https?:\/\/[^\s]+|(?:www\.|linkedin\.com|github\.com)[^\s]+)/gi) ?? []),
  ).slice(0, 5);
}

/** Heuristic structured parse from raw resume text. */
export function demoParseResume(rawText: string): {
  data: ParsedResumeResult;
  usage: AiUsage;
} {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const name = lines[0] && lines[0].length <= 60 ? lines[0] : undefined;
  const lower = rawText.toLowerCase();
  const skills = COMMON_SKILLS.filter((s) => lower.includes(s)).map((s) =>
    s.replace(/\b\w/g, (c) => c.toUpperCase()),
  );

  // Bullet-like lines become experience highlights under a single inferred role.
  const bullets = lines
    .filter((l) => /^[-•*]/.test(l) || /\d/.test(l))
    .map((l) => l.replace(/^[-•*]\s*/, ""))
    .slice(0, 6);

  const experience: ParsedResumeResult["experience"] = bullets.length
    ? [
        {
          company: "Experience (parsed)",
          role: name ? "Candidate" : "Professional",
          bullets,
        },
      ]
    : [];

  const eduLine = lines.find((l) =>
    /university|college|b\.?s\.?|m\.?s\.?|bachelor|master|degree/i.test(l),
  );
  const education: ParsedResumeResult["education"] = eduLine
    ? [{ school: eduLine.slice(0, 120) }]
    : [];

  return {
    data: {
      contact: {
        name,
        email: emailIn(rawText),
        phone: phoneIn(rawText),
        links: linksIn(rawText),
      },
      summary: lines.slice(1, 3).join(" ").slice(0, 280) || undefined,
      experience,
      education,
      skills,
    },
    usage: demoUsage(),
  };
}

function demoUsage(): AiUsage {
  return { model: "demo-stub", tokensInput: 0, tokensOutput: 0, costCents: 0 };
}

function buildScore(rawText: string, parsedJson: string): ResumeScoreResult {
  const text = `${rawText}\n${parsedJson}`;
  const words = tokens(rawText);
  const numbers = (rawText.match(/\d+%?/g) ?? []).length;
  const skills = COMMON_SKILLS.filter((s) => text.toLowerCase().includes(s)).length;
  const bullets = (rawText.match(/^[\s]*[-•*]/gm) ?? []).length;

  const impact = clamp(48 + numbers * 4, 40, 95);
  const clarity = clamp(55 + bullets * 3, 45, 95);
  const relevance = clamp(50 + skills * 5, 40, 96);
  const ats = clamp(70 + (emailIn(rawText) ? 8 : 0) + (skills > 3 ? 10 : 0), 50, 98);
  const completeness = clamp(
    40 + Math.min(40, Math.floor(words.length / 25)) + skills * 2,
    40,
    97,
  );

  const subScores = { impact, clarity, relevance, ats, completeness };
  const overall = clamp(
    impact * 0.3 + clarity * 0.2 + relevance * 0.2 + ats * 0.15 + completeness * 0.15,
  );

  return {
    overallScore: overall,
    subScores,
    summary:
      `This resume scores ${overall}/100. ${
        numbers < 4
          ? "Quantify more achievements with concrete metrics to lift impact. "
          : "Strong use of measurable results. "
      }${
        skills < 4
          ? "Surface more relevant technical keywords near the top."
          : "Keyword coverage looks healthy for ATS parsing."
      }`.trim(),
  };
}

function buildAts(rawText: string): AtsReportResult {
  const hasEmail = !!emailIn(rawText);
  const hasPhone = !!phoneIn(rawText);
  const hasBullets = /^[\s]*[-•*]/m.test(rawText);
  const tooLong = rawText.length > 12000;

  const findings: AtsReportResult["findings"] = [
    {
      id: "contact",
      severity: hasEmail && hasPhone ? "pass" : "warn",
      category: "contact",
      message:
        hasEmail && hasPhone
          ? "Contact details (email and phone) are present and machine-readable."
          : "Add both an email and a phone number in plain text near the top.",
      fix: hasEmail && hasPhone ? undefined : "Put contact info as selectable text, not inside an image or header.",
    },
    {
      id: "structure",
      severity: hasBullets ? "pass" : "warn",
      category: "structure",
      message: hasBullets
        ? "Bulleted experience sections parse cleanly into an ATS."
        : "Use standard bullet points for experience so an ATS can segment it.",
      fix: hasBullets ? undefined : "Convert dense paragraphs into concise bullets.",
    },
    {
      id: "format",
      severity: tooLong ? "warn" : "pass",
      category: "format",
      message: tooLong
        ? "Resume is quite long — trim to the most relevant two pages."
        : "Length and formatting are within ATS-friendly limits.",
    },
    {
      id: "parse",
      severity: "pass",
      category: "parse",
      message: "Text extracted successfully — no scanned-image or font issues detected.",
    },
  ];

  const passes = findings.filter((f) => f.severity === "pass").length;
  return {
    score: clamp(60 + passes * 9, 55, 98),
    findings,
  };
}

function buildMatch(rawText: string, jdText: string): MatchAnalysisResult {
  const resumeSet = new Set(tokens(rawText));
  const jdKeywords = Array.from(new Set(tokens(jdText))).filter(
    (w) => w.length > 3,
  );
  // Rank JD keywords by frequency for a stable, meaningful selection.
  const freq = new Map<string, number>();
  for (const w of tokens(jdText)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const ranked = jdKeywords.sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0));

  const matched: string[] = [];
  const missing: string[] = [];
  for (const w of ranked) {
    if (resumeSet.has(w)) matched.push(w);
    else missing.push(w);
    if (matched.length + missing.length >= 24) break;
  }
  const weak = matched.slice(Math.ceil(matched.length * 0.7));
  const total = matched.length + missing.length || 1;

  return {
    matchScore: clamp((matched.length / total) * 100, 20, 98),
    matched: matched.slice(0, 14),
    weak: weak.slice(0, 6),
    missing: missing.slice(0, 12),
    keywordCoverage: {
      found: matched.length,
      missing: missing.length,
      density: Math.round((matched.length / total) * 100) / 100,
    },
  };
}

function buildSuggestions(
  score: ResumeScoreResult,
  hasJd: boolean,
): SuggestionsResult["suggestions"] {
  const out: SuggestionsResult["suggestions"] = [];
  const s = score.subScores;

  if (s.impact < 80) {
    out.push({
      category: "IMPACT",
      priority: "HIGH",
      section: "Experience",
      title: "Quantify your top achievements",
      rationale:
        "Recruiters scan for measurable outcomes. Bullets with numbers (%, $, time saved, scale) are far more persuasive than duty descriptions.",
      before: "Responsible for improving the checkout flow.",
      after: "Rebuilt the checkout flow, lifting conversion 18% and cutting load time from 4s to 1.2s.",
    });
  }
  if (s.relevance < 80) {
    out.push({
      category: "KEYWORDS",
      priority: hasJd ? "HIGH" : "MEDIUM",
      section: "Skills",
      title: "Surface relevant keywords earlier",
      rationale:
        "ATS and recruiters weight the top third of the page heavily. Move your most relevant tools and skills into a summary or skills band near the top.",
    });
  }
  if (s.clarity < 80) {
    out.push({
      category: "CLARITY",
      priority: "MEDIUM",
      section: "Formatting",
      title: "Tighten bullet structure",
      rationale:
        "Lead each bullet with a strong action verb and keep it to one line. Consistent structure improves scannability and parsing.",
    });
  }
  out.push({
    category: "ATS",
    priority: "LOW",
    section: "Layout",
    title: "Keep a single-column, text-based layout",
    rationale:
      "Multi-column layouts and text inside images frequently break ATS parsing. A clean single column guarantees your content is read.",
  });

  return out;
}

/** Full deterministic analysis used in demo mode. */
export function demoFullAnalysis(input: FullAnalysisInput): FullAnalysisOutput {
  const score = buildScore(input.rawText, input.parsedJson);
  const ats = buildAts(input.rawText);
  const match = input.jdText ? buildMatch(input.rawText, input.jdText) : undefined;
  const suggestions = buildSuggestions(score, !!input.jdText);

  return { score, ats, match, suggestions, usage: demoUsage() };
}
