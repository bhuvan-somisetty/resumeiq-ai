import "server-only";
import { PrismaClient } from "@/generated/prisma";

/**
 * Prisma client singleton. Avoids exhausting connections during dev HMR.
 * Only repositories should import this (see /docs/07-Folder-Structure.md §7.4).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
