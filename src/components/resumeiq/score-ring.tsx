"use client";

import { motion } from "framer-motion";
import { cn, scoreHealth, scoreHealthLabel } from "@/lib/utils";

const HEALTH_COLOR: Record<string, string> = {
  strong: "var(--success)",
  ok: "var(--warning)",
  weak: "var(--destructive)",
};

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
}

/**
 * Signature radial score visual (0–100). Color-coded by health bucket with a
 * text label so meaning never relies on color alone (a11y, /docs §5.8).
 */
export function ScoreRing({
  score,
  size = 132,
  strokeWidth = 10,
  label,
  showLabel = true,
  className,
  animate = true,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = HEALTH_COLOR[scoreHealth(clamped)];

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${clamped} out of 100 — ${scoreHealthLabel(clamped)}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: animate ? circumference : offset }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold tabular-nums leading-none"
          style={{ fontSize: size * 0.3, color }}
        >
          {clamped}
        </span>
        {showLabel && (
          <span className="mt-1 text-xs font-medium text-muted-foreground">
            {label ?? scoreHealthLabel(clamped)}
          </span>
        )}
      </div>
    </div>
  );
}
