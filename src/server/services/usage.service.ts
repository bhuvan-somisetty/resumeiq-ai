import "server-only";
import { db } from "@/server/db";
import { PLANS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { Plan, UsageType } from "@/generated/prisma";

function startOfMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export const usageService = {
  /** Analyses used by a user in the current calendar month. */
  async monthlyAnalysisCount(userId: string): Promise<number> {
    return db.usageRecord.count({
      where: {
        userId,
        type: { in: ["ANALYSIS_STANDALONE", "ANALYSIS_JD_MATCH"] },
        createdAt: { gte: startOfMonth() },
      },
    });
  },

  async getUsage(userId: string, plan: Plan) {
    const used = await this.monthlyAnalysisCount(userId);
    const limit = PLANS[plan].analysesPerMonth;
    const resetsAt = new Date(startOfMonth());
    resetsAt.setUTCMonth(resetsAt.getUTCMonth() + 1);
    return { used, limit, unlimited: limit === -1, resetsAt };
  },

  /** Enforce the monthly quota before a metered action. Throws if exceeded. */
  async assertCanAnalyze(userId: string, plan: Plan): Promise<void> {
    const { used, limit, resetsAt } = await this.getUsage(userId, plan);
    if (limit !== -1 && used >= limit) {
      throw new AppError(
        "QUOTA_EXCEEDED",
        `You've used all ${limit} analyses on the ${PLANS[plan].name} plan this month.`,
        { limit, used, resetsAt, upgradeUrl: "/pricing" },
      );
    }
  },

  record(
    userId: string,
    type: UsageType,
    analysisId?: string,
    costCents?: number,
  ) {
    return db.usageRecord.create({
      data: { userId, type, analysisId, costCents },
    });
  },
};
