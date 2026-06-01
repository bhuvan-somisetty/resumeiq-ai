/**
 * Model routing for Google Gemini (free tier). `gemini-2.0-flash` is fast, JSON-
 * capable, and free; override per-tier via env if needed.
 */
export const MODELS = {
  analysis: process.env.GEMINI_ANALYSIS_MODEL ?? "gemini-2.5-flash-lite",
  fast: process.env.GEMINI_FAST_MODEL ?? "gemini-2.5-flash-lite",
  embedding: process.env.GEMINI_EMBEDDING_MODEL ?? "text-embedding-004",
} as const;

export const EMBEDDING_DIMENSIONS = 768; // Gemini text-embedding-004

/**
 * Cost tracking. The Gemini free tier has no usage cost, so this reports 0;
 * kept for the usage-record plumbing and easy swap to paid tiers later.
 */
export function estimateCostCents(
  _model: string,
  _inputTokens: number,
  _outputTokens: number,
): number {
  return 0;
}
