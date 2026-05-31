"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Target, FileCheck2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mode = "standalone" | "jd";

const STEPS = [
  "Reading your resume",
  "Scoring across 5 dimensions",
  "Auditing ATS compatibility",
  "Writing your improvements",
];

export function RunAnalysisPanel({
  resumeId,
  ready,
}: {
  resumeId: string;
  ready: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("standalone");
  const [jdTitle, setJdTitle] = React.useState("");
  const [jdText, setJdText] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);

  // Advance the visual stepper while the request is in flight.
  React.useEffect(() => {
    if (!running) return;
    setActiveStep(0);
    const id = setInterval(
      () => setActiveStep((s) => Math.min(s + 1, STEPS.length - 1)),
      3500,
    );
    return () => clearInterval(id);
  }, [running]);

  async function run() {
    if (mode === "jd" && jdText.trim().length < 50) {
      toast.error("Paste the full job description (at least 50 characters).");
      return;
    }
    setRunning(true);
    try {
      let jobDescriptionId: string | undefined;
      if (mode === "jd") {
        const jr = await fetch("/api/job-descriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: jdTitle.trim() || undefined,
            rawText: jdText.trim(),
          }),
        });
        const jb = await jr.json();
        if (!jr.ok) throw new Error(jb?.error?.message ?? "Invalid job post");
        jobDescriptionId = jb.data.id;
      }

      const r = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobDescriptionId }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body?.error?.message ?? "Analysis failed");

      router.push(`/app/analyses/${body.data.analysisId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
      setRunning(false);
    }
  }

  if (running) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="size-7 text-primary" />
          <Loader2 className="absolute -right-1.5 -top-1.5 size-6 animate-spin text-primary" />
        </div>
        <div>
          <p className="font-medium">Analyzing your resume…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This usually takes 15–30 seconds.
          </p>
        </div>
        <ul className="w-full max-w-xs space-y-2 text-left">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className={cn(
                "flex items-center gap-2.5 text-sm transition-colors",
                i <= activeStep ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border",
                  i < activeStep
                    ? "border-success bg-success text-success-foreground"
                    : i === activeStep
                      ? "border-primary text-primary"
                      : "border-border",
                )}
              >
                {i < activeStep ? (
                  <Check className="size-3" />
                ) : i === activeStep ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : null}
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <ModeOption
          active={mode === "standalone"}
          onClick={() => setMode("standalone")}
          icon={<FileCheck2 className="size-5" />}
          title="Standalone"
          desc="Score + ATS report"
        />
        <ModeOption
          active={mode === "jd"}
          onClick={() => setMode("jd")}
          icon={<Target className="size-5" />}
          title="Target a job"
          desc="Match + gap analysis"
        />
      </div>

      <AnimatePresence initial={false}>
        {mode === "jd" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <Input
              placeholder="Job title (optional) — e.g. Senior Backend Engineer"
              value={jdTitle}
              onChange={(e) => setJdTitle(e.target.value)}
            />
            <Textarea
              placeholder="Paste the full job description here…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="min-h-40"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Button onClick={run} disabled={!ready} className="w-full" size="lg">
        <Sparkles className="size-4" />
        {ready ? "Run analysis" : "Resume still processing…"}
      </Button>
    </div>
  );
}

function ModeOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:border-primary/40 hover:bg-secondary/40",
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-lg",
          active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}
