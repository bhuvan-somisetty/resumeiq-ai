import "server-only";
import { db } from "@/server/db";

export const jdRepo = {
  create(
    userId: string,
    data: { title?: string; company?: string; rawText: string },
  ) {
    return db.jobDescription.create({ data: { userId, ...data } });
  },

  findOwned(id: string, userId: string) {
    return db.jobDescription.findFirst({ where: { id, userId } });
  },

  listByUser(userId: string) {
    return db.jobDescription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
};
