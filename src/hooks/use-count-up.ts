"use client";

import * as React from "react";

/**
 * Animate a number from 0 → target with an ease-out curve, starting when the
 * caller flags it visible. Respects prefers-reduced-motion.
 */
export function useCountUp(target: number, durationMs = 1200, start = true) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (!start) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);

  return value;
}
