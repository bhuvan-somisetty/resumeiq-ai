import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/marketing/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden border-r border-border bg-card lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="aurora animate-aurora pointer-events-none absolute inset-0 opacity-40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid opacity-50"
        />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            Trusted resume intelligence
          </div>
          <blockquote className="text-2xl font-medium leading-snug tracking-tight">
            &ldquo;ResumeIQ told me exactly what recruiters were missing — I
            rewrote four bullets and started getting callbacks.&rdquo;
          </blockquote>
          <p className="text-sm text-muted-foreground">
            — A job seeker who landed the interview
          </p>
        </div>
        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} ResumeIQ AI
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center px-5 py-12">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <div className="w-full max-w-sm">{children}</div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="/" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
