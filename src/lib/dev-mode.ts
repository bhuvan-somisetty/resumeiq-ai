import { isClerkConfigured } from "@/lib/auth/clerk";

/**
 * Local demo mode.
 *
 * When real Clerk credentials are absent (local dev with placeholder keys), the
 * app runs in a fully self-contained "demo mode": cookie-based auth instead of
 * Clerk, an in-memory data store instead of Postgres, local file handling
 * instead of UploadThing, and a deterministic stub instead of OpenAI. This lets
 * the entire MVP journey run offline with zero external services.
 *
 * Real credentials switch every subsystem back to its production implementation,
 * so demo mode never affects a real deployment. The single switch is the Clerk
 * key (also a stand-in for "this is an unconfigured local environment").
 *
 * Keyed off the publishable key so it resolves identically on server, client,
 * and edge middleware.
 */
export function isDemoMode(): boolean {
  return !isClerkConfigured();
}

/** Stable identity used for the single demo user. */
export const DEMO_CLERK_ID = "demo-user";
export const DEMO_EMAIL = "demo@resumeiq.local";
export const DEMO_NAME = "Demo User";

/** Cookie that marks an active demo session (set on demo sign-in). */
export const DEMO_SESSION_COOKIE = "resumeiq_demo_session";
