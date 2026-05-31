import { Star } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

const testimonials = [
  {
    quote:
      "I'd been applying for weeks with nothing. ResumeIQ showed me my bullets had zero metrics. Rewrote them, got three callbacks the next week.",
    name: "Priya S.",
    role: "Backend Engineer",
    initial: "P",
  },
  {
    quote:
      "The JD match is the killer feature. Seeing exactly which keywords I was missing for a specific role felt like cheating — in a good way.",
    name: "Marcus T.",
    role: "Career switcher → PM",
    initial: "M",
  },
  {
    quote:
      "As a new grad I had no idea if my resume was any good. The ATS report alone caught formatting issues I never would've found.",
    name: "Sofia L.",
    role: "New grad, CS",
    initial: "S",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Loved by job seekers</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Real feedback, real callbacks
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <RevealItem key={t.name}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-pretty text-sm leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-primary-foreground">
                    {t.initial}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
