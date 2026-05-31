import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GapListProps {
  matched: string[];
  weak: string[];
  missing: string[];
}

const columns = [
  {
    key: "matched" as const,
    title: "Matched",
    icon: CheckCircle2,
    color: "text-success",
    chip: "border-success/30 bg-success/10 text-success",
  },
  {
    key: "weak" as const,
    title: "Weak",
    icon: AlertCircle,
    color: "text-warning",
    chip: "border-warning/30 bg-warning/10 text-warning",
  },
  {
    key: "missing" as const,
    title: "Missing",
    icon: XCircle,
    color: "text-destructive",
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
  },
];

export function GapList({ matched, weak, missing }: GapListProps) {
  const data = { matched, weak, missing };
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {columns.map((col) => {
        const items = data[col.key];
        const Icon = col.icon;
        return (
          <div key={col.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className={cn("size-4", col.color)} />
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <span className="text-xs text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.length === 0 ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : (
                items.map((item) => (
                  <span
                    key={item}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs font-medium",
                      col.chip,
                    )}
                  >
                    {item}
                  </span>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
