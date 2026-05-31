import { describe, it, expect } from "vitest";
import { weightedOverall } from "@/lib/ai/rubrics/score-v1";

describe("weightedOverall", () => {
  it("returns 100 when all sub-scores are 100", () => {
    expect(
      weightedOverall({
        impact: 100,
        clarity: 100,
        relevance: 100,
        ats: 100,
        completeness: 100,
      }),
    ).toBe(100);
  });

  it("returns 0 when all sub-scores are 0", () => {
    expect(
      weightedOverall({
        impact: 0,
        clarity: 0,
        relevance: 0,
        ats: 0,
        completeness: 0,
      }),
    ).toBe(0);
  });

  it("weights impact most heavily", () => {
    const onlyImpact = weightedOverall({
      impact: 100,
      clarity: 0,
      relevance: 0,
      ats: 0,
      completeness: 0,
    });
    const onlyAts = weightedOverall({
      impact: 0,
      clarity: 0,
      relevance: 0,
      ats: 100,
      completeness: 0,
    });
    expect(onlyImpact).toBeGreaterThan(onlyAts);
  });
});
