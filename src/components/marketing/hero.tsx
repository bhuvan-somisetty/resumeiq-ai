"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, FileCheck2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/resumeiq/score-ring";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const subScores = [
  { label: "Impact", value: 72 },
  { label: "Clarity", value: 88 },
  { label: "Relevance", value: 70 },
  { label: "ATS", value: 91 },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-grid opacity-60 [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]"
      />
      <div
        aria-hidden
        className="aurora animate-aurora pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[520px] w-[820px] -translate-x-1/2 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
          >
            <Sparkles className="size-3.5 text-primary" />
            Now with job-description gap analysis
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.05 }}
            className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Know exactly why your resume{" "}
            <span className="text-gradient">gets passed over</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.12 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground"
          >
            ResumeIQ scores your resume, audits it for ATS systems, and rewrites
            it to match the job you actually want — in under two minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.2 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/analyze">
                Upload resume — free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href="#how">See how it works</Link>
            </Button>
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">
            No account required · unlimited free analyses
          </p>
        </div>

        {/* Product preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.3 }}
          className="relative mx-auto mt-16 max-w-4xl"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-card/70 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-3">
              <span className="size-2.5 rounded-full bg-destructive/60" />
              <span className="size-2.5 rounded-full bg-warning/60" />
              <span className="size-2.5 rounded-full bg-success/60" />
              <span className="ml-3 text-xs text-muted-foreground">
                Senior Backend Engineer · analysis
              </span>
            </div>

            <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center justify-center">
                <ScoreRing score={84} size={150} />
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <FileCheck2 className="size-3.5" /> ATS-ready
                </div>
              </div>

              <div className="space-y-4">
                {subScores.map((s, i) => (
                  <div key={s.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium tabular-nums">{s.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${s.value}%` }}
                        transition={{
                          duration: 1,
                          delay: 0.6 + i * 0.12,
                          ease,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                  <Target className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Add 4 missing keywords
                    </span>{" "}
                    from the job description: Terraform, gRPC, SLOs, Kafka.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
