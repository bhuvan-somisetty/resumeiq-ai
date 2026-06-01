"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function Hero() {
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-black text-white">
      {/* Cinematic video background */}
      <video
        aria-hidden
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>

      {/* Readability overlays */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/65" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/85 via-black/35 to-black"
      />
      <div
        aria-hidden
        className="aurora animate-aurora pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[420px] w-[720px] -translate-x-1/2 opacity-40 blur-3xl"
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 sm:px-8">
        {/* Intro split — sits just under the floating navbar */}
        <div className="grid gap-3 pt-28 sm:pt-32 md:grid-cols-2 md:gap-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="max-w-md text-sm text-white/70 sm:text-base"
          >
            ResumeIQ AI reads your resume like a recruiter and an ATS at once —
            then shows you exactly what to fix to land the interview.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.08 }}
            className="text-sm text-white/70 sm:text-base md:text-right"
          >
            Free, unlimited analysis · no signup required.
          </motion.p>
        </div>

        {/* Center hero */}
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="text-xs font-medium uppercase tracking-tight text-white/70 sm:text-sm"
          >
            Premium AI Resume Analysis Platform
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.15 }}
            className="mt-5 text-balance font-medium leading-[0.85] tracking-tighter text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl"
          >
            <span className="block text-white">Your resume,</span>
            <span className="mt-1 block">
              <ShinyText text="interview-ready." />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.28 }}
            className="mt-6 max-w-xl text-pretty text-base text-white/75 sm:text-lg"
          >
            Instant ATS score, recruiter-grade feedback, and job-matched
            rewrites — powered by AI, in under two minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.36 }}
            className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="group w-full rounded-full bg-white px-7 text-black shadow-lg shadow-black/20 hover:bg-white/90 sm:w-auto"
            >
              <Link href="/analyze">
                Analyze Your Resume Free
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full border-white/25 bg-white/5 px-7 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <Link href="#how">See Sample Report</Link>
            </Button>
          </motion.div>

          {/* Capability chips — ResumeIQ-specific */}
          <motion.ul
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.46 }}
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
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="pb-8 text-center text-xs text-white/40"
        >
          Scroll to explore
        </motion.div>
      </div>
    </section>
  );
}
