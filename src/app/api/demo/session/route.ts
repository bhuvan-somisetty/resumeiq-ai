import { NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE, isDemoMode } from "@/lib/dev-mode";

/**
 * Demo-mode session endpoint. Stands in for Clerk sign-in/out by toggling a
 * single cookie. Only active in demo mode; returns 404 with real credentials.
 */
function guard() {
  if (!isDemoMode()) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Not available." } },
      { status: 404 },
    );
  }
  return null;
}

export async function POST() {
  const blocked = guard();
  if (blocked) return blocked;

  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.set(DEMO_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const blocked = guard();
  if (blocked) return blocked;

  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.set(DEMO_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
