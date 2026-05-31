import "server-only";
import { db } from "@/server/db";
import { analysisRepo } from "@/server/repositories/analysis.repo";
import { resumeRepo } from "@/server/repositories/resume.repo";
import { jdRepo } from "@/server/repositories/jd.repo";
import { usageService } from "@/server/services/usage.service";
import { runFullAnalysis } from "@/lib/ai/engine";
import { weightedOverall } from "@/lib/ai/rubrics/score-v1";
import { RUBRIC_VERSION } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { User } from "@/generated/prisma";

interface RunInput {
  resumeId: string;
  resumeVersionId?: string;
  jobDescriptionId?: string;
  deep?: boolean;
}

export const analysisService = {
  get(id: string, userId: string) {
    return analysisRepo.findOwned(id, userId);
  },

  listRecent(userId: string) {
    return analysisRepo.listByUser(userId);
  },

  /**
   * Run a full analysis end-to-end (synchronous for the MVP). Enforces quota,
   * runs the AI pipeline, persists the report + children atomically.
   */
  async run(user: User, input: RunInput) {
    await usageService.assertCanAnalyze(user.id, user.plan);

    const resume = await resumeRepo.findOwned(input.resumeId, user.id);
    if (!resume) throw new AppError("NOT_FOUND", "Resume not found.");

    const version =
      resume.versions.find((v) => v.id === input.resumeVersionId) ??
      resume.versions[0];
    if (!version || version.parseStatus !== "COMPLETED" || !version.parsed) {
      throw new AppError(
        "ANALYSIS_FAILED",
        "This resume hasn't finished parsing yet.",
      );
    }

    let jdText: string | undefined;
    if (input.jobDescriptionId) {
      const jd = await jdRepo.findOwned(input.jobDescriptionId, user.id);
      if (!jd) throw new AppError("NOT_FOUND", "Job description not found.");
      jdText = jd.rawText;
    }

    const type = jdText ? "JD_MATCH" : "STANDALONE";

    const analysis = await analysisRepo.create({
      userId: user.id,
      resumeId: resume.id,
      resumeVersionId: version.id,
      jobDescriptionId: input.jobDescriptionId,
      status: "RUNNING",
      type,
      startedAt: new Date(),
      rubricVersion: RUBRIC_VERSION,
    });

    try {
      const result = await runFullAnalysis({
        rawText: version.rawText ?? "",
        parsedJson: JSON.stringify(version.parsed),
        jdText,
        deep: input.deep,
      });

      const overall = weightedOverall(result.score.subScores);

      await db.$transaction(async (tx) => {
        await tx.analysis.update({
          where: { id: analysis.id },
          data: {
            status: "COMPLETED",
            overallScore: overall,
            subScores: result.score.subScores,
            summary: result.score.summary,
            modelUsed: result.usage.model,
            tokensInput: result.usage.tokensInput,
            tokensOutput: result.usage.tokensOutput,
            costCents: result.usage.costCents,
            completedAt: new Date(),
          },
        });

        await tx.atsReport.create({
          data: {
            analysisId: analysis.id,
            score: result.ats.score,
            findings: result.ats.findings,
          },
        });

        if (result.match) {
          await tx.matchResult.create({
            data: {
              analysisId: analysis.id,
              matchScore: result.match.matchScore,
              matched: result.match.matched,
              weak: result.match.weak,
              missing: result.match.missing,
              keywordCoverage: result.match.keywordCoverage,
            },
          });
        }

        if (result.suggestions.length > 0) {
          await tx.suggestion.createMany({
            data: result.suggestions.map((s) => ({
              analysisId: analysis.id,
              category: s.category,
              priority: s.priority,
              section: s.section,
              title: s.title,
              rationale: s.rationale,
              before: s.before,
              after: s.after,
            })),
          });
        }
      });

      await usageService.record(
        user.id,
        type === "JD_MATCH" ? "ANALYSIS_JD_MATCH" : "ANALYSIS_STANDALONE",
        analysis.id,
        result.usage.costCents,
      );

      return { analysisId: analysis.id, status: "COMPLETED" as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      logger.error("Analysis failed", { analysisId: analysis.id, message });
      await analysisRepo.update(analysis.id, {
        status: "FAILED",
        failureReason: message,
      });
      throw err;
    }
  },
};
