"use client";

import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";
import { useInView } from "@/hooks/use-in-view";

const stats = [
  { value: 92, suffix: "%", label: "of resumes hit an ATS first" },
  { value: 6, suffix: "s", label: "average recruiter first scan" },
  { value: 3, suffix: "x", label: "more callbacks when tailored" },
  { value: 5, suffix: "", label: "scoring dimensions, explained" },
];

export function StatsBand() {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <section className="border-y border-border bg-card/40">
      <div
        ref={ref}
        className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-5 py-12 sm:grid-cols-4"
      >
        {stats.map((s, i) => (
          <Stat key={s.label} {...s} inView={inView} delay={i * 0.1} />
        ))}
      </div>
    </section>
  );
}

function Stat({
  value,
  suffix,
  label,
  inView,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  inView: boolean;
  delay: number;
}) {
  const display = useCountUp(value, 1300, inView);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="px-4 text-center"
    >
      <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
        <span className="text-gradient">
          {display}
          {suffix}
        </span>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}
