import "server-only";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/dev-mode";

/** True when a demo sign-in cookie is present (demo mode's stand-in for Clerk). */
export async function hasDemoSession(): Promise<boolean> {
  const store = await cookies();
  return store.get(DEMO_SESSION_COOKIE)?.value === "1";
}
