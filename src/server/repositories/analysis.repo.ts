import "server-only";
import { db } from "@/server/db";
import { isDemoMode } from "@/lib/dev-mode";
import { demoStore } from "@/server/demo/store";
import type { Prisma } from "@/generated/prisma";

export const analysisRepo = {
  create(data: Prisma.AnalysisUncheckedCreateInput) {
    if (isDemoMode()) return Promise.resolve(demoStore.createAnalysis(data));
    return db.analysis.create({ data });
  },

  findOwned(id: string, userId: string) {
    if (isDemoMode()) return Promise.resolve(demoStore.findAnalysis(id, userId));
    return db.analysis.findFirst({
      where: { id, userId },
      include: {
        atsReport: true,
        matchResult: true,
        suggestions: { orderBy: { createdAt: "asc" } },
        resume: { select: { title: true } },
        jobDescription: { select: { title: true, company: true } },
      },
    });
  },

  update(id: string, data: Prisma.AnalysisUpdateInput) {
    if (isDemoMode()) return Promise.resolve(demoStore.updateAnalysis(id, data));
    return db.analysis.update({ where: { id }, data });
  },

  listByUser(userId: string, take = 10) {
    if (isDemoMode()) return Promise.resolve(demoStore.listAnalyses(userId, take));
    return db.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        resume: { select: { title: true } },
        jobDescription: { select: { title: true } },
      },
    });
  },
};
