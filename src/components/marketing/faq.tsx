"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How does the ATS check work?",
    a: "We parse your resume the way an Applicant Tracking System would, then flag anything that could trip it up — multi-column layouts, tables, missing contact fields, non-standard headings — with a specific fix for each.",
  },
  {
    q: "Will the AI invent experience I don't have?",
    a: "Never. Every suggestion is grounded in content already in your resume. We rewrite and sharpen what's there; we don't fabricate roles, skills, or metrics.",
  },
  {
    q: "What file types can I upload?",
    a: "PDF and DOCX, up to 10MB. For best results, upload a text-based PDF rather than a scanned image.",
  },
  {
    q: "Do I need an account?",
    a: "No. Every analysis is free and unlimited — upload a resume and get your full ResumeScore, ATS report, and job-description matching with no account and no limits. Sign up only if you want to save your history and track progress over time.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your resume is encrypted, accessed only through signed URLs, and you can delete everything — files and derived data — in one click.",
  },
];

export function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
        </Reveal>

        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium">{item.q}</span>
                  <Plus
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
                      isOpen && "rotate-45",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
