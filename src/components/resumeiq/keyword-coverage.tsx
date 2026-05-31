"use client";

import { motion } from "framer-motion";
import { useInView } from "@/hooks/use-in-view";

interface KeywordCoverageProps {
  found: number;
  missing: number;
  density: number;
}

/** Slim coverage bar for JD keyword overlap (found vs. missing + density %). */
export function KeywordCoverage({
  found,
  missing,
  density,
}: KeywordCoverageProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const total = found + missing;
  const pct = total > 0 ? (found / total) * 100 : 0;

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Keyword coverage</span>
        <span className="font-medium tabular-nums">
          {found}/{total}
          <span className="ml-2 text-muted-foreground">
            {Math.round(density * 100)}% density
          </span>
        </span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
