"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { scoreHealth } from "@/lib/utils";

const HEALTH_BG: Record<string, string> = {
  strong: "bg-success",
  ok: "bg-warning",
  weak: "bg-destructive",
};

interface SubScoreBarProps {
  label: string;
  value: number;
  hint?: string;
  index?: number;
}

export function SubScoreBar({ label, value, hint, index = 0 }: SubScoreBarProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        {hint ? (
          <Tooltip>
            <TooltipTrigger className="cursor-help text-muted-foreground underline decoration-dotted underline-offset-4">
              {label}
            </TooltipTrigger>
            <TooltipContent>{hint}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">{label}</span>
        )}
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={`h-full rounded-full ${HEALTH_BG[scoreHealth(value)]}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: index * 0.08, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
