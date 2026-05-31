"use client";

import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";
import { useInView } from "@/hooks/use-in-view";
import { scoreHealth, scoreHealthLabel, cn } from "@/lib/utils";

const HEALTH_COLOR: Record<string, string> = {
  strong: "var(--success)",
  ok: "var(--warning)",
  weak: "var(--destructive)",
};

interface ScoreGaugeProps {
  score: number;
  label: string;
  caption?: string;
  size?: number;
  className?: string;
}

/**
 * Semicircular gauge — used for ATS and recruiter (match) scores. Distinct from
 * the full ScoreRing so the report has visual variety, not five identical rings.
 */
export function ScoreGauge({
  score,
  label,
  caption,
  size = 200,
  className,
}: ScoreGaugeProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const display = useCountUp(clamped, 1100, inView);
  const color = HEALTH_COLOR[scoreHealth(clamped)];

  const stroke = 14;
  const r = (size - stroke) / 2;
  const cy = size / 2;
  // Semicircle arc length
  const arc = Math.PI * r;
  const offset = arc - (clamped / 100) * arc;
  const height = size / 2 + stroke;

  return (
    <div
      ref={ref}
      className={cn("flex flex-col items-center", className)}
      role="img"
      aria-label={`${label}: ${clamped} out of 100, ${scoreHealthLabel(clamped)}`}
    >
      <div style={{ width: size, height }} className="relative">
        <svg width={size} height={height}>
          <path
            d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <motion.path
            d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={arc}
            initial={{ strokeDashoffset: arc }}
            animate={inView ? { strokeDashoffset: offset } : {}}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span
            className="text-4xl font-semibold tabular-nums leading-none"
            style={{ color }}
          >
            {display}
          </span>
          <span className="mt-1 text-xs font-medium text-muted-foreground">
            {scoreHealthLabel(clamped)}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-sm font-semibold">{label}</p>
        {caption && (
          <p className="text-xs text-muted-foreground">{caption}</p>
        )}
      </div>
    </div>
  );
}
