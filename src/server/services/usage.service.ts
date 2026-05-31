import "server-only";
import { db } from "@/server/db";
import { isDemoMode } from "@/lib/dev-mode";
import { demoStore } from "@/server/demo/store";
import { PLANS } from "@/lib/constants";
import type { Plan, UsageType } from "@/generated/prisma";

function startOfMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export const usageService = {
  /** Analyses used by a user in the current calendar month. */
  async monthlyAnalysisCount(userId: string): Promise<number> {
    if (isDemoMode()) return demoStore.monthlyAnalysisCount(userId);
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

  /** Quotas are disabled — analyses are unlimited for everyone. */
  async assertCanAnalyze(_userId: string, _plan: Plan): Promise<void> {
    return;
  },

  record(
    userId: string,
    type: UsageType,
    analysisId?: string,
    costCents?: number,
  ) {
    if (isDemoMode())
      return Promise.resolve(
        demoStore.recordUsage({ userId, type, analysisId, costCents }),
      );
    return db.usageRecord.create({
      data: { userId, type, analysisId, costCents },
    });
  },
};
