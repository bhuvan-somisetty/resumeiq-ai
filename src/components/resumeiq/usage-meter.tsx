import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageMeterProps {
  used: number;
  limit: number;
  unlimited: boolean;
}

/** Compact quota indicator for the app header. */
export function UsageMeter({ used, limit, unlimited }: UsageMeterProps) {
  if (unlimited) {
    return (
      <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
        <Zap className="size-3.5 text-primary" /> Pro · unlimited
      </span>
    );
  }

  const remaining = Math.max(0, limit - used);
  const low = remaining <= 1;

  return (
    <Link
      href="/pricing"
      className={cn(
        "hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:inline-flex",
        low
          ? "border-warning/40 bg-warning/10 text-warning hover:bg-warning/15"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="flex gap-0.5">
        {Array.from({ length: limit }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3 w-1 rounded-full",
              i < used ? "bg-current opacity-90" : "bg-current opacity-25",
            )}
          />
        ))}
      </span>
      {remaining} left
    </Link>
  );
}
