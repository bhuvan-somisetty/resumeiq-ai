import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="ResumeIQ AI home"
    >
      <span className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-sm">
        <span className="text-sm font-bold text-primary-foreground">R</span>
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-success ring-2 ring-background" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        ResumeIQ<span className="text-muted-foreground"> AI</span>
      </span>
    </Link>
  );
}
