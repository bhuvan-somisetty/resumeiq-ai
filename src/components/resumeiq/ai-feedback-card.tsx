"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiFeedbackCardProps {
  summary: string;
  topFixes?: string[];
  model?: string | null;
}

/**
 * The headline "AI verdict" card — the human-readable takeaway at the top of a
 * report. Designed to feel like a coach speaking, not a data dump.
 */
export function AiFeedbackCard({
  summary,
  topFixes = [],
  model,
}: AiFeedbackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
    >
      <div
        aria-hidden
        className="aurora pointer-events-none absolute -right-20 -top-20 h-56 w-56 opacity-40 blur-2xl"
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <span className="text-sm font-semibold">AI verdict</span>
          {model && (
            <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {model}
            </span>
          )}
        </div>

        <p className="mt-4 text-pretty text-base leading-relaxed">{summary}</p>

        {topFixes.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <TrendingUp className="size-3.5" /> Highest-impact fixes
            </p>
            <ul className="space-y-1.5">
              {topFixes.map((fix, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm",
                  )}
                >
                  <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>{fix}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
