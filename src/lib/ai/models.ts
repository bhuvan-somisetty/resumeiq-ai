/**
 * Model routing. Default to the fast/cost-efficient model; route deep reasoning
 * (JD gap analysis, Pro "deep mode") to the stronger model.
 */
export const MODELS = {
  analysis: process.env.OPENAI_ANALYSIS_MODEL ?? "gpt-4o",
  fast: process.env.OPENAI_FAST_MODEL ?? "gpt-4o-mini",
  embedding: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
} as const;

export const EMBEDDING_DIMENSIONS = 1536;

/** Rough cost table (USD per 1M tokens) for unit-economics logging. */
const COST_PER_MTOK: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

export function estimateCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rate = COST_PER_MTOK[model] ?? COST_PER_MTOK["gpt-4o"]!;
  const dollars =
    (inputTokens / 1_000_000) * rate.input +
    (outputTokens / 1_000_000) * rate.output;
  return Math.round(dollars * 100);
}
