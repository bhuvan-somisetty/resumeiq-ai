import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { userRepo } from "@/server/repositories/user.repo";
import { AppError } from "@/lib/errors";
import { isDemoMode } from "@/lib/dev-mode";
import { demoStore } from "@/server/demo/store";
import { hasDemoSession } from "@/server/demo/auth";
import type { User } from "@/generated/prisma";

/**
 * Resolve the internal User for the current Clerk session, creating the row on
 * first sight (lazy sync — complements the Clerk webhook). Throws if signed out.
 * In demo mode, resolves the single demo user from a cookie session.
 */
export async function requireUser(): Promise<User> {
  if (isDemoMode()) {
    if (!(await hasDemoSession())) {
      throw new AppError("UNAUTHENTICATED", "You must be signed in.");
    }
    return demoStore.ensureUser();
  }

  const { userId } = await auth();
  if (!userId) {
    throw new AppError("UNAUTHENTICATED", "You must be signed in.");
  }

  const existing = await userRepo.findByClerkId(userId);
  if (existing) return existing;

  const clerk = await currentUser();
  const email =
    clerk?.emailAddresses?.[0]?.emailAddress ?? `${userId}@placeholder.local`;
  const name =
    [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ") || null;

  return userRepo.upsertFromClerk({
    clerkId: userId,
    email,
    name,
    imageUrl: clerk?.imageUrl ?? null,
  });
}

/** Like requireUser but returns null instead of throwing. */
export async function getOptionalUser(): Promise<User | null> {
  if (isDemoMode()) {
    if (!(await hasDemoSession())) return null;
    return demoStore.ensureUser();
  }

  const { userId } = await auth();
  if (!userId) return null;
  return userRepo.findByClerkId(userId);
}
