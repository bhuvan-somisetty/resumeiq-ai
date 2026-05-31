import "server-only";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma";

export const analysisRepo = {
  create(data: Prisma.AnalysisUncheckedCreateInput) {
    return db.analysis.create({ data });
  },

  findOwned(id: string, userId: string) {
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
    return db.analysis.update({ where: { id }, data });
  },

  listByUser(userId: string, take = 10) {
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
