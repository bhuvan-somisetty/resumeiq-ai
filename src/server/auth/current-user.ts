import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { userRepo } from "@/server/repositories/user.repo";
import { AppError } from "@/lib/errors";
import type { User } from "@/generated/prisma";

/**
 * Resolve the internal User for the current Clerk session, creating the row on
 * first sight (lazy sync — complements the Clerk webhook). Throws if signed out.
 */
export async function requireUser(): Promise<User> {
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
  const { userId } = await auth();
  if (!userId) return null;
  return userRepo.findByClerkId(userId);
}
