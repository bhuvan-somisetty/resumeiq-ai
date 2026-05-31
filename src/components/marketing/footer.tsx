import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            AI resume analysis that tells you what to fix — and rewrites it for you.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/sign-in" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ResumeIQ AI. All rights reserved.
      </div>
    </footer>
  );
}
