import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { AtsFinding, AtsSeverity } from "@/types/domain";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  AtsSeverity,
  { icon: typeof CheckCircle2; color: string; bg: string; label: string }
> = {
  pass: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    label: "Pass",
  },
  warn: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Warning",
  },
  fail: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Fail",
  },
};

export function AtsFindingItem({ finding }: { finding: AtsFinding }) {
  const c = CONFIG[finding.severity];
  const Icon = c.icon;
  return (
    <div className="flex gap-3 rounded-lg border border-border p-4">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          c.bg,
        )}
      >
        <Icon className={cn("size-4", c.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{finding.message}</p>
        {finding.fix && (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Fix: </span>
            {finding.fix}
          </p>
        )}
      </div>
      <span className={cn("text-xs font-medium", c.color)}>{c.label}</span>
    </div>
  );
}
