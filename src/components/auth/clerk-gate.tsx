"use client";

import {
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  UserButton as ClerkUserButton,
} from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/auth/clerk";
import { DemoUserMenu } from "@/components/auth/demo-user-menu";

/**
 * Clerk control components that no-op gracefully when Clerk is disabled in local
 * dev (placeholder credentials). Without this, `<SignedIn>`/`<SignedOut>` etc.
 * throw because there is no `<ClerkProvider>` in the tree. When Clerk is not
 * configured we treat the visitor as signed out, so public routes render.
 */
const configured = isClerkConfigured();

export function SignedIn({ children }: { children: React.ReactNode }) {
  if (!configured) return null;
  return <ClerkSignedIn>{children}</ClerkSignedIn>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  if (!configured) return <>{children}</>;
  return <ClerkSignedOut>{children}</ClerkSignedOut>;
}

export function UserButton(
  props: React.ComponentProps<typeof ClerkUserButton>,
) {
  // In demo mode there is no Clerk session; show the local demo account control.
  if (!configured) return <DemoUserMenu />;
  return <ClerkUserButton {...props} />;
}
