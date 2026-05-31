import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty state with the signature dotted-grid + soft glow backdrop.
 * Every list/section uses this so empty surfaces feel designed, not blank.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-dashed border-border bg-card",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]"
      />
      <div className="relative flex flex-col items-center gap-5 px-6 py-16 text-center">
        <div className="relative">
          <div className="absolute inset-0 -z-10 animate-pulse rounded-2xl bg-primary/20 blur-xl" />
          <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm [&_svg]:size-7">
            {icon}
          </div>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {action}
      </div>
    </div>
  );
}
