import "server-only";
import { db } from "@/server/db";
import { isDemoMode } from "@/lib/dev-mode";
import { demoStore } from "@/server/demo/store";

export const jdRepo = {
  create(
    userId: string,
    data: { title?: string; company?: string; rawText: string },
  ) {
    if (isDemoMode()) return Promise.resolve(demoStore.createJd(userId, data));
    return db.jobDescription.create({ data: { userId, ...data } });
  },

  findOwned(id: string, userId: string) {
    if (isDemoMode()) return Promise.resolve(demoStore.findJd(id, userId));
    return db.jobDescription.findFirst({ where: { id, userId } });
  },

  listByUser(userId: string) {
    if (isDemoMode()) return Promise.resolve(demoStore.listJds(userId));
    return db.jobDescription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
};
