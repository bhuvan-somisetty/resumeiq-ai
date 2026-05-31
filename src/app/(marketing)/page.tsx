import Link from "next/link";
import { Upload, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { StatsBand } from "@/components/marketing/stats-band";
import { Bento } from "@/components/marketing/bento";
import { Testimonials } from "@/components/marketing/testimonials";
import { Faq } from "@/components/marketing/faq";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Upload,
    title: "Upload your resume",
    desc: "Drop a PDF or DOCX. We parse it into structured data in seconds.",
  },
  {
    icon: Sparkles,
    title: "Get your analysis",
    desc: "Instant score, ATS report, and a prioritized list of concrete fixes.",
  },
  {
    icon: TrendingUp,
    title: "Tailor & improve",
    desc: "Add a job description, apply the rewrites, and re-run to see the lift.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <Bento />

      {/* How it works */}
      <section id="how" className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Three steps to a stronger resume
            </h2>
          </Reveal>

          <div className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            />
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                    <s.icon className="size-6 text-primary" />
                    <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold">{s.title}</h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
      <Faq />

      {/* CTA */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center sm:px-12">
              <div
                aria-hidden
                className="aurora animate-aurora pointer-events-none absolute inset-0 opacity-50 blur-2xl"
              />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  Your next interview starts with a better resume
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                  Get your first analysis free. See your score and your top fixes
                  in under two minutes.
                </p>
                <Button size="lg" asChild className="mt-8">
                  <Link href="/analyze">
                    Upload your resume — free
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
