import "server-only";
import { db } from "@/server/db";
import { isDemoMode } from "@/lib/dev-mode";
import { demoStore } from "@/server/demo/store";
import type { Plan } from "@/generated/prisma";

export const userRepo = {
  findByClerkId(clerkId: string) {
    if (isDemoMode()) return Promise.resolve(demoStore.findUserByClerkId(clerkId));
    return db.user.findUnique({ where: { clerkId } });
  },

  upsertFromClerk(data: {
    clerkId: string;
    email: string;
    name?: string | null;
    imageUrl?: string | null;
  }) {
    if (isDemoMode()) return Promise.resolve(demoStore.upsertUser(data));
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
    if (isDemoMode()) return Promise.resolve(demoStore.setUserPlan(clerkId, plan));
    return db.user.update({ where: { clerkId }, data: { plan } });
  },

  deleteByClerkId(clerkId: string) {
    if (isDemoMode()) return Promise.resolve(demoStore.deleteUser(clerkId));
    return db.user.delete({ where: { clerkId } });
  },
};
