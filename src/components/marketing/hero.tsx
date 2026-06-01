"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  ScanLine,
  Sparkles,
  Target,
  Gauge,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShinyText } from "@/components/marketing/shiny-text";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4";

const CAPABILITIES = [
  { icon: ScanLine, label: "ATS optimization" },
  { icon: Sparkles, label: "AI-powered feedback" },
  { icon: Target, label: "Recruiter readiness" },
  { icon: Gauge, label: "Resume scoring" },
  { icon: FileText, label: "JD matching" },
];

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

// Staggered fade + upward entrance for the centered hero content.
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Subtle parallax: content drifts up and fades as you scroll past the hero.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 130]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  const float = (d: number, delay = 0) =>
    reduce
      ? undefined
      : {
          y: [0, -28, 0],
          x: [0, 16, 0],
          scale: [1, 1.08, 1],
          transition: {
            duration: d,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay,
          },
        };

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] w-full overflow-hidden bg-black text-white"
    >
      {/* Cinematic video background (subtle parallax zoom) */}
      <motion.video
        aria-hidden
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
        style={{ scale: reduce ? 1 : videoScale }}
        className="pointer-events-none absolute inset-0 -z-30 h-full w-full object-cover"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </motion.video>

      {/* Readability overlays */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-black/55" />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-b from-black/80 via-black/30 to-black"
      />

      {/* Floating gradient blobs + animated glow (cinematic depth) */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={float(13)}
          className="absolute -left-24 top-1/4 size-[34rem] rounded-full bg-indigo-600/25 blur-[120px]"
        />
        <motion.div
          animate={float(17, 1.5)}
          className="absolute -right-20 top-1/3 size-[30rem] rounded-full bg-violet-600/25 blur-[120px]"
        />
        <motion.div
          animate={float(15, 0.8)}
          className="absolute bottom-0 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-[130px]"
        />
        <motion.div
          animate={
            reduce
              ? undefined
              : { opacity: [0.35, 0.6, 0.35], scale: [1, 1.12, 1] }
          }
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-[42%] size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.35),transparent_60%)]"
        />
      </div>

      <motion.div
        style={{ y: reduce ? 0 : contentY, opacity: reduce ? 1 : contentOpacity }}
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 sm:px-8"
      >
        {/* Intro split — sits just under the floating navbar */}
        <div className="grid gap-3 pt-28 sm:pt-32 md:grid-cols-2 md:gap-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="max-w-md text-sm text-white/70 sm:text-base"
          >
            ResumeIQ AI reads your resume like a recruiter and an ATS at once —
            then shows you exactly what to fix to land the interview.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
            className="text-sm text-white/70 sm:text-base md:text-right"
          >
            Free, unlimited analysis · no signup required.
          </motion.p>
        </div>

        {/* Center hero */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-1 flex-col items-center justify-center py-16 text-center"
        >
          <motion.p
            variants={item}
            className="text-xs font-medium uppercase tracking-[0.18em] text-white/65 sm:text-sm"
          >
            Premium AI Resume Analysis Platform
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-5 text-balance font-medium leading-[1.05] tracking-tight text-5xl md:text-7xl lg:text-8xl xl:text-[9rem]"
          >
            <span className="block text-white">Your resume,</span>
            <span className="block pb-[0.12em]">
              <ShinyText
                text="interview-ready."
                className="px-[0.04em] leading-[1.12]"
              />
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-pretty text-base text-white/75 sm:text-lg"
          >
            Instant ATS score, recruiter-grade feedback, and job-matched
            rewrites — powered by AI, in under two minutes.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
          >
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="w-full sm:w-auto"
            >
              <Button
                asChild
                size="lg"
                className="group w-full rounded-full bg-white px-7 text-black shadow-xl shadow-indigo-500/20 transition-shadow hover:bg-white hover:shadow-indigo-400/40 sm:w-auto"
              >
                <Link href="/analyze">
                  Analyze Your Resume Free
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="w-full sm:w-auto"
            >
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-full border-white/25 bg-white/5 px-7 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="#how">See Sample Report</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Capability chips — ResumeIQ-specific */}
          <motion.ul
            variants={item}
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
          >
            {CAPABILITIES.map((c) => (
              <li
                key={c.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
              >
                <c.icon className="size-3.5 text-indigo-300" />
                {c.label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex justify-center pb-8"
        >
          <motion.span
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="text-xs text-white/40"
          >
            Scroll to explore
          </motion.span>
        </motion.div>
      </motion.div>
    </section>
  );
}
