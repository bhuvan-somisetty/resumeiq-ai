"use client";

import { motion } from "framer-motion";
import {
  Gauge,
  ScanLine,
  Target,
  Wand2,
  History,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ScoreRing } from "@/components/resumeiq/score-ring";
import { cn } from "@/lib/utils";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

/**
 * Bento-grid feature showcase (Linear/Vercel style) — mixed-size cells with one
 * "hero" cell containing a live mini-visual instead of a flat icon list.
 */
export function Bento() {
  return (
    <section id="features" className="border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Everything you need</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            From guesswork to a clear plan
          </h2>
          <p className="mt-4 text-muted-foreground">
            A focused toolkit that turns a black-box hiring process into specific,
            actionable feedback.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {/* Hero cell — spans 2 cols */}
          <Cell className="md:col-span-2 md:row-span-1" delay={0}>
            <div className="flex h-full flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-xs">
                <Icon>
                  <Gauge />
                </Icon>
                <h3 className="mt-4 font-semibold">
                  Multi-dimensional ResumeScore
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  One number you can trust, broken into five explained
                  dimensions — impact, clarity, relevance, ATS and completeness.
                </p>
              </div>
              <div className="shrink-0">
                <ScoreRing score={84} size={132} />
              </div>
            </div>
          </Cell>

          <Cell delay={0.08}>
            <Icon>
              <ScanLine />
            </Icon>
            <h3 className="mt-4 font-semibold">ATS compatibility audit</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Catch parsing and formatting issues that silently filter you out.
            </p>
          </Cell>

          <Cell delay={0.16}>
            <Icon>
              <Target />
            </Icon>
            <h3 className="mt-4 font-semibold">Job-description matching</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              See matched, weak, and missing requirements for any role.
            </p>
          </Cell>

          <Cell delay={0.24}>
            <Icon>
              <Wand2 />
            </Icon>
            <h3 className="mt-4 font-semibold">Rewrite-ready suggestions</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bullet-level before → after rewrites, grounded in your real
              experience.
            </p>
          </Cell>

          <Cell delay={0.32}>
            <div className="flex h-full items-start gap-4">
              <div className="flex-1">
                <Icon>
                  <History />
                </Icon>
                <h3 className="mt-4 font-semibold">Track your progress</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every re-upload is a version. Watch your score climb.
                </p>
              </div>
              <div className="hidden shrink-0 items-end gap-1 sm:flex">
                {[40, 58, 72, 84].map((h, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: h }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 * i, ease }}
                    className="w-3 rounded-t bg-gradient-to-t from-primary/40 to-primary"
                  />
                ))}
              </div>
            </div>
          </Cell>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-1">
          <Cell delay={0.1}>
            <div className="flex items-center gap-4">
              <Icon>
                <ShieldCheck />
              </Icon>
              <div>
                <h3 className="font-semibold">Private by design</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Encrypted storage, signed access, and one-click delete of
                  everything. Your resume is your data.
                </p>
              </div>
            </div>
          </Cell>
        </div>
      </div>
    </section>
  );
}

function Cell({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease }}
      className={cn(
        "group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110 [&_svg]:size-5">
      {children}
    </div>
  );
}
