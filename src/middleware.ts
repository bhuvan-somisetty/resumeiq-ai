import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/** Protect the authenticated app surface (see /docs/02-System-Architecture.md §2.6). */
const isProtectedRoute = createRouteMatcher(["/app(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|svg|png|ico|webp|woff2?|ttf|otf)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
