"use client";

import * as React from "react";
import { ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SuggestionCategory, SuggestionPriority } from "@/types/domain";

export interface SuggestionView {
  id: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  section?: string | null;
  title: string;
  rationale: string;
  before?: string | null;
  after?: string | null;
  helpful?: boolean | null;
}

const PRIORITY_VARIANT: Record<
  SuggestionPriority,
  "destructive" | "warning" | "secondary"
> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

export function SuggestionCard({ suggestion }: { suggestion: SuggestionView }) {
  const [helpful, setHelpful] = React.useState<boolean | null>(
    suggestion.helpful ?? null,
  );

  async function vote(value: boolean) {
    setHelpful(value);
    try {
      await fetch(`/api/suggestions/${suggestion.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful: value }),
      });
    } catch {
      toast.error("Couldn't save your feedback.");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={PRIORITY_VARIANT[suggestion.priority]}>
            {suggestion.priority}
          </Badge>
          <Badge variant="outline">{suggestion.category.replace("_", " ")}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Helpful"
            onClick={() => vote(true)}
            className={cn(
              "rounded-md p-1.5 transition-colors hover:bg-secondary",
              helpful === true && "text-success",
            )}
          >
            <ThumbsUp className="size-4" />
          </button>
          <button
            aria-label="Not helpful"
            onClick={() => vote(false)}
            className={cn(
              "rounded-md p-1.5 transition-colors hover:bg-secondary",
              helpful === false && "text-destructive",
            )}
          >
            <ThumbsDown className="size-4" />
          </button>
        </div>
      </div>

      <h4 className="mt-3 font-semibold">{suggestion.title}</h4>

      {(suggestion.before || suggestion.after) && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          {suggestion.before && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-muted-foreground line-through decoration-destructive/40">
              {suggestion.before}
            </div>
          )}
          {suggestion.before && suggestion.after && (
            <ArrowRight className="mx-auto hidden size-4 text-muted-foreground sm:block" />
          )}
          {suggestion.after && (
            <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-sm">
              {suggestion.after}
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-sm text-muted-foreground">{suggestion.rationale}</p>
    </div>
  );
}
