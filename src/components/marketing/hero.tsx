"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

export function Hero() {
  const reduce = useReducedMotion();

  const float = (d: number, delay = 0) =>
    reduce
      ? undefined
      : {
          y: [0, -24, 0],
          x: [0, 14, 0],
          scale: [1, 1.08, 1],
          transition: {
            duration: d,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay,
          },
        };

  return (
    // Exactly one viewport tall — the whole hero is visible without scrolling.
    <section className="relative h-[100svh] w-full overflow-hidden bg-black text-white">
      {/* Cinematic video background */}
      <video
        aria-hidden
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 -z-30 h-full w-full object-cover"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>

      {/* Even, readable overlay (no heavy bottom darkening) + navbar contrast */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-black/55" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-20 h-40 bg-gradient-to-b from-black/80 to-transparent"
      />

      {/* Floating gradient blobs + animated glow (cinematic depth) */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={float(13)}
          className="absolute -left-24 top-1/4 size-[30rem] rounded-full bg-indigo-600/25 blur-[120px]"
        />
        <motion.div
          animate={float(17, 1.5)}
          className="absolute -right-20 top-1/3 size-[28rem] rounded-full bg-violet-600/25 blur-[120px]"
        />
        <motion.div
          animate={
            reduce
              ? undefined
              : { opacity: [0.35, 0.6, 0.35], scale: [1, 1.1, 1] }
          }
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 size-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.32),transparent_60%)]"
        />
      </div>

      {/* Centered content — fits within the single screen */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-5 pt-16 text-center sm:px-8"
      >
        <motion.p
          variants={item}
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/65 sm:text-sm"
        >
          Premium AI Resume Analysis Platform
        </motion.p>

        <motion.h1
          variants={item}
          className="mt-4 text-balance font-medium leading-[1.05] tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
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
          className="mt-5 max-w-xl text-pretty text-sm text-white/75 sm:text-base md:text-lg"
        >
          Instant ATS score, recruiter-grade feedback, and job-matched rewrites —
          powered by AI, in under two minutes.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
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
          className="mt-7 flex max-w-3xl flex-wrap items-center justify-center gap-2"
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

      {/* Scroll hint — absolute, so it never adds to the hero's height */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute inset-x-0 bottom-6 z-10 flex justify-center"
      >
        <motion.span
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-xs text-white/40"
        >
          Scroll to explore
        </motion.span>
      </motion.div>
    </section>
  );
}
