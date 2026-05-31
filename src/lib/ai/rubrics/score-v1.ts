import { SCORE_DIMENSIONS, RUBRIC_VERSION } from "@/lib/constants";
import type { SubScores } from "@/types/domain";

/** Versioned, weighted scoring rubric. */
export const scoreRubricV1 = {
  version: RUBRIC_VERSION,
  dimensions: SCORE_DIMENSIONS,
  describe(): string {
    return SCORE_DIMENSIONS.map(
      (d) => `- ${d.label} (weight ${Math.round(d.weight * 100)}%)`,
    ).join("\n");
  },
};

/** Compute the weighted overall score from sub-scores (deterministic). */
export function weightedOverall(sub: SubScores): number {
  const total = SCORE_DIMENSIONS.reduce(
    (acc, d) => acc + sub[d.key] * d.weight,
    0,
  );
  return Math.round(total);
}
