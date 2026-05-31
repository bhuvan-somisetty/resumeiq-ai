"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  accent?: "primary" | "success" | "warning" | "info";
  delay?: number;
}

const ACCENT: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  info: "text-info bg-info/10",
};

/** Compact animated metric tile for the dashboard header band. */
export function StatCard({
  icon,
  label,
  value,
  suffix = "",
  accent = "primary",
  delay = 0,
}: StatCardProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const display = useCountUp(value, 1000, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110 [&_svg]:size-[18px]",
            ACCENT[accent],
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums leading-none">
            {display}
            {suffix}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}
