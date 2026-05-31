import "server-only";
import { db } from "@/server/db";
import type { Plan } from "@/generated/prisma";

export const userRepo = {
  findByClerkId(clerkId: string) {
    return db.user.findUnique({ where: { clerkId } });
  },

  upsertFromClerk(data: {
    clerkId: string;
    email: string;
    name?: string | null;
    imageUrl?: string | null;
  }) {
    return db.user.upsert({
      where: { clerkId: data.clerkId },
      update: {
        email: data.email,
        name: data.name ?? undefined,
        imageUrl: data.imageUrl ?? undefined,
      },
      create: {
        clerkId: data.clerkId,
        email: data.email,
        name: data.name ?? undefined,
        imageUrl: data.imageUrl ?? undefined,
      },
    });
  },

  setPlan(clerkId: string, plan: Plan) {
    return db.user.update({ where: { clerkId }, data: { plan } });
  },

  deleteByClerkId(clerkId: string) {
    return db.user.delete({ where: { clerkId } });
  },
};
