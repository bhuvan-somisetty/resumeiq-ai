import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Everything you need to test the waters.",
    cta: "Get started",
    href: "/sign-up",
    highlighted: false,
    features: [
      "3 analyses per month",
      "1 saved resume",
      "ResumeScore + ATS report",
      "Top fixes per analysis",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    desc: "For active job seekers who want every edge.",
    cta: "Upgrade to Pro",
    href: "/sign-up",
    highlighted: true,
    features: [
      "Unlimited analyses",
      "Unlimited saved resumes",
      "Job-description gap analysis",
      "PDF export & shareable reports",
      "Version history & score tracking",
      "Deep-reasoning mode",
    ],
  },
  {
    name: "Teams",
    price: "$49",
    period: "per seat / month",
    desc: "Recruiter tools for hiring teams.",
    cta: "Coming soon",
    href: "#",
    highlighted: false,
    features: [
      "Everything in Pro",
      "Bulk candidate ranking",
      "Shared workspaces",
      "ATS integrations",
    ],
  },
];

export default function PricingPage() {
  return (
    <section className="pt-32 pb-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when you&apos;re ready to land the offer.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.08}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-card p-8",
                  tier.highlighted
                    ? "border-primary shadow-xl shadow-primary/10"
                    : "border-border",
                )}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{tier.desc}</p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {tier.period}
                  </span>
                </div>

                <Button
                  asChild
                  variant={tier.highlighted ? "default" : "outline"}
                  className="mt-6"
                  disabled={tier.href === "#"}
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>

                <ul className="mt-8 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
