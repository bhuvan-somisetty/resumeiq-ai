import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/auth/clerk";
import { DEMO_SESSION_COOKIE } from "@/lib/dev-mode";

/** Protect the authenticated app surface (see /docs/02-System-Architecture.md §2.6). */
const isProtectedRoute = createRouteMatcher(["/app(.*)"]);

const withClerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

/**
 * In local demo mode (placeholder Clerk creds) we protect /app with the demo
 * session cookie and redirect to /sign-in when absent — keeping the same
 * "protected app surface" contract without Clerk. Real credentials re-enable
 * full Clerk-based protection.
 */
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured()) {
    if (isProtectedRoute(req)) {
      const signedIn = req.cookies.get(DEMO_SESSION_COOKIE)?.value === "1";
      if (!signedIn) {
        const url = req.nextUrl.clone();
        url.pathname = "/sign-in";
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }
  return withClerk(req, event);
}

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|svg|png|ico|webp|woff2?|ttf|otf)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
